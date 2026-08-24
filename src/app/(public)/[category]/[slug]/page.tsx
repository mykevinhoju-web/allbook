import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import {
  CategorySalonError,
  CategorySalonNotFound,
  CategorySalonPage,
} from "@/components/category";
import {
  buildSalonMetadata,
  getMarketplaceCategory,
  isMarketplaceCategorySlug,
  resolveCategoryFromService,
} from "@/features/category";
import {
  KoreanSalonDetailView,
  KoreanSalonError,
  KoreanSalonNotFound,
} from "@/features/platform-landing/components/korean-salon-detail";
import { getSalonPageDataBySlug } from "@/features/salon";
import { isKoreanPlatformHost } from "@/features/tenants/utils/resolve-host";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: raw, slug } = await params;
  const category = getMarketplaceCategory(raw);
  if (!category) return { title: "Salon" };

  const supabase = await createClient();
  const result = await getSalonPageDataBySlug(supabase, slug);
  if (result.status !== "ok") {
    return buildSalonMetadata({
      category,
      salonName: "Salon",
      description: null,
      suburb: "",
    });
  }

  return buildSalonMetadata({
    category,
    salonName: result.data.salon.name,
    description: result.data.salon.description,
    suburb: result.data.salon.suburb,
    slug: result.data.salon.slug,
  });
}

export default async function MarketplaceCategorySalonPage({
  params,
}: PageProps) {
  const { category: raw, slug } = await params;
  if (!isMarketplaceCategorySlug(raw)) {
    notFound();
  }

  const category = getMarketplaceCategory(raw);
  if (!category) {
    notFound();
  }

  const supabase = await createClient();
  const result = await getSalonPageDataBySlug(supabase, slug);
  const host =
    (await headers()).get("x-forwarded-host") ??
    (await headers()).get("host") ??
    "";
  const korean = isKoreanPlatformHost(host);

  if (result.status === "not_found") {
    return korean ? (
      <KoreanSalonNotFound />
    ) : (
      <CategorySalonNotFound category={category} />
    );
  }

  if (result.status === "error") {
    return korean ? (
      <KoreanSalonError message={result.error} />
    ) : (
      <CategorySalonError category={category} message={result.error} />
    );
  }

  // Prefer the category derived from salon service when it mismatches the URL.
  const salonCategory =
    resolveCategoryFromService(result.data.salon.service) ?? category;

  if (korean) {
    return (
      <KoreanSalonDetailView category={salonCategory} data={result.data} />
    );
  }

  return (
    <CategorySalonPage category={salonCategory} data={result.data} />
  );
}
