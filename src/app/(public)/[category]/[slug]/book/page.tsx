import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  buildSalonPath,
  getMarketplaceCategory,
  isMarketplaceCategorySlug,
} from "@/features/category";
import { BookingWizard } from "@/features/salon-booking";
import { getBookingSalonContext } from "@/features/salon-booking/getBookingSalonContext";
import { createServiceSupabase } from "@/lib/supabase/service";

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: raw, slug } = await params;
  const category = getMarketplaceCategory(raw);
  if (!category) return { title: "Book" };

  // Service role so staff leave blocks calendar (no public leave RLS).
  const supabase = createServiceSupabase();
  const { context } = await getBookingSalonContext(supabase, slug);
  const name = context?.salonName ?? slug.replace(/-/g, " ");

  return {
    title: `Book · ${name}`,
    description: `Book an appointment at ${name} on AllBook.`,
    robots: { index: false, follow: false },
  };
}

export default async function MarketplaceSalonBookPage({ params }: PageProps) {
  const { category: raw, slug } = await params;
  if (!isMarketplaceCategorySlug(raw)) notFound();

  const category = getMarketplaceCategory(raw);
  if (!category) notFound();

  const supabase = createServiceSupabase();
  const { context, error } = await getBookingSalonContext(supabase, slug);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-rose-700">Could not load booking: {error}</p>
      </div>
    );
  }

  if (!context) notFound();

  return (
    <div className="min-h-svh bg-[#F7F4EF]">
      <BookingWizard
        context={context}
        backHref={buildSalonPath(category.slug, slug)}
      />
    </div>
  );
}
