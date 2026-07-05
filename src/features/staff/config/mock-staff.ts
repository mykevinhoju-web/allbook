import type { AdminStaffRow } from "../types";

export const mockStaffList: AdminStaffRow[] = [
  {
    id: "staff-001",
    name: "Emma Chen",
    status: "active",
    daySchedule: {},
    workingToday: true,
    nextBooking: "Today, 2:30 PM",
  },
  {
    id: "staff-002",
    name: "Sophia Lee",
    status: "active",
    daySchedule: {},
    workingToday: true,
    nextBooking: "Today, 4:00 PM",
  },
  {
    id: "staff-003",
    name: "Mia Rodriguez",
    status: "on_leave",
    daySchedule: {},
    workingToday: false,
    nextBooking: null,
  },
  {
    id: "staff-004",
    name: "Olivia Park",
    status: "active",
    daySchedule: {},
    workingToday: false,
    nextBooking: "Tomorrow, 10:00 AM",
  },
  {
    id: "staff-005",
    name: "Isabella Nguyen",
    status: "inactive",
    daySchedule: {},
    workingToday: false,
    nextBooking: null,
  },
  {
    id: "staff-006",
    name: "Charlotte Williams",
    status: "active",
    daySchedule: {},
    workingToday: true,
    nextBooking: "Today, 11:15 AM",
  },
];
