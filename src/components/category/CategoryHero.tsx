import Image from "next/image";

import type { MarketplaceCategory } from "@/features/category";
import { buildCategoryBreadcrumbs } from "@/features/category";

import { CategoryBreadcrumb } from "./CategoryBreadcrumb";

type CategoryHeroProps = {
  category: MarketplaceCategory;
};

export function CategoryHero({ category }: CategoryHeroProps) {
  const breadcrumbs = buildCategoryBreadcrumbs(category);

  return (
    <section className="relative isolate overflow-hidden border-b border-neutral-200/80">
      <div className="relative h-[200px] w-full sm:h-[240px]">
        <Image
          src={category.heroImage}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/25" />
      </div>
      <div className="absolute inset-0 flex items-end">
        <div className="mx-auto w-full max-w-[1600px] px-4 pb-6 sm:px-6 lg:px-8">
          <CategoryBreadcrumb
            items={breadcrumbs}
            className="mb-3 [&_a]:text-white/75 [&_a:hover]:text-white [&_span]:text-white [&_.text-neutral-300]:text-white/40"
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
            {category.label}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {category.headline}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-white/75">
            {category.description}
          </p>
        </div>
      </div>
    </section>
  );
}
