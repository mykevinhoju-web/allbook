import { NextResponse } from "next/server";

import { ownerOwnsSalon } from "@/features/dashboard/getOwnerSalon";
import { createClient } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const salonId = String(form.get("salonId") ?? "").trim();
    const kind = String(form.get("kind") ?? "logo").trim();

    if (!(file instanceof File) || !salonId) {
      return NextResponse.json(
        { error: "file and salonId are required." },
        { status: 400 },
      );
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are allowed." },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be under 4MB." },
        { status: 400 },
      );
    }

    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owns = await ownerOwnsSalon(user.id, salonId, session);
    if (!owns) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const path = `business/${salonId}/${kind}-${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const supabase = createServiceSupabase();
    const { error } = await supabase.storage
      .from("staff-photos")
      .upload(path, bytes, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from("staff-photos").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not upload image.",
      },
      { status: 500 },
    );
  }
}
