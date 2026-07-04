"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { AppButton, toast } from "@/components/common";
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
  nationalityOptions,
} from "../config";
import type { StaffFormValues, StaffRecord } from "../types";
import { StaffFormField } from "./staff-form-field";
import { StaffFormSection } from "./staff-form-section";

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
  const [hasLoginAccount, setHasLoginAccount] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
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

  const updateField = <K extends keyof StaffFormValues>(
    key: K,
    value: StaffFormValues[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
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
            </div>
          ) : null}
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
