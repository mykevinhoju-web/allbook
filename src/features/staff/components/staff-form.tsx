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
  todayDateInZone,
  toDatetimeLocalValue,
} from "@/features/booking/lib/schedule-utils";
import { useOptionalTenant } from "@/features/tenants";

import {
  getDefaultStaffFormValues,
  nationalityOptions,
} from "../config";
import type { StaffFormValues, StaffPhoto, StaffRecord } from "../types";
import {
  applyWorkingToday,
  isStaffWorkingOnDate,
  parseDaySchedule,
} from "../utils/day-schedule";
import { StaffFormField } from "./staff-form-field";
import { StaffFormSection } from "./staff-form-section";

interface ShiftBookingRow {
  id: string;
  startsAt: string;
  endsAt: string;
  customerName: string | null;
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

function TenantDatetimeField({
  id,
  value,
  min,
  timeZone,
  onChange,
}: {
  id: string;
  value: string;
  min?: string;
  timeZone: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
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
        onClick={(event) => {
          const input = event.currentTarget;
          try {
            input.showPicker();
          } catch {
            // Native picker opens on tap for browsers without showPicker.
          }
        }}
        className={cn(
          inputClassName,
          "w-full cursor-pointer bg-background px-3 text-foreground",
        )}
      />
      {value ? (
        <p className="text-xs text-muted-foreground">
          {formatShiftDateTime(datetimeLocalToIso(value, timeZone), timeZone)}
        </p>
      ) : null}
    </div>
  );
}

const inputClassName =
  "h-10 rounded-xl border-border/60 bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-ring/30";

interface StaffFormProps {
  staffId?: string;
}

function mapRecordToForm(record: StaffRecord, timeZone: string): StaffFormValues {
  const localNow = toDatetimeLocalValue(new Date(), timeZone);
  const today = todayDateInZone(timeZone);
  const daySchedule = parseDaySchedule(record.attributes.daySchedule);
  const shiftStartsAt =
    !record.shiftStartsAt || record.shiftStartsAt < localNow
      ? localNow
      : record.shiftStartsAt;

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
    shiftStartsAt,
    shiftEndsAt: record.shiftEndsAt,
    workingToday: isStaffWorkingOnDate(record.status, daySchedule, today),
    daySchedule,
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

        setForm(mapRecordToForm(data.staff, timeZone));
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
  }, [staffId, timeZone]);

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
      toast.error("Available from cannot be in the past");
      return;
    }

    if (form.shiftEndsAt <= form.shiftStartsAt) {
      toast.error("Available until must be after available from");
      return;
    }

    // Allow an ongoing window that started earlier; only the end must be in the future.
    if (form.shiftEndsAt <= localNow) {
      toast.error("Available until must be after the shop's current time");
      return;
    }

    setSaving(true);

    try {
      const today = todayDateInZone(timeZone);
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
          daySchedule: applyWorkingToday(form.daySchedule, today, form.workingToday),
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
        </div>
      </div>

      <form
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-8"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <StaffFormSection
          title="Photos"
          description="Add up to 5 photos. The first image is the main profile photo."
        >
          <MultiImageUpload
            value={form.photos}
            existingUrls={existingPhotos}
            maxFiles={5}
            onChange={(photos) => updateField("photos", photos)}
            onRemoveExisting={(photoId) => void removeExistingPhoto(photoId)}
          />
        </StaffFormSection>

        <StaffFormSection title="Profile">
          <StaffFormField label="Name" htmlFor="staff-name" required>
            <Input
              id="staff-name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Full name"
              className={inputClassName}
            />
          </StaffFormField>

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
        </StaffFormSection>

        <StaffFormSection
          title="Available times"
          description="Tap a field to pick date and time. Uses this shop's timezone."
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

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 shadow-sm">
            <input
              type="checkbox"
              checked={form.workingToday}
              onChange={(event) => {
                const workingToday = event.target.checked;
                const today = todayDateInZone(timeZone);
                updateField("workingToday", workingToday);
                updateField(
                  "daySchedule",
                  applyWorkingToday(form.daySchedule, today, workingToday),
                );
              }}
              className="size-4 rounded border-border accent-primary"
            />
            <span className="text-sm font-medium text-foreground">
              Working today
            </span>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <StaffFormField label="Available from" htmlFor="shift-start" required>
              <TenantDatetimeField
                id="shift-start"
                value={form.shiftStartsAt}
                min={localNow}
                timeZone={timeZone}
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
            </div>
          ) : null}

          <StaffFormField label="Bookings in this window">
            {!staffId ? (
              <p className="text-sm text-muted-foreground">
                Save staff first to see bookings.
              </p>
            ) : shiftBookings.length === 0 ? (
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
        </StaffFormSection>

        <StaffFormSection title="Login">
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
