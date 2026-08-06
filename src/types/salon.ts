export type SalonRow = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  cover_image: string | null;
  logo: string | null;
  address: string | null;
  suburb: string | null;
  city: string;
  state: string;
  postcode: string | null;
  country: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  verified: boolean;
  primary_service: string | null;
  starting_price: number;
  created_at: string;
  updated_at: string;
};

/**
 * View model used by Search list + Google Maps markers.
 * Mapped from `SalonRow` in features/salon — keep UI free of DB field names.
 */
export type Salon = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  coverImage: string;
  logo: string | null;
  address: string | null;
  suburb: string;
  city: string;
  state: string;
  postcode: string | null;
  country: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  service: string;
  price: number;
  /** Present when search used a geocoded origin */
  distanceKm?: number;
};

export type GetSalonsParams = {
  location?: string;
  service?: string;
};
