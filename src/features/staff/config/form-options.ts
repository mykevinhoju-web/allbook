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

export const workingDayOptions = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
] as const;

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

export const defaultStaffFormValues = {
  photos: [] as File[],
  name: "",
  age: "",
  height: "",
  weight: "",
  nationality: "",
  languages: [] as string[],
  experience: "",
  introduction: "",
  username: "",
  password: "",
  workingDays: ["mon", "tue", "wed", "thu", "fri"] as string[],
  workingHoursStart: "09:00",
  workingHoursEnd: "18:00",
  status: "active" as StaffStatus,
};
