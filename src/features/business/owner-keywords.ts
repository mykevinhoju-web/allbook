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
  const capped = Math.max(0, Math.min(MAX_OWNER_KEYWORD_LIMIT, Math.floor(limit)));
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
 * Read platform-wide max owner keywords (default 5).
 */
export async function getOwnerKeywordLimit(
  supabase: AnySupabase,
): Promise<number> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("group_key", "marketplace")
    .eq("setting_key", "owner_keyword_limit")
    .maybeSingle();

  if (error || data == null) return DEFAULT_OWNER_KEYWORD_LIMIT;
  return parseOwnerKeywordLimit(data.value);
}

/**
 * Super-admin: set max owner keywords per salon.
 */
export async function setOwnerKeywordLimit(
  supabase: AnySupabase,
  limit: number,
): Promise<{ limit: number; error: string | null }> {
  const next = parseOwnerKeywordLimit(limit);
  const { error } = await supabase.from("platform_settings").upsert(
    {
      group_key: "marketplace",
      setting_key: "owner_keyword_limit",
      value: next,
      description:
        "Max owner-managed search keywords per salon. Platform admin can raise this later.",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_key,setting_key" },
  );

  if (error) return { limit: next, error: error.message };
  return { limit: next, error: null };
}
