import { MOCK_DASHBOARD_STATS } from "./mock-data";
import type { DashboardStat } from "./types";

/** Salon owner KPI widgets — mock for now. */
export async function getStats(): Promise<DashboardStat[]> {
  return MOCK_DASHBOARD_STATS;
}
