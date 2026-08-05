import { PLATFORM_BUSINESS_TYPES } from "@/features/platform-auth/config/business-types";
import type { PlatformTenantRow } from "@/features/platform/types";
import { createServiceSupabase } from "@/lib/supabase/service";
import type { Json } from "@/types/database";

function asRecord(value: Json | null | undefined): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function businessTypeLabel(value: string): string {
  const match = PLATFORM_BUSINESS_TYPES.find((item) => item.value === value);
  return match?.label ?? (value || "—");
}

function planLabel(value: string): string {
  if (value === "free_trial") return "Free trial";
  if (!value) return "Free trial";
  return value;
}

/** AllBook Admin: list of businesses that signed up on the platform. */
export async function listPlatformSignups(): Promise<PlatformTenantRow[]> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("tenants")
    .select(
      "id, name, display_name, slug, is_active, settings, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const settings = asRecord(row.settings);
    const ownerName = readString(settings, "ownerName");
    const ownerEmail = readString(settings, "ownerEmail");
    const ownerPhone = readString(settings, "contactPhone");
    const businessType = readString(settings, "businessType");
    const plan = readString(settings, "plan");

    return {
      id: row.id,
      name: row.display_name || row.name,
      slug: row.slug,
      status: row.is_active ? "active" : "suspended",
      createdAt: row.created_at.slice(0, 10),
      subscription: planLabel(plan),
      ownerName: ownerName || "—",
      ownerEmail: ownerEmail || "—",
      ownerPhone: ownerPhone || "—",
      businessType: businessTypeLabel(businessType),
    };
  });
}

export async function getPlatformSignupStats() {
  const signups = await listPlatformSignups();
  const active = signups.filter((row) => row.status === "active").length;
  const freeTrial = signups.filter(
    (row) => row.subscription === "Free trial",
  ).length;

  return {
    totalTenants: signups.length,
    activeTenants: active,
    freeTrials: freeTrial,
    recent: signups.slice(0, 8),
    all: signups,
  };
}
