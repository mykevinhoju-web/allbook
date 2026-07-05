import type { StaffFilterStatus, StaffStatus } from "../types";

export const staffStatusOptions: { value: StaffStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
];

export const staffFilterOptions: { value: StaffFilterStatus; label: string }[] =
  [
    { value: "all", label: "All Status" },
    ...staffStatusOptions,
  ];

export const nationalityOptions = [
  "Australian",
  "Chinese",
  "Filipino",
  "Indian",
  "Japanese",
  "Korean",
  "Thai",
  "Vietnamese",
  "Other",
];

export const languageOptions = [
  "English",
  "Mandarin",
  "Cantonese",
  "Korean",
  "Japanese",
  "Vietnamese",
  "Thai",
  "Hindi",
  "Tagalog",
];

export function getDefaultStaffFormValues() {
  return {
    photos: [] as File[],
    name: "",
    age: "",
    height: "",
    weight: "",
    nationality: "",
    languages: [] as string[],
    experience: "",
    introduction: "",
    loginId: "",
    password: "",
    daySchedule: {} as Record<string, boolean>,
    status: "active" as StaffStatus,
  };
}

/** @deprecated Prefer getDefaultStaffFormValues() */
export const defaultStaffFormValues = getDefaultStaffFormValues();
