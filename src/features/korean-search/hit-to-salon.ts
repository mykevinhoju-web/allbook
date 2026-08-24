import type { Salon } from "@/types/salon";

import type { KoreanSearchHit } from "./types";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80";

/** Shape Korean hits for the existing marketplace GoogleMap / SalonMarker. */
export function koreanHitToSalon(hit: KoreanSearchHit): Salon {
  return {
    id: hit.id,
    name: hit.name,
    description: null,
    phone: null,
    email: null,
    website: null,
    coverImage: FALLBACK_COVER,
    logo: null,
    address: hit.location,
    suburb: hit.suburb,
    city: hit.city,
    state: "QLD",
    postcode: null,
    country: "Australia",
    latitude: hit.latitude,
    longitude: hit.longitude,
    rating: hit.rating,
    reviewCount: hit.reviewCount,
    verified: false,
    service: hit.service,
    price: hit.price,
    slug: hit.slug,
    distanceKm: hit.distanceKm ?? undefined,
  };
}
