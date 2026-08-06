import { redirect } from "next/navigation";

import { buildSalonPathFromService } from "@/features/category";
import { getSalon } from "@/features/salon";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Legacy `/salon/[id]` → `/{category}/{slug}` */
export default async function LegacySalonRedirect({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { salon } = await getSalon(supabase, id);

  if (!salon?.slug) {
    redirect("/");
  }

  redirect(buildSalonPathFromService(salon.service, salon.slug));
}
