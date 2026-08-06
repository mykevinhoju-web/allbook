import {
  SalonDetailError,
  SalonDetailView,
  SalonNotFound,
} from "@/components/salon";
import { CategoryBreadcrumb } from "@/components/category/CategoryBreadcrumb";
import {
  buildCategoryBreadcrumbs,
  type MarketplaceCategory,
} from "@/features/category";
import type { SalonPageData } from "@/features/salon";

type CategorySalonPageProps = {
  category: MarketplaceCategory;
  data: SalonPageData;
};

/** Category-scoped salon detail — reuses the shared salon detail view. */
export function CategorySalonPage({
  category,
  data,
}: CategorySalonPageProps) {
  const breadcrumbs = buildCategoryBreadcrumbs(category, {
    salonName: data.salon.name,
    location: data.salon.suburb,
  });

  return (
    <div>
      <div className="border-b border-neutral-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
          <CategoryBreadcrumb items={breadcrumbs} />
        </div>
      </div>
      <SalonDetailView data={data} backHref={`/${category.slug}`} />
    </div>
  );
}

export function CategorySalonError({
  category,
  message,
}: {
  category: MarketplaceCategory;
  message?: string;
}) {
  return (
    <SalonDetailError
      message={message}
      backHref={`/${category.slug}`}
      backLabel={`Back to ${category.label}`}
    />
  );
}

export function CategorySalonNotFound({
  category,
}: {
  category: MarketplaceCategory;
}) {
  return (
    <SalonNotFound
      backHref={`/${category.slug}`}
      backLabel={`Browse ${category.label.toLowerCase()}`}
    />
  );
}
