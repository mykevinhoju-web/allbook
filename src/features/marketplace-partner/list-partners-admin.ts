import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { mapPartner } from "./mappers";
import type {
  AdminPartnerListItem,
  PartnerStatus,
  PartnerType,
} from "./types";

type ServiceClient = SupabaseClient<Database>;

export async function listPartnersForAdmin(args: {
  supabase: ServiceClient;
  q?: string;
  status?: PartnerStatus | "all";
  partnerType?: PartnerType | "all";
  page?: number;
  pageSize?: number;
}): Promise<{ items: AdminPartnerListItem[]; total: number; page: number }> {
  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, args.pageSize ?? 40));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = args.supabase
    .from("marketplace_partners")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (args.status && args.status !== "all") {
    query = query.eq("status", args.status);
  }
  if (args.partnerType && args.partnerType !== "all") {
    query = query.eq("partner_type", args.partnerType);
  }
  if (args.q?.trim()) {
    const q = `%${args.q.trim()}%`;
    query = query.or(
      `display_name.ilike.${q},email.ilike.${q},phone.ilike.${q}`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const partners = (data ?? []).map(mapPartner);
  const partnerIds = partners.map((p) => p.id);
  const salonIds = partners
    .map((p) => p.salonId)
    .filter((id): id is string => Boolean(id));

  const serviceCounts = new Map<string, number>();
  if (partnerIds.length) {
    const { data: services } = await args.supabase
      .from("partner_services")
      .select("partner_id")
      .in("partner_id", partnerIds);
    for (const row of services ?? []) {
      serviceCounts.set(
        row.partner_id,
        (serviceCounts.get(row.partner_id) ?? 0) + 1,
      );
    }
  }

  const salonNames = new Map<string, string>();
  if (salonIds.length) {
    const { data: salons } = await args.supabase
      .from("salons")
      .select("id, name")
      .in("id", salonIds);
    for (const row of salons ?? []) {
      salonNames.set(row.id, row.name);
    }
  }

  return {
    page,
    total: count ?? partners.length,
    items: partners.map((p) => ({
      ...p,
      serviceCount: serviceCounts.get(p.id) ?? 0,
      salonName: p.salonId ? (salonNames.get(p.salonId) ?? null) : null,
    })),
  };
}
