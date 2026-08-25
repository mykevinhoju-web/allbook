import { NextResponse } from "next/server";

import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import { createServiceSupabase } from "@/lib/admin/tenant-context";

const KEY_RE = /^(phone|email|name):.+$/;
const NOTE_MAX = 200;

function parseRating(value: unknown): "good" | "bad" | null {
  if (value === "good" || value === "bad") return value;
  return null;
}

export async function PATCH(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const body = (await request.json()) as {
      customerKey?: string;
      rating?: unknown;
      note?: unknown;
    };
    const customerKey = body.customerKey?.trim() ?? "";
    if (!KEY_RE.test(customerKey) || customerKey.length > 200) {
      return NextResponse.json(
        { error: "customerKey is invalid." },
        { status: 400 },
      );
    }

    const rating = parseRating(body.rating);
    const note =
      typeof body.note === "string" ? body.note.trim().slice(0, NOTE_MAX) : "";

    const supabase = createServiceSupabase();
    const { data: existing } = await supabase
      .from("tenant_customer_flags")
      .select("hidden")
      .eq("tenant_id", tenant.id)
      .eq("customer_key", customerKey)
      .maybeSingle();
    const hidden = Boolean(existing?.hidden);

    if (!rating && !note && !hidden) {
      const { error } = await supabase
        .from("tenant_customer_flags")
        .delete()
        .eq("tenant_id", tenant.id)
        .eq("customer_key", customerKey);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      return NextResponse.json({
        ok: true,
        customerKey,
        rating: null,
        note: "",
      });
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from("tenant_customer_flags").upsert(
      {
        tenant_id: tenant.id,
        customer_key: customerKey,
        rating,
        note,
        hidden,
        updated_at: now,
      },
      { onConflict: "tenant_id,customer_key" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      customerKey,
      rating,
      note,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
