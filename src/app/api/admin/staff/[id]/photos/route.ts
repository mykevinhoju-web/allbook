import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

const MAX_PHOTOS = 5;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
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

    revalidateTag("booking-staff");

    return NextResponse.json({ photos: uploaded });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
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

    const { data: remaining } = await supabase
      .from("staff_photos")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("staff_id", staffId)
      .order("sort_order", { ascending: true });

    for (let index = 0; index < (remaining ?? []).length; index += 1) {
      const row = remaining![index]!;
      await supabase
        .from("staff_photos")
        .update({ sort_order: index })
        .eq("id", row.id)
        .eq("staff_id", staffId)
        .eq("tenant_id", tenant.id);
    }

    revalidateTag("booking-staff");

    return NextResponse.json({ ok: true });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const { id: staffId } = await params;
    const body = (await request.json()) as { photoIds?: unknown };

    if (
      !Array.isArray(body.photoIds) ||
      body.photoIds.length === 0 ||
      body.photoIds.some((id) => typeof id !== "string" || !id)
    ) {
      return NextResponse.json(
        { error: "photoIds must be a non-empty string array." },
        { status: 400 },
      );
    }

    const photoIds = body.photoIds as string[];
    if (photoIds.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS} photos per staff member.` },
        { status: 400 },
      );
    }

    if (new Set(photoIds).size !== photoIds.length) {
      return NextResponse.json(
        { error: "photoIds must be unique." },
        { status: 400 },
      );
    }

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

    const { data: existingPhotos, error: listError } = await supabase
      .from("staff_photos")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("staff_id", staffId);

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 503 });
    }

    const existingIds = new Set((existingPhotos ?? []).map((photo) => photo.id));
    if (
      existingIds.size !== photoIds.length ||
      photoIds.some((id) => !existingIds.has(id))
    ) {
      return NextResponse.json(
        { error: "photoIds must match the staff member's photos." },
        { status: 400 },
      );
    }

    // Two-phase update avoids unique (staff_id, sort_order) collisions mid-swap.
    for (let index = 0; index < photoIds.length; index += 1) {
      const { error } = await supabase
        .from("staff_photos")
        .update({ sort_order: index + 1000 })
        .eq("id", photoIds[index]!)
        .eq("staff_id", staffId)
        .eq("tenant_id", tenant.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
    }

    for (let index = 0; index < photoIds.length; index += 1) {
      const { error } = await supabase
        .from("staff_photos")
        .update({ sort_order: index })
        .eq("id", photoIds[index]!)
        .eq("staff_id", staffId)
        .eq("tenant_id", tenant.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
    }

    revalidateTag("booking-staff");

    return NextResponse.json({
      photos: photoIds.map((id, sortOrder) => ({ id, sortOrder })),
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
