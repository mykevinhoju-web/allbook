"use client";

import { useState } from "react";

import { BreakManager } from "./BreakManager";
import { LeaveManager } from "./LeaveManager";
import { ProfileEditor } from "./ProfileEditor";
import { ServiceAssignment } from "./ServiceAssignment";
import { WorkingHours } from "./WorkingHours";
import {
  STAFF_ROLES,
  defaultWorkingHours,
  validateStaffInput,
  type SalonStaffMember,
  type StaffAssignedService,
  type StaffInput,
} from "@/features/salon-staff";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-[14px] outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-950/5";

type StaffFormProps = {
  initial?: SalonStaffMember | null;
  serviceOptions: StaffAssignedService[];
  submitLabel?: string;
  onSubmit: (input: StaffInput) => Promise<void> | void;
  onCancel: () => void;
};

function toInput(member?: SalonStaffMember | null): StaffInput {
  if (!member) {
    return {
      firstName: "",
      lastName: "",
      displayName: "",
      photo: null,
      email: "",
      phone: "",
      role: "Stylist",
      status: "active",
      experience: 0,
      rating: 0,
      languages: ["English"],
      specialties: [],
      bio: "",
      instagram: "",
      certificates: [],
      portfolioImages: [],
      workingHours: defaultWorkingHours(),
      breaks: [],
      leaves: [],
      serviceIds: [],
      bookingEnabled: true,
      maxDailyBookings: 8,
      maxWeeklyBookings: 35,
      bufferMinutes: 10,
    };
  }

  return {
    firstName: member.firstName,
    lastName: member.lastName,
    displayName: member.displayName,
    photo: member.photo,
    email: member.email,
    phone: member.phone,
    role: member.role,
    status: member.status === "archived" ? "inactive" : member.status,
    experience: member.experience,
    rating: member.rating,
    languages: member.languages,
    specialties: member.specialties,
    bio: member.bio,
    instagram: member.instagram,
    certificates: member.certificates,
    portfolioImages: member.portfolioImages,
    workingHours: member.workingHours,
    breaks: member.breaks,
    leaves: member.leaves,
    serviceIds: member.serviceIds,
    bookingEnabled: member.bookingEnabled,
    maxDailyBookings: member.maxDailyBookings,
    maxWeeklyBookings: member.maxWeeklyBookings,
    bufferMinutes: member.bufferMinutes,
  };
}

export function StaffForm({
  initial,
  serviceOptions,
  submitLabel = "Save staff",
  onSubmit,
  onCancel,
}: StaffFormProps) {
  const [form, setForm] = useState<StaffInput>(() => toInput(initial));
  const [tab, setTab] = useState<"basics" | "schedule" | "services" | "profile" | "booking">(
    "basics",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function patch(partial: Partial<StaffInput>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const message = validateStaffInput(form);
    if (message) {
      setError(message);
      setTab("basics");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save staff.");
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: "basics" as const, label: "Basics" },
    { id: "schedule" as const, label: "Schedule" },
    { id: "services" as const, label: "Services" },
    { id: "profile" as const, label: "Profile" },
    { id: "booking" as const, label: "Booking" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition",
              tab === item.id
                ? "bg-neutral-950 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "basics" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
              First name *
            </span>
            <input
              className={fieldClass}
              value={form.firstName}
              onChange={(e) => patch({ firstName: e.target.value })}
              autoFocus
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
              Last name *
            </span>
            <input
              className={fieldClass}
              value={form.lastName}
              onChange={(e) => patch({ lastName: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
              Display name
            </span>
            <input
              className={fieldClass}
              value={form.displayName ?? ""}
              onChange={(e) => patch({ displayName: e.target.value })}
              placeholder="Shown on booking pages"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
              Role *
            </span>
            <select
              className={fieldClass}
              value={form.role}
              onChange={(e) =>
                patch({ role: e.target.value as StaffInput["role"] })
              }
            >
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
              Years experience
            </span>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={form.experience ?? 0}
              onChange={(e) => patch({ experience: Number(e.target.value) })}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
              Email
            </span>
            <input
              type="email"
              className={fieldClass}
              value={form.email ?? ""}
              onChange={(e) => patch({ email: e.target.value })}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
              Phone
            </span>
            <input
              className={fieldClass}
              value={form.phone ?? ""}
              onChange={(e) => patch({ phone: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
              Profile photo URL
            </span>
            <input
              className={fieldClass}
              value={form.photo ?? ""}
              onChange={(e) => patch({ photo: e.target.value || null })}
              placeholder="https://"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.status !== "inactive"}
              onChange={(e) =>
                patch({ status: e.target.checked ? "active" : "inactive" })
              }
            />
            <span className="text-[13px] font-medium text-neutral-800">
              Active staff member
            </span>
          </label>
        </div>
      ) : null}

      {tab === "schedule" ? (
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-neutral-900">
              Working hours
            </h3>
            <WorkingHours
              value={form.workingHours ?? defaultWorkingHours()}
              onChange={(workingHours) => patch({ workingHours })}
            />
          </div>
          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-neutral-900">
              Breaks
            </h3>
            <BreakManager
              value={form.breaks ?? []}
              onChange={(breaks) => patch({ breaks })}
            />
          </div>
          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-neutral-900">
              Time off
            </h3>
            <LeaveManager
              value={form.leaves ?? []}
              onChange={(leaves) => patch({ leaves })}
            />
          </div>
        </div>
      ) : null}

      {tab === "services" ? (
        <ServiceAssignment
          options={serviceOptions}
          selectedIds={form.serviceIds ?? []}
          onChange={(serviceIds) => patch({ serviceIds })}
        />
      ) : null}

      {tab === "profile" ? (
        <ProfileEditor
          bio={form.bio ?? ""}
          instagram={form.instagram ?? ""}
          languages={form.languages ?? []}
          certificates={form.certificates ?? []}
          portfolioImages={form.portfolioImages ?? []}
          specialties={form.specialties ?? []}
          onChange={(p) => patch(p)}
        />
      ) : null}

      {tab === "booking" ? (
        <div className="space-y-4">
          <label className="flex items-center justify-between rounded-2xl border border-neutral-200 px-4 py-3">
            <span>
              <span className="block text-[13px] font-semibold text-neutral-900">
                Enable booking
              </span>
              <span className="text-[12px] text-neutral-500">
                Appear in online booking staff picker
              </span>
            </span>
            <input
              type="checkbox"
              checked={Boolean(form.bookingEnabled)}
              onChange={(e) => patch({ bookingEnabled: e.target.checked })}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label>
              <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
                Max daily bookings
              </span>
              <input
                type="number"
                min={0}
                className={fieldClass}
                value={form.maxDailyBookings ?? ""}
                onChange={(e) =>
                  patch({
                    maxDailyBookings:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
                Max weekly bookings
              </span>
              <input
                type="number"
                min={0}
                className={fieldClass}
                value={form.maxWeeklyBookings ?? ""}
                onChange={(e) =>
                  patch({
                    maxWeeklyBookings:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
                Buffer (minutes)
              </span>
              <input
                type="number"
                min={0}
                className={fieldClass}
                value={form.bufferMinutes ?? 0}
                onChange={(e) =>
                  patch({ bufferMinutes: Number(e.target.value) })
                }
              />
            </label>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-[13px] font-semibold text-neutral-800"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
