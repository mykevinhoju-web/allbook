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
  slug?: string | null;
  category_id?: string | null;
  suburb_id?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  amenities?: string[] | null;
  service_tags?: string[] | null;
  opening_hours?: Record<string, unknown> | null;
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
  priceMin?: number | null;
  priceMax?: number | null;
  categoryId?: string | null;
  suburbId?: string | null;
  /** Public URL slug for /{category}/{slug} */
  slug: string;
  /** Coarse service tags (Hair salon, Barber, Colour, …) */
  serviceTags?: string[];
  /** Present when search used a geocoded origin */
  distanceKm?: number;
  /** Derived from opening_hours at query time */
  isOpen?: boolean;
};

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type OpeningHoursDay = {
  open: string;
  close: string;
  closed: boolean;
};

export type OpeningHours = Partial<Record<DayOfWeek, OpeningHoursDay>>;

export type AmenityId =
  | "wifi"
  | "parking"
  | "wheelchair"
  | "coffee"
  | "air_conditioning";

export type SalonGalleryImage = {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
};

export type SalonServiceItem = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
};

export type SalonServiceGroup = {
  category: string;
  services: SalonServiceItem[];
};

export type SalonStaffMember = {
  id: string;
  name: string;
  /** Display role (maps from `role` or `position`) */
  position: string;
  role: string;
  photoUrl: string | null;
  yearsExperience: number;
  languages: string[];
  specialties: string[];
  /** Service names this staff can perform */
  availableServices: string[];
};

export type SalonReview = {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  authorAvatar: string | null;
  images: string[];
  likeCount: number;
  createdAt: string;
};

export type RatingDistribution = {
  stars: 1 | 2 | 3 | 4 | 5;
  count: number;
  percent: number;
};

export type SalonReviewsSummary = {
  average: number;
  total: number;
  distribution: RatingDistribution[];
  reviews: SalonReview[];
};

export type SalonDetail = Salon & {
  amenities: AmenityId[];
  serviceTags: string[];
  openingHours: OpeningHours;
  gallery: SalonGalleryImage[];
  /** Platform-admin flag — public Book Now only when true */
  bookingEnabled: boolean;
};

export type GetSalonsParams = {
  location?: string;
  service?: string;
};
