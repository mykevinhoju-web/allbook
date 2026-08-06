export type MockSalon = {
  id: string;
  name: string;
  suburb: string;
  latitude: number;
  longitude: number;
  rating: number;
  coverImage: string;
  service: string;
  price: number;
};

/**
 * Temporary marketplace salons for /search map + list.
 * Replace with Supabase later — keep this shape stable for Maps components.
 */
export const MOCK_SALONS: MockSalon[] = [
  {
    id: "glow-hair-aspley",
    name: "Glow Hair Studio",
    suburb: "Aspley",
    latitude: -27.3632,
    longitude: 153.0164,
    rating: 4.9,
    coverImage:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    service: "Hair",
    price: 65,
  },
  {
    id: "bella-nails-chermside",
    name: "Bella Nails",
    suburb: "Chermside",
    latitude: -27.3849,
    longitude: 153.0312,
    rating: 4.8,
    coverImage:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
    service: "Nails",
    price: 45,
  },
  {
    id: "luxe-beauty-sunnybank",
    name: "Luxe Beauty",
    suburb: "Sunnybank",
    latitude: -27.5704,
    longitude: 153.0608,
    rating: 4.7,
    coverImage:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    service: "Facial",
    price: 89,
  },
  {
    id: "pure-spa-indooroopilly",
    name: "Pure Spa",
    suburb: "Indooroopilly",
    latitude: -27.4992,
    longitude: 152.9726,
    rating: 4.8,
    coverImage:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
    service: "Spa",
    price: 110,
  },
  {
    id: "urban-barber-new-farm",
    name: "Urban Barber",
    suburb: "New Farm",
    latitude: -27.4676,
    longitude: 153.0489,
    rating: 4.6,
    coverImage:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    service: "Barber",
    price: 40,
  },
];
