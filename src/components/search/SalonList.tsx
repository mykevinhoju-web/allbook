"use client";

import type { Salon } from "@/types/salon";

import { SalonCard } from "./SalonCard";

type SalonListProps = {
  salons: Salon[];
  categorySlug?: string;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onBook?: (id: string) => void;
  className?: string;
};

export function SalonList({
  salons,
  categorySlug = "hair",
  selectedId,
  onSelect,
  onBook,
  className,
}: SalonListProps) {
  return (
    <div className={className}>
      <div className="grid gap-3 sm:gap-4">
        {salons.map((salon) => (
          <SalonCard
            key={salon.id}
            salon={salon}
            categorySlug={categorySlug}
            selected={selectedId === salon.id}
            onSelect={onSelect}
            onBook={onBook}
          />
        ))}
      </div>
    </div>
  );
}
