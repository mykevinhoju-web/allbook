import type { ServiceStatus } from "@/types";

export interface Service {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  status: ServiceStatus;
}
