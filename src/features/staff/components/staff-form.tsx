"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { AppButton, MultiImageUpload, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  DEFAULT_BOOKING_TIMEZONE,
  datetimeLocalToIso,
  formatShiftDateTime,
  formatTimezoneLabel,
  toDatetimeLocalValue,
} from "@/features/booking/lib/schedule-utils";
import { useOptionalTenant } from "@/features/tenants";

import {
  getDefaultStaffFormValues,
  languageOptions,
  nationalityOptions,
  staffStatusOptions,
} from "../config";
import type { StaffFormValues, StaffPhoto, StaffRecord, StaffStatus } from "../types";
import { StaffFormField } from "./staff-form-field";
import { StaffFormSection } from "./staff-form-section";

interface ShiftBookingRow {
  id: string;
  startsAt: string;
  endsAt: string;
  customerName: string | null;
}

function TenantDatetimeField({
  id,
  value,
  min,
  timeZone,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  min?: string;
  timeZone: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
      input.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
      className={cn(
        "relative flex h-10 w-full cursor-pointer items-center rounded-xl border border-border/60 bg-background px-3 text-left text-sm shadow-sm transition-colors",
        "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
      )}
    >
      <span className={value ? "text-foreground" : "text-muted-foreground"}>
        {value
          ? formatShiftDateTime(datetimeLocalToIso(value, timeZone), timeZone)
          : placeholder}
      </span>
      <input
        ref={inputRef}
        id={id}
        type="datetime-local"
        value={value}
        min={min}
        onChange={(event) => {
          const next = event.target.value;
          if (min && next && next < min) {
            onChange(min);
            return;
          }
          onChange(next);
        }}
        onClick={(event) => event.stopPropagation()}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={placeholder}
      />
    </div>
  );
}

const inputClassName =
  "h-10 rounded-xl border-border/60 bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-ring/30";

interface StaffFormProps {
  staffId?: string;
}

async function uploadPhotos(staffId: string, photos: File[]) {
  if (photos.length === 0) return;

  const formData = new FormData();
  photos.forEach((photo) => formData.append("photos", photo));

  const response = await fetch(`/api/admin/staff/${staffId}/photos`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to upload photos.");
  }
}

function mapRecordToForm(record: StaffRecord): StaffFormValues {
  return {
    photos: [],
    name: record.name,
    age: record.attributes.age ?? "",
    height: record.attributes.height ?? "",
    weight: record.attributes.weight ?? "",
    nationality: record.attributes.nationality ?? "",
    languages: record.attributes.languages ?? [],
    experience: record.attributes.experience ?? "",
    introduction: record.attributes.introduction ?? "",
    loginId: "",
    password: "",
    shiftStartsAt: record.shiftStartsAt,
    shiftEndsAt: record.shiftEndsAt,
    status: record.status,
  };
}

