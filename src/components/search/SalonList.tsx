"use client";

import { SalonCard } from "./SalonCard";
import type { Salon } from "./types";

type SalonListProps = {
  salons: Salon[];
  selectedId?: string | null;
  favorites: Set<string>;
  onSelect?: (id: string) => void;
  onFavoriteToggle?: (id: string) => void;
  onBook?: (id: string) => void;
};

export function SalonList({
  salons,
  selectedId,
  favorites,
  onSelect,
  onFavoriteToggle,
  onBook,
}: SalonListProps) {
  return (
    <div className="grid gap-4 sm:gap-5">
      {salons.map((salon) => (
        <SalonCard
          key={salon.id}
          salon={salon}
          selected={selectedId === salon.id}
          favorited={favorites.has(salon.id)}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
          onBook={onBook}
        />
      ))}
    </div>
  );
}
