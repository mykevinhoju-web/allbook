import { NextResponse } from "next/server";

import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const { id } = await context.params;
    const noteId = id?.trim() ?? "";
    if (!noteId) {
      return NextResponse.json({ error: "Note id is required." }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { error, count } = await supabase
      .from("staff_notes")
      .delete({ count: "exact" })
      .eq("tenant_id", tenant.id)
      .eq("id", noteId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (!count) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
