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
  defaultStaffFormValues,
  languageOptions,
  nationalityOptions,
  staffStatusOptions,
  workingDayOptions,
} from "../config";
import type { StaffFormValues, StaffPhoto, StaffRecord, StaffStatus } from "../types";
import { StaffFormField } from "./staff-form-field";
import { StaffFormSection } from "./staff-form-section";

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
    workingDays: record.workingDays,
    workingHoursStart: record.workingHoursStart,
    workingHoursEnd: record.workingHoursEnd,
    status: record.status,
  };
}

export function StaffForm({ staffId }: StaffFormProps) {
  const router = useRouter();
  const isEditing = Boolean(staffId);
  const [form, setForm] = useState<StaffFormValues>(defaultStaffFormValues);
  const [existingPhotos, setExistingPhotos] = useState<StaffPhoto[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

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

  const toggleLanguage = (language: string) => {
    updateField(
      "languages",
      form.languages.includes(language)
        ? form.languages.filter((item) => item !== language)
        : [...form.languages, language],
    );
  };

  const toggleWorkingDay = (day: string) => {
    updateField(
      "workingDays",
      form.workingDays.includes(day)
        ? form.workingDays.filter((item) => item !== day)
        : [...form.workingDays, day],
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

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        status: form.status,
        workingDays: form.workingDays,
        workingHoursStart: form.workingHoursStart,
        workingHoursEnd: form.workingHoursEnd,
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
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
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
            {isEditing ? "Edit Staff" : "Add Staff"}
          </h1>
          <p className="text-sm text-muted-foreground">
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
          title="Work Information"
          description="Schedule and availability used by the live booking board."
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
              <Input
                type="time"
                value={form.workingHoursStart}
                onChange={(event) =>
                  updateField("workingHoursStart", event.target.value)
                }
                className={inputClassName}
              />
              <Input
                type="time"
                value={form.workingHoursEnd}
                onChange={(event) =>
                  updateField("workingHoursEnd", event.target.value)
                }
                className={inputClassName}
              />
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
          <AppButton type="submit" className="rounded-xl" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </AppButton>
        </div>
      </form>
    </div>
  );
}
