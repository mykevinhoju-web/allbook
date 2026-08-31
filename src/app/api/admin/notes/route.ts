import { NextResponse } from "next/server";

import { isValidReportDate } from "@/features/admin/lib/revenue-report";
import { todayDateInZone } from "@/features/booking/lib/schedule-utils";
import { isOtherStaffGuestAttributes } from "@/features/booking/lib/booking-other-staff";
import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

function mapNote(row: {
  id: string;
  staff_id: string;
  note_date: string;
  body: string;
  created_at: string;
  staff?: { name: string } | { name: string }[] | null;
}) {
  const staff = row.staff;
  const staffName = (Array.isArray(staff) ? staff[0]?.name : staff?.name) ?? "Staff";
  return {
    id: row.id,
    staffId: row.staff_id,
    staffName,
    noteDate: row.note_date,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const supabase = createServiceSupabase();

    const [{ data: notes, error: notesError }, { data: staffRows, error: staffError }] =
      await Promise.all([
        supabase
          .from("staff_notes")
          .select("id, staff_id, note_date, body, created_at, staff(name)")
          .eq("tenant_id", tenant.id)
          .order("note_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("staff")
          .select("id, name, status, attributes")
          .eq("tenant_id", tenant.id)
          .eq("status", "active")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
      ]);

    if (notesError) {
      return NextResponse.json({ error: notesError.message }, { status: 503 });
    }
    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 503 });
    }

    const staff = (staffRows ?? [])
      .filter((row) => !isOtherStaffGuestAttributes(row.attributes))
      .map((row) => ({ id: row.id, name: row.name }));

    return NextResponse.json({
      notes: (notes ?? []).map(mapNote),
      staff,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const body = (await request.json()) as {
      staffId?: string;
      noteDate?: string;
      body?: string;
    };

    const staffId = body.staffId?.trim() ?? "";
    const noteText = body.body?.trim() ?? "";
    const noteDate =
      body.noteDate?.trim() || todayDateInZone(timeZone);

    if (!staffId) {
      return NextResponse.json({ error: "Select staff." }, { status: 400 });
    }
    if (!noteText) {
      return NextResponse.json({ error: "Enter a note." }, { status: 400 });
    }
    if (noteText.length > 4000) {
      return NextResponse.json(
        { error: "Note is too long (max 4000 characters)." },
        { status: 400 },
      );
    }
    if (!isValidReportDate(noteDate)) {
      return NextResponse.json(
        { error: "noteDate must be YYYY-MM-DD." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const { data: staffRow, error: staffError } = await supabase
      .from("staff")
      .select("id, attributes, status")
      .eq("tenant_id", tenant.id)
      .eq("id", staffId)
      .maybeSingle();

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 503 });
    }
    if (
      !staffRow ||
      staffRow.status !== "active" ||
      isOtherStaffGuestAttributes(staffRow.attributes)
    ) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("staff_notes")
      .insert({
        tenant_id: tenant.id,
        staff_id: staffId,
        note_date: noteDate,
        body: noteText,
        updated_at: now,
      })
      .select("id, staff_id, note_date, body, created_at, staff(name)")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Could not save note." },
        { status: 503 },
      );
    }

    return NextResponse.json({ note: mapNote(data) });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
