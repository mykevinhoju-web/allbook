"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { AppButton, ImageUploadArea } from "@/components/common";
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
  defaultStaffFormValues,
  languageOptions,
  nationalityOptions,
  staffStatusOptions,
  workingDayOptions,
} from "../config";
import type { StaffStatus } from "../types";
import { StaffFormField } from "./staff-form-field";
import { StaffFormSection } from "./staff-form-section";

const inputClassName =
  "h-10 rounded-xl border-border/60 bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-ring/30";

export function StaffForm() {
  const router = useRouter();
  const [form, setForm] = useState(defaultStaffFormValues);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    form.languages,
  );

  const toggleLanguage = (language: string) => {
    setSelectedLanguages((current) =>
      current.includes(language)
        ? current.filter((item) => item !== language)
        : [...current, language],
    );
  };

  const toggleWorkingDay = (day: string) => {
    setForm((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((item) => item !== day)
        : [...current.workingDays, day],
    }));
  };

  const updateField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Link
            href="/admin/staff"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Staff
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Add Staff
            </h1>
            <p className="text-sm text-muted-foreground">
              Create a new team member profile and login credentials.
            </p>
          </div>
        </div>
      </div>

      <form
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-8"
        onSubmit={(event) => event.preventDefault()}
      >
        <StaffFormSection
          title="Basic Information"
          description="Profile details shown to customers and on the booking page."
        >
          <StaffFormField label="Profile Photo" required>
            <ImageUploadArea
              title="Upload profile photo"
              description="A clear headshot is required for staff profiles."
              className="min-h-40 rounded-2xl"
            />
          </StaffFormField>

          <StaffFormField
            label="Gallery Photos"
            hint="Optional additional photos for the staff gallery."
          >
            <ImageUploadArea
              title="Upload gallery photos"
              description="Add multiple images to showcase work and style."
              className="min-h-32 rounded-2xl"
            />
          </StaffFormField>

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
                type="number"
                min={18}
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
                const isSelected = selectedLanguages.includes(language);

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
          title="Login Information"
          description="Credentials used by the staff member to access the admin portal."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <StaffFormField label="Username" htmlFor="staff-username" required>
              <Input
                id="staff-username"
                value={form.username}
                onChange={(event) =>
                  updateField("username", event.target.value)
                }
                placeholder="username"
                autoComplete="username"
                className={inputClassName}
              />
            </StaffFormField>

            <StaffFormField label="Password" htmlFor="staff-password" required>
              <Input
                id="staff-password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                placeholder="••••••••"
                autoComplete="new-password"
                className={inputClassName}
              />
            </StaffFormField>
          </div>
        </StaffFormSection>

        <StaffFormSection
          title="Work Information"
          description="Schedule and availability settings for bookings."
        >
          <StaffFormField label="Working Days">
            <div className="flex flex-wrap gap-2">
              {workingDayOptions.map((day) => {
                const isSelected = form.workingDays.includes(day.value);

                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWorkingDay(day.value)}
                    className={cn(
                      "min-w-12 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </StaffFormField>

          <StaffFormField label="Working Hours">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Start</span>
                <Input
                  type="time"
                  value={form.workingHoursStart}
                  onChange={(event) =>
                    updateField("workingHoursStart", event.target.value)
                  }
                  className={inputClassName}
                />
              </div>
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">End</span>
                <Input
                  type="time"
                  value={form.workingHoursEnd}
                  onChange={(event) =>
                    updateField("workingHoursEnd", event.target.value)
                  }
                  className={inputClassName}
                />
              </div>
            </div>
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

        <div className="flex flex-col-reverse gap-3 border-t border-border/40 pt-6 sm:flex-row sm:justify-end">
          <AppButton
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => router.push("/admin/staff")}
          >
            Cancel
          </AppButton>
          <AppButton type="submit" className="rounded-xl">
            Save
          </AppButton>
        </div>
      </form>
    </div>
  );
}
