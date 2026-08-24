"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";

import { GoogleMap } from "@/components/maps/GoogleMap";
import { koreanHitToSalon } from "@/features/korean-search";
import type {
  KoreanSearchHit,
  KoreanSearchIntent,
  KoreanSearchOrigin,
} from "@/features/korean-search";
import { useMap } from "@/hooks/useMap";
import { cn } from "@/lib/utils";

function formatPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) return "가격 문의";
  return `$${Math.round(price)}`;
}

function formatRating(rating: number, reviewCount: number) {
  if (!rating) return "평점 없음";
  const count = reviewCount > 0 ? ` (${reviewCount})` : "";
  return `★ ${rating.toFixed(1)}${count}`;
}

function formatDistance(km: number | null) {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

type KoreanSearchResultsProps = {
  results: KoreanSearchHit[];
  total: number;
  intent: KoreanSearchIntent | null;
  origin: KoreanSearchOrigin | null;
};

export function KoreanSearchResults({
  results,
  total,
  intent,
  origin,
}: KoreanSearchResultsProps) {
  const salons = useMemo(() => results.map(koreanHitToSalon), [results]);
  const {
    selectedId,
    focusToken,
    selectSalonFromCard,
    selectSalonFromMarker,
  } = useMap(salons);

  useEffect(() => {
    if (!selectedId) return;
    document
      .getElementById(`kor-hit-${selectedId}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId, focusToken]);

  if (results.length === 0) {
    return (
      <p className="mt-4 text-sm text-neutral-600">
        조건에 맞는 업체를 찾지 못했습니다.
      </p>
    );
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
      <ul className="space-y-3">
        {results.map((hit) => {
          const active = hit.id === selectedId;
          const distance = formatDistance(hit.distanceKm);
          return (
            <li key={hit.id} id={`kor-hit-${hit.id}`}>
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border bg-white transition",
                  active
                    ? "border-neutral-900 shadow-sm ring-1 ring-neutral-900/10"
                    : "border-neutral-200 hover:border-neutral-400",
                )}
              >
                <button
                  type="button"
                  onClick={() => selectSalonFromCard(hit.id)}
                  className="grid w-full grid-cols-[96px_minmax(0,1fr)] text-left sm:grid-cols-[120px_minmax(0,1fr)]"
                >
                  <div className="relative min-h-[96px] bg-neutral-100">
                    {/* Native img: salon covers may be Google/CDN URLs not in next/image hosts. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={hit.coverImage}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                  </div>
                  <div className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <p className="font-semibold text-neutral-900">{hit.name}</p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {formatRating(hit.rating, hit.reviewCount)}
                      <span className="mx-2 text-neutral-300">·</span>
                      {formatPrice(hit.price)}
                      {distance ? (
                        <>
                          <span className="mx-2 text-neutral-300">·</span>
                          {distance}
                        </>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-500">{hit.location}</p>
                  </div>
                </button>
                <div className="border-t border-neutral-100 px-4 py-2">
                  <Link
                    href={hit.detailPath}
                    className="inline-block text-sm font-medium text-neutral-800 underline-offset-4 hover:underline"
                  >
                    상세 보기
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="sticky top-4 h-[min(70vh,560px)] min-h-[280px]">
        <GoogleMap
          salons={salons}
          selectedId={selectedId}
          focusToken={focusToken}
          searchLocation={intent?.location}
          searchOrigin={origin}
          radiusKm={intent?.radiusKm}
          onSelect={selectSalonFromMarker}
          className="h-full"
        />
        <p className="sr-only">
          {total}곳 {intent?.location} {intent?.service}
        </p>
      </div>
    </div>
  );
}
