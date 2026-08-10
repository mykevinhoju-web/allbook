import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type AnySupabase = SupabaseClient<Database>;

export const DEFAULT_OWNER_KEYWORD_LIMIT = 5;
export const MAX_OWNER_KEYWORD_LIMIT = 30;
export const MAX_OWNER_KEYWORD_LENGTH = 40;

/**
 * Normalize owner keyword tokens: trim, lowercase, unique, length-capped.
 */
export function normalizeOwnerKeywords(
  input: string[] | null | undefined,
  limit = DEFAULT_OWNER_KEYWORD_LIMIT,
): string[] {
  const capped = Math.max(
    0,
    Math.min(MAX_OWNER_KEYWORD_LIMIT, Math.floor(limit)),
  );
  const out: string[] = [];
  const seen = new Set<string>();

  for (const raw of input ?? []) {
    const token = String(raw ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .slice(0, MAX_OWNER_KEYWORD_LENGTH);
    if (!token) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    out.push(token);
    if (out.length >= capped) break;
  }

  return out;
}

export function parseOwnerKeywordLimit(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_OWNER_KEYWORD_LIMIT;
  return Math.max(1, Math.min(MAX_OWNER_KEYWORD_LIMIT, Math.floor(n)));
}

/**
 * Per-salon keyword cap. Default 5; platform admin raises for paying salons.
 */
export async function getOwnerKeywordLimit(
  supabase: AnySupabase,
  salonId: string,
): Promise<number> {
  const id = salonId?.trim();
  if (!id) return DEFAULT_OWNER_KEYWORD_LIMIT;

  const { data, error } = await supabase
    .from("salons")
    .select("owner_keyword_limit")
    .eq("id", id)
    .maybeSingle();

  if (error || data == null) return DEFAULT_OWNER_KEYWORD_LIMIT;
  return parseOwnerKeywordLimit(
    (data as { owner_keyword_limit?: number | null }).owner_keyword_limit,
  );
}

/**
 * Super-admin: set keyword limit for one salon (paid upgrade).
 */
export async function setSalonOwnerKeywordLimit(
  supabase: AnySupabase,
  salonId: string,
  limit: number,
): Promise<{ limit: number; error: string | null }> {
  const next = parseOwnerKeywordLimit(limit);
  const { error } = await supabase
    .from("salons")
    .update({
      owner_keyword_limit: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", salonId);

  if (error) return { limit: next, error: error.message };
  return { limit: next, error: null };
}
