import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

const MAX_PHOTOS = 5;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { id: staffId } = await params;
    const supabase = createServiceSupabase();

    const { data: staff } = await supabase
      .from("staff")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("id", staffId)
      .maybeSingle();

    if (!staff) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const { count } = await supabase
      .from("staff_photos")
      .select("id", { count: "exact", head: true })
      .eq("staff_id", staffId);

    const existingCount = count ?? 0;
    const formData = await request.formData();
    const files = formData.getAll("photos").filter((item) => item instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No photos provided." }, { status: 400 });
    }

    if (existingCount + files.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS} photos per staff member.` },
        { status: 400 },
      );
    }

    const uploaded: { id: string; url: string; sortOrder: number }[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index] as File;
      const extension = file.name.split(".").pop() ?? "jpg";
      const path = `${tenant.id}/${staffId}/${Date.now()}-${index}.${extension}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await supabase.storage
        .from("staff-photos")
        .upload(path, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          {
            error: uploadError.message,
            hint: "Run operations migration for staff-photos storage bucket.",
          },
          { status: 503 },
        );
      }

      const { data: publicUrl } = supabase.storage
        .from("staff-photos")
        .getPublicUrl(path);

      const sortOrder = existingCount + index;
      const { data: photoRow, error: insertError } = await supabase
        .from("staff_photos")
        .insert({
          tenant_id: tenant.id,
          staff_id: staffId,
          url: publicUrl.publicUrl,
          sort_order: sortOrder,
        })
        .select("id, url, sort_order")
        .single();

      if (insertError || !photoRow) {
        return NextResponse.json(
          { error: insertError?.message ?? "Failed to save photo." },
          { status: 503 },
        );
      }

      uploaded.push({
        id: photoRow.id,
        url: photoRow.url,
        sortOrder: photoRow.sort_order,
      });
    }

    return NextResponse.json({ photos: uploaded });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { id: staffId } = await params;
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");

    if (!photoId) {
      return NextResponse.json({ error: "photoId is required." }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { data: photo } = await supabase
      .from("staff_photos")
      .select("id, url")
      .eq("tenant_id", tenant.id)
      .eq("staff_id", staffId)
      .eq("id", photoId)
      .maybeSingle();

    if (!photo) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    const storagePath = photo.url.split("/staff-photos/")[1];
    if (storagePath) {
      await supabase.storage.from("staff-photos").remove([storagePath]);
    }

    const { error } = await supabase
      .from("staff_photos")
      .delete()
      .eq("id", photoId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
