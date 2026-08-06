import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getSalonPageData, type GetSalonPageResult } from "./getSalonPageData";

type AnySupabase = SupabaseClient<Database>;

/**
 * Resolve salon detail by public slug (category route /{category}/{slug}).
 */
export async function getSalonPageDataBySlug(
  supabase: AnySupabase,
  slug: string,
): Promise<GetSalonPageResult> {
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  if (!normalized) {
    return { status: "not_found" };
  }

  const { data, error } = await supabase
    .from("salons")
    .select("id")
    .eq("slug", normalized)
    .maybeSingle();

  if (error) {
    return { status: "error", error: error.message };
  }

  if (!data?.id) {
    return { status: "not_found" };
  }

  return getSalonPageData(supabase, data.id);
}

export async function getSalonIdBySlug(
  supabase: AnySupabase,
  slug: string,
): Promise<{ id: string | null; error: string | null }> {
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  if (!normalized) {
    return { id: null, error: null };
  }

  const { data, error } = await supabase
    .from("salons")
    .select("id")
    .eq("slug", normalized)
    .maybeSingle();

  if (error) {
    return { id: null, error: error.message };
  }

  return { id: data?.id ?? null, error: null };
}
