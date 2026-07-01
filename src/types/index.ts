export type { Database, Json } from "./database";

export type BusinessCategory =
  | "massage"
  | "beauty"
  | "nail"
  | "spa";

export type ServiceStatus = "active" | "inactive";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";
