import type { KoreanSearchIntent } from "./parse-korean-query";

export type KoreanSearchOrigin = {
  lat: number;
  lng: number;
};

export type KoreanSearchHit = {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  location: string;
  suburb: string;
  city: string;
  slug: string;
  service: string;
  detailPath: string;
  coverImage: string;
  logo: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
};

export type KoreanSearchResponse = {
  ok: true;
  intent: KoreanSearchIntent;
  origin: KoreanSearchOrigin | null;
  results: KoreanSearchHit[];
  total: number;
};
