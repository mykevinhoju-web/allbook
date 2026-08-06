export type SalonServiceTag =
  | "Hair"
  | "Nails"
  | "Spa"
  | "Massage"
  | "Facial"
  | "Waxing"
  | "Brows";

export type SearchFilterChip =
  | SalonServiceTag
  | "Open Now"
  | "Top Rated";

export interface Salon {
  id: string;
  name: string;
  logoInitials: string;
  logoColor: string;
  coverGradient: string;
  rating: number;
  reviewCount: number;
  address: string;
  suburb: string;
  distanceKm: number;
  isOpen: boolean;
  availableToday: boolean;
  tags: SalonServiceTag[];
  startingPrice: number;
  /** Percentage layout for placeholder map fallback */
  mapX: number;
  mapY: number;
  /** WGS84 coordinates for Google Maps markers */
  lat: number;
  lng: number;
}

export interface SearchToolbarValues {
  location: string;
  service: string;
  dateLabel: string;
}
