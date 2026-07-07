"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  normalizeShiftWindow,
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
import {
  ensureShiftPlan,
  primaryShiftWindowLocalsFromPlan,
  shiftPlanBounds,
  sortedShiftPlanDates,
} from "../utils/shift-plan";
import { StaffFormField } from "./staff-form-field";
import { StaffFormSection } from "./staff-form-section";
import { StaffShiftCalendar } from "./staff-shift-calendar";

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

const inputClassName =
  "h-10 rounded-xl border-border/60 bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-ring/30";

interface StaffFormProps {
  staffId?: string;
}

function mapRecordToForm(record: StaffRecord, timeZone: string): StaffFormValues {
  const localNow = toDatetimeLocalValue(new Date(), timeZone);
  const today = todayDateInZone(timeZone);
  const daySchedule = parseDaySchedule(record.attributes.daySchedule);
  const { shiftStartsAt, shiftEndsAt } = normalizeShiftWindow(
    record.shiftStartsAt,
    record.shiftEndsAt,
    localNow,
    timeZone,
  );
  const shiftPlan = ensureShiftPlan(
    record.attributes.shiftPlan,
    shiftStartsAt,
    shiftEndsAt,
  );

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
    shiftEndsAt,
    shiftPlan,
    workingToday: isStaffWorkingOnDate(
      record.status,
      daySchedule,
      today,
      shiftPlan,
    ),
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
  /** ISO timestamp saved when the current availability window was opened. */
  const [shiftStartedAtIso, setShiftStartedAtIso] = useState<string | null>(
    null,
  );
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
    setForm((current) => {
      if (Object.keys(current.shiftPlan).length > 0) {
        return current;
      }

      if (
        current.shiftStartsAt >= localNow &&
        current.shiftEndsAt > current.shiftStartsAt
      ) {
        return current;
      }
      const normalized = normalizeShiftWindow(
        current.shiftStartsAt,
        current.shiftEndsAt,
        localNow,
        timeZone,
      );
      if (
        normalized.shiftStartsAt === current.shiftStartsAt &&
        normalized.shiftEndsAt === current.shiftEndsAt
      ) {
        return current;
      }
      return { ...current, ...normalized };
    });
  }, [localNow, timeZone]);

  useEffect(() => {
    if (!staffId) return;

    void (async () => {
      try {
        const [response, accountResponse] = await Promise.all([
          fetch(`/api/admin/staff/${staffId}`),
          fetch(`/api/admin/staff/${staffId}/account`),
        ]);

        const data = (await response.json()) as {
          staff?: StaffRecord;
          error?: string;
        };

        if (!response.ok || !data.staff) {
          throw new Error(data.error ?? "Failed to load staff.");
        }

        setForm(mapRecordToForm(data.staff, timeZone));
        setExistingPhotos(data.staff.photos);
        setShiftStartedAtIso(
          typeof data.staff.attributes.shiftStartsAt === "string" &&
            data.staff.attributes.shiftStartsAt
            ? data.staff.attributes.shiftStartsAt
            : null,
        );

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
    if (!staffId || Object.keys(form.shiftPlan).length === 0) {
      setShiftBookings([]);
      return;
    }

    let cancelled = false;
    const bounds = shiftPlanBounds(form.shiftPlan);

    void (async () => {
      try {
        const params = new URLSearchParams({ staffId });
        if (bounds) {
          params.set(
            "from",
            datetimeLocalToIso(`${bounds.from}T00:00`, timeZone),
          );
          params.set(
            "to",
            datetimeLocalToIso(`${bounds.to}T23:59`, timeZone),
          );
        }
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
  }, [staffId, form.shiftPlan, timeZone]);

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

    const today = todayDateInZone(timeZone);
    const scheduledDates = sortedShiftPlanDates(form.shiftPlan).filter(
      (date) => date >= today,
    );

    if (scheduledDates.length === 0) {
      toast.error("Add at least one upcoming day on the calendar");
      return;
    }

    const primary = primaryShiftWindowLocalsFromPlan(
      form.shiftPlan,
      timeZone,
    );
    if (!primary) {
      toast.error("Could not resolve shift hours from the calendar");
      return;
    }

    if (form.shiftPlan[today]) {
      const todayStartLocal = `${today}T${form.shiftPlan[today].startTime}`;
      if (todayStartLocal < localNow) {
        toast.error("Today's start time cannot be in the past");
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        status: form.status,
        shiftStartsAt: primary.shiftStartsAt,
        shiftEndsAt: primary.shiftEndsAt,
        attributes: {
          age: form.age,
          height: form.height,
          weight: form.weight,
          nationality: form.nationality,
          languages: form.languages,
          experience: form.experience,
          introduction: form.introduction,
          shiftPlan: form.shiftPlan,
          daySchedule: applyWorkingToday(
            form.daySchedule,
            today,
            Boolean(form.shiftPlan[today]),
          ),
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
          description="Tap dates on the calendar to pre-schedule shifts for multiple days."
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

          <StaffShiftCalendar
            key={staffId ?? "new"}
            timeZone={timeZone}
            shiftPlan={form.shiftPlan}
            localNow={localNow}
            onShiftPlanChange={(shiftPlan) => {
              const primary = primaryShiftWindowLocalsFromPlan(
                shiftPlan,
                timeZone,
              );
              const today = todayDateInZone(timeZone);

              setForm((current) => ({
                ...current,
                shiftPlan,
                shiftStartsAt: primary?.shiftStartsAt ?? current.shiftStartsAt,
                shiftEndsAt: primary?.shiftEndsAt ?? current.shiftEndsAt,
                workingToday: Boolean(shiftPlan[today]),
              }));
            }}
          />

          {shiftStartedAtIso ? (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              Started at{" "}
              <span className="font-semibold text-foreground">
                {formatShiftDateTime(shiftStartedAtIso, timeZone)}
              </span>
            </div>
          ) : null}

          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-foreground">Booked</p>
            {!staffId ? (
              <p className="text-sm text-muted-foreground">
                Save staff first to see bookings.
              </p>
            ) : shiftBookings.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                No bookings yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {shiftBookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3 shadow-sm"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        {booking.customerName ?? "Customer"}
                      </span>
                      <span className="text-sm font-medium text-primary/80">
                        {formatShiftDateTime(booking.startsAt, timeZone)} –{" "}
                        {formatShiftDateTime(booking.endsAt, timeZone)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
