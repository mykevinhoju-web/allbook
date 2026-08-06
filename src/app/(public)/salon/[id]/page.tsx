import type { Metadata } from "next";

import {
  SalonDetailError,
  SalonDetailView,
  SalonNotFound,
} from "@/components/salon";
import { getSalonPageData } from "@/features/salon";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const result = await getSalonPageData(supabase, id);

  if (result.status !== "ok") {
    return { title: "Salon" };
  }

  const { salon } = result.data;
  return {
    title: salon.name,
    description:
      salon.description ??
      `${salon.name} in ${salon.suburb} — book online with AllBook.`,
  };
}

export default async function SalonDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await getSalonPageData(supabase, id);

  if (result.status === "not_found") {
    return <SalonNotFound />;
  }

  if (result.status === "error") {
    return <SalonDetailError message={result.error} />;
  }

  return <SalonDetailView data={result.data} />;
}
