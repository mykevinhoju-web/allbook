import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { resolveCategoryFromService } from "@/features/category";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import type { SalonOwnerSession } from "./types";

type AnySupabase = SupabaseClient<Database>;

export type OwnerSalonRow = {
  id: string;
  name: string;
  slug: string;
  primary_service: string | null;
  rating: number;
  review_count: number;
};

export type OwnerSalonOk = {
  status: "ok";
  user: User;
  owner: {
    id: string;
    fullName: string;
    email: string;
    salonId: string;
  };
  salon: OwnerSalonRow;
  session: SalonOwnerSession;
};

export type OwnerSalonContext =
  | { status: "unauthenticated" }
  | { status: "error"; error: string }
  | { status: "no_salon"; user: User }
  | OwnerSalonOk;

/**
 * Resolve the authenticated owner's salon.
 * auth.uid() → salon_owners.auth_user_id → salon_id → salons.id
 * Never loads another owner's salon.
 */
export async function getOwnerSalonContext(
  supabase?: AnySupabase,
): Promise<OwnerSalonContext> {
  const client = supabase ?? (await createClient());
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError) {
    return { status: "error", error: authError.message };
  }
  if (!user) {
    return { status: "unauthenticated" };
  }

  const { data: owner, error } = await client
    .from("salon_owners")
    .select(
      `
      id,
      full_name,
      email,
      salon_id,
      salons (
        id,
        name,
        slug,
        primary_service,
        rating,
        review_count
      )
    `,
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    return { status: "error", error: error.message };
  }
  if (!owner?.salon_id) {
    return { status: "no_salon", user };
  }

  const salonRaw = owner.salons as OwnerSalonRow | OwnerSalonRow[] | null;
  const salon = Array.isArray(salonRaw) ? salonRaw[0] : salonRaw;
  if (!salon) {
    return { status: "no_salon", user };
  }

  const category =
    resolveCategoryFromService(salon.primary_service) ??
    resolveCategoryFromService("Hair");
  const categorySlug = category?.slug ?? "hair";

  return {
    status: "ok",
    user,
    owner: {
      id: owner.id,
      fullName: owner.full_name,
      email: owner.email,
      salonId: owner.salon_id,
    },
    salon,
    session: {
      salonId: salon.id,
      salonName: salon.name,
      ownerName: owner.full_name,
      ownerEmail: owner.email,
      categoryLabel: category?.label ?? "Salon",
      publicPath: `/${categorySlug}/${salon.slug}`,
    },
  };
}

/**
 * Portal pages: require auth + linked salon.
 * Unauthenticated → /login
 * No salon link → /register
 */
export async function requireOwnerSalon(
  nextPath = "/platform/salon",
): Promise<OwnerSalonOk> {
  const context = await getOwnerSalonContext();

  if (context.status === "unauthenticated") {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (context.status === "error") {
    throw new Error(context.error);
  }
  if (context.status === "no_salon") {
    redirect("/register");
  }

  return context;
}

/**
 * API guard: true only when auth user owns the given salon_id.
 */
export async function ownerOwnsSalon(
  authUserId: string,
  salonId: string,
  supabase?: AnySupabase,
): Promise<boolean> {
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("salon_owners")
    .select("id")
    .eq("auth_user_id", authUserId)
    .eq("salon_id", salonId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data?.id);
}

/** Calendar date YYYY-MM-DD in Australia/Sydney. */
export function todayIsoSydney(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatAud(centsOrDollars: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(centsOrDollars);
}