export function StaffForm({ staffId }: StaffFormProps) {
  const router = useRouter();
  const tenant = useOptionalTenant();
  const timeZone =
    tenant?.settings.timezone || DEFAULT_BOOKING_TIMEZONE;
  const isEditing = Boolean(staffId);
  const [form, setForm] = useState<StaffFormValues>(() =>
    getDefaultStaffFormValues(timeZone),
  );
  const [existingPhotos, setExistingPhotos] = useState<StaffPhoto[]>([]);
  const [hasLoginAccount, setHasLoginAccount] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [shiftBookings, setShiftBookings] = useState<ShiftBookingRow[]>([]);
  const [localNow, setLocalNow] = useState(() =>
    toDatetimeLocalValue(new Date(), timeZone),
  );

  useEffect(() => {
    const tick = () =>
      setLocalNow(toDatetimeLocalValue(new Date(), timeZone));
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [timeZone]);

  useEffect(() => {
    if (isEditing) return;
    setForm(getDefaultStaffFormValues(timeZone));
  }, [timeZone, isEditing]);

  useEffect(() => {
    if (!staffId) return;

    void (async () => {
      try {
        const response = await fetch(`/api/admin/staff/${staffId}`);
        const data = (await response.json()) as {
          staff?: StaffRecord;
          error?: string;
        };

        if (!response.ok || !data.staff) {
          throw new Error(data.error ?? "Failed to load staff.");
        }

        setForm(mapRecordToForm(data.staff));
        setExistingPhotos(data.staff.photos);

        const accountResponse = await fetch(`/api/admin/staff/${staffId}/account`);
        const accountData = (await accountResponse.json()) as {
          loginId?: string | null;
          hasAccount?: boolean;
        };

        if (accountResponse.ok) {
          setHasLoginAccount(Boolean(accountData.hasAccount));
          if (accountData.loginId) {
            setForm((current) => ({
              ...current,
              loginId: accountData.loginId ?? "",
            }));
          }
        }
      } catch (error) {
        toast.error("Could not load staff", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [staffId]);

  useEffect(() => {
    if (!staffId || !form.shiftStartsAt || !form.shiftEndsAt) {
      setShiftBookings([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const params = new URLSearchParams({
          staffId,
          from: datetimeLocalToIso(form.shiftStartsAt, timeZone),
          to: datetimeLocalToIso(form.shiftEndsAt, timeZone),
        });
        const response = await fetch(`/api/admin/bookings?${params}`);
        const data = (await response.json()) as {
          bookings?: ShiftBookingRow[];
        };
        if (!cancelled && response.ok) {
          setShiftBookings(data.bookings ?? []);
        }
      } catch {
        if (!cancelled) setShiftBookings([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [staffId, form.shiftStartsAt, form.shiftEndsAt, timeZone]);

  const updateField = <K extends keyof StaffFormValues>(
    key: K,
    value: StaffFormValues[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleLanguage = (language: string) => {
    updateField(
      "languages",
      form.languages.includes(language)
        ? form.languages.filter((item) => item !== language)
        : [...form.languages, language],
    );
  };

  const removeExistingPhoto = async (photoId: string) => {
    if (!staffId) return;

    const response = await fetch(
      `/api/admin/staff/${staffId}/photos?photoId=${photoId}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      toast.error("Could not remove photo", { description: data.error });
      return;
    }

    setExistingPhotos((current) =>
      current.filter((photo) => photo.id !== photoId),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (form.shiftStartsAt < localNow) {
      toast.error("Available from must be after the shop's current time");
      return;
    }

    if (form.shiftEndsAt <= form.shiftStartsAt) {
      toast.error("Available until must be after available from");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        status: form.status,
        shiftStartsAt: form.shiftStartsAt,
        shiftEndsAt: form.shiftEndsAt,
        attributes: {
          age: form.age,
          height: form.height,
          weight: form.weight,
          nationality: form.nationality,
          languages: form.languages,
          experience: form.experience,
          introduction: form.introduction,
        },
      };

      const response = await fetch(
        isEditing ? `/api/admin/staff/${staffId}` : "/api/admin/staff",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as {
        staff?: StaffRecord;
        error?: string;
        hint?: string;
      };

      if (!response.ok || !data.staff) {
        throw new Error(data.hint ?? data.error ?? "Failed to save staff.");
      }

      await uploadPhotos(data.staff.id, form.photos);

      if (form.loginId.trim()) {
        const accountResponse = await fetch(
          `/api/admin/staff/${data.staff.id}/account`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              loginId: form.loginId.trim(),
              password: form.password.trim() || undefined,
            }),
          },
        );

        const accountResult = (await accountResponse.json()) as {
          error?: string;
        };

        if (!accountResponse.ok) {
          throw new Error(accountResult.error ?? "Failed to save login credentials.");
        }

        setHasLoginAccount(true);
        setForm((current) => ({ ...current, password: "" }));
      }

      toast.success(isEditing ? "Staff updated" : "Staff created");
      router.push("/admin/staff");
      router.refresh();
    } catch (error) {
      toast.error("Could not save staff", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading staff...</div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 pb-8 sm:px-4 lg:gap-6 lg:p-6">
      <div className="space-y-3">
        <Link
          href="/admin/staff"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Staff
        </Link>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {isEditing ? "Edit Staff" : "Add Staff"}
          </h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Profile fields can be extended later without changing the page layout.
          </p>
        </div>
      </div>

      <form
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-8"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <StaffFormSection
          title="Photos"
          description="Upload 1 to 5 photos. The first image is used as the main profile photo."
        >
          <MultiImageUpload
            value={form.photos}
            existingUrls={existingPhotos}
            maxFiles={5}
            onChange={(photos) => updateField("photos", photos)}
            onRemoveExisting={(photoId) => void removeExistingPhoto(photoId)}
          />
        </StaffFormSection>

        <StaffFormSection
          title="Basic Information"
          description="Core profile details shown on the booking page."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <StaffFormField label="Name" htmlFor="staff-name" required>
              <Input
                id="staff-name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Full name"
                className={inputClassName}
              />
            </StaffFormField>

            <StaffFormField label="Age" htmlFor="staff-age">
              <Input
                id="staff-age"
                value={form.age}
                onChange={(event) => updateField("age", event.target.value)}
                placeholder="e.g. 28"
                className={inputClassName}
              />
            </StaffFormField>

            <StaffFormField label="Height" htmlFor="staff-height">
              <Input
                id="staff-height"
                value={form.height}
                onChange={(event) => updateField("height", event.target.value)}
                placeholder="e.g. 165 cm"
                className={inputClassName}
              />
            </StaffFormField>

            <StaffFormField label="Weight" htmlFor="staff-weight">
              <Input
                id="staff-weight"
                value={form.weight}
                onChange={(event) => updateField("weight", event.target.value)}
                placeholder="e.g. 55 kg"
                className={inputClassName}
              />
            </StaffFormField>
          </div>

          <StaffFormField label="Nationality" htmlFor="staff-nationality">
            <Select
              value={form.nationality || undefined}
              onValueChange={(value) => updateField("nationality", value ?? "")}
            >
              <SelectTrigger
                id="staff-nationality"
                className={cn(inputClassName, "w-full")}
              >
                <SelectValue placeholder="Select nationality" />
              </SelectTrigger>
              <SelectContent>
                {nationalityOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </StaffFormField>

          <StaffFormField label="Languages">
            <div className="flex flex-wrap gap-2">
              {languageOptions.map((language) => {
                const isSelected = form.languages.includes(language);

                return (
                  <button
                    key={language}
                    type="button"
                    onClick={() => toggleLanguage(language)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                  >
                    {language}
                  </button>
                );
              })}
            </div>
          </StaffFormField>

          <StaffFormField label="Experience" htmlFor="staff-experience">
            <Input
              id="staff-experience"
              value={form.experience}
              onChange={(event) =>
                updateField("experience", event.target.value)
              }
              placeholder="e.g. 5 years in massage therapy"
              className={inputClassName}
            />
          </StaffFormField>

          <StaffFormField label="Introduction" htmlFor="staff-introduction">
            <textarea
              id="staff-introduction"
              value={form.introduction}
              onChange={(event) =>
                updateField("introduction", event.target.value)
              }
              placeholder="Brief bio and specialties..."
              rows={4}
              className={cn(
                inputClassName,
                "min-h-28 w-full resize-y px-3 py-2.5",
              )}
            />
          </StaffFormField>
        </StaffFormSection>

        <StaffFormSection
          title="Availability window"
          description="Tap the field to open the calendar. Times use this shop's timezone. Overnight is fine — e.g. 4 Jul 14:00 to 5 Jul 02:00."
        >
          <p className="text-xs text-muted-foreground">
            Shop time now:{" "}
            <span className="font-medium text-foreground">
              {formatShiftDateTime(
                datetimeLocalToIso(localNow, timeZone),
                timeZone,
              )}
            </span>{" "}
            · {formatTimezoneLabel(timeZone)}
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <StaffFormField label="Available from" htmlFor="shift-start" required>
              <TenantDatetimeField
                id="shift-start"
                value={form.shiftStartsAt}
                min={localNow}
                timeZone={timeZone}
                placeholder="Select start date & time"
                onChange={(value) => {
                  updateField("shiftStartsAt", value);
                  if (form.shiftEndsAt && form.shiftEndsAt <= value) {
                    updateField("shiftEndsAt", "");
                  }
                }}
              />
            </StaffFormField>

            <StaffFormField label="Available until" htmlFor="shift-end" required>
              <TenantDatetimeField
                id="shift-end"
                value={form.shiftEndsAt}
                min={
                  form.shiftStartsAt > localNow
                    ? form.shiftStartsAt
                    : localNow
                }
                timeZone={timeZone}
                placeholder="Select end date & time"
                onChange={(value) => updateField("shiftEndsAt", value)}
              />
            </StaffFormField>
          </div>

          {form.shiftStartsAt && form.shiftEndsAt ? (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">
                {formatShiftDateTime(
                  datetimeLocalToIso(form.shiftStartsAt, timeZone),
                  timeZone,
                )}
                {" → "}
                {formatShiftDateTime(
                  datetimeLocalToIso(form.shiftEndsAt, timeZone),
                  timeZone,
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Customers can only book open times inside this window.
              </p>
            </div>
          ) : null}

          <StaffFormField label="Bookings in this window">
            {shiftBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No bookings in this window yet.
              </p>
            ) : (
              <ul className="space-y-2 rounded-xl border border-border/60 bg-background p-3">
                {shiftBookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-foreground">
                      {booking.customerName ?? "Customer"}
                    </span>
                    <span className="text-muted-foreground">
                      {formatShiftDateTime(booking.startsAt, timeZone)} –{" "}
                      {formatShiftDateTime(booking.endsAt, timeZone)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </StaffFormField>

          <StaffFormField label="Status" htmlFor="staff-status">
            <Select
              value={form.status}
              onValueChange={(value) =>
                updateField("status", (value ?? "active") as StaffStatus)
              }
            >
              <SelectTrigger
                id="staff-status"
                className={cn(inputClassName, "w-full sm:w-48")}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {staffStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </StaffFormField>
        </StaffFormSection>

        <StaffFormSection
          title="Login credentials"
          description="Staff use these to sign in and receive booking alerts for their own schedule only."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <StaffFormField label="Login ID" htmlFor="staff-login-id">
              <Input
                id="staff-login-id"
                value={form.loginId}
                onChange={(event) => updateField("loginId", event.target.value)}
                placeholder="e.g. anna01"
                className={inputClassName}
                autoComplete="off"
              />
            </StaffFormField>

            <StaffFormField
              label="Password"
              htmlFor="staff-password"
              hint={
                hasLoginAccount
                  ? "Leave blank to keep the current password."
                  : "Required when creating a new login."
              }
            >
              <Input
                id="staff-password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder={hasLoginAccount ? "••••••••" : "Min. 6 characters"}
                className={inputClassName}
                autoComplete="new-password"
              />
            </StaffFormField>
          </div>

          <p className="text-xs text-muted-foreground">
            Staff sign in at{" "}
            <Link href="/staff/login" className="text-primary underline">
              /staff/login
            </Link>
            , then tap <strong>Turn on alerts</strong> to receive push
            notifications for their bookings.
          </p>
        </StaffFormSection>

        <div className="flex flex-col-reverse gap-3 border-t border-border/40 pt-6 sm:flex-row sm:justify-end">
          <AppButton
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => router.push("/admin/staff")}
          >
            Cancel
          </AppButton>
          <AppButton type="submit" className="rounded-xl" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </AppButton>
        </div>
      </form>
    </div>
  );
}
