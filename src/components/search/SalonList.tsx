"use client";

import { SalonCard } from "./SalonCard";
import type { Salon } from "./types";

type SalonListProps = {
  salons: Salon[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onBook?: (id: string) => void;
  className?: string;
};

export function SalonList({
  salons,
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
            selected={selectedId === salon.id}
            onSelect={onSelect}
            onBook={onBook}
          />
        ))}
      </div>
    </div>
  );
}
