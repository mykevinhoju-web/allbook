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
  bookableOnly: boolean;
  onBookableOnlyChange: (next: boolean) => void;
};

export function KoreanSearchResults({
  results,
  total,
  intent,
  origin,
  bookableOnly,
  onBookableOnlyChange,
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

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
      <div>
        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="size-4"
            checked={bookableOnly}
            onChange={(event) => onBookableOnlyChange(event.target.checked)}
          />
          예약 가능한 업체만
        </label>
        {results.length === 0 ? (
          <p className="text-sm text-neutral-600">
            조건에 맞는 업체를 찾지 못했습니다.
          </p>
        ) : (
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-neutral-900">{hit.name}</p>
                      {hit.bookingEnabled ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          예약 가능
                        </span>
                      ) : null}
                    </div>
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
                <div className="flex items-center gap-4 border-t border-neutral-100 px-4 py-2">
                  <Link
                    href={hit.detailPath}
                    className="text-sm font-medium text-neutral-800 underline-offset-4 hover:underline"
                  >
                    상세 보기
                  </Link>
                  {hit.bookingEnabled && hit.bookPath ? (
                    <Link
                      href={hit.bookPath}
                      className="text-sm font-semibold text-neutral-950 underline-offset-4 hover:underline"
                    >
                      예약
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
        )}
      </div>

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
