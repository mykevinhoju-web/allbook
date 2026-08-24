"use client";

import Link from "next/link";
import { Clock, MapPin, Phone, Star } from "lucide-react";

import { GoogleMap } from "@/components/maps/GoogleMap";
import {
  DAY_OF_WEEK_ORDER,
  buildDirectionsUrl,
  formatSalonFullAddress,
  todayDayKey,
  type SalonPageData,
} from "@/features/salon";
import type { MarketplaceCategory } from "@/features/category";
import type { DayOfWeek, OpeningHours } from "@/types/salon";
import { cn } from "@/lib/utils";

const DAY_LABELS_KO: Record<DayOfWeek, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

const SERVICE_LABELS: Record<string, string> = {
  Hair: "헤어",
  Nails: "네일",
  Spa: "스파",
  Barber: "바버",
  Massage: "마사지",
  Facial: "페이셜",
  Waxing: "왁싱",
};

function hasOpeningHours(hours: OpeningHours) {
  return DAY_OF_WEEK_ORDER.some((day) => hours[day] != null);
}

function formatPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) return null;
  return `$${Math.round(price)}`;
}

function serviceLabel(service: string) {
  return SERVICE_LABELS[service] ?? service;
}

type KoreanSalonDetailViewProps = {
  data: SalonPageData;
  category: MarketplaceCategory;
};

export function KoreanSalonDetailView({
  data,
  category,
}: KoreanSalonDetailViewProps) {
  const { salon, serviceGroups } = data;
  const address = formatSalonFullAddress(salon);
  const hoursOk = hasOpeningHours(salon.openingHours);
  const startPrice = formatPrice(salon.price);
  const bookHref = salon.bookingEnabled
    ? `/${category.slug}/${encodeURIComponent(salon.slug)}/book`
    : null;
  const hasServices = serviceGroups.some((group) => group.services.length > 0);
  const showRating = salon.rating > 0 || salon.reviewCount > 0;
  const today = todayDayKey();

  return (
    <div className="min-h-svh bg-white text-neutral-950">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 sm:px-6">
          <Link href="/" className="text-sm font-medium text-neutral-700">
            ← 검색
          </Link>
          {bookHref ? (
            <Link
              href={bookHref}
              className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
            >
              예약
            </Link>
          ) : null}
        </div>
      </header>

      {salon.coverImage ? (
        <div className="relative h-52 w-full bg-neutral-100 sm:h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={salon.coverImage}
            alt=""
            className="size-full object-cover"
          />
        </div>
      ) : null}

      <main className="mx-auto max-w-3xl space-y-8 px-5 py-8 sm:px-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">{salon.name}</h1>
          {salon.service ? (
            <p className="mt-1 text-sm text-neutral-500">
              {serviceLabel(salon.service)}
            </p>
          ) : null}
          {showRating ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-neutral-700">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {salon.rating > 0 ? salon.rating.toFixed(1) : "평점 없음"}
              {salon.reviewCount > 0 ? (
                <span className="text-neutral-500">({salon.reviewCount})</span>
              ) : null}
            </p>
          ) : null}
          {startPrice && !hasServices ? (
            <p className="mt-2 text-sm text-neutral-700">가격 {startPrice}~</p>
          ) : null}
        </section>

        {address ? (
          <section>
            <h2 className="text-sm font-semibold text-neutral-400">주소</h2>
            <p className="mt-2 flex items-start gap-2 text-sm text-neutral-800">
              <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" />
              {address}
            </p>
          </section>
        ) : null}

        {salon.phone ? (
          <section>
            <h2 className="text-sm font-semibold text-neutral-400">전화번호</h2>
            <a
              href={`tel:${salon.phone}`}
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-neutral-900"
            >
              <Phone className="size-4 text-neutral-400" />
              {salon.phone}
            </a>
          </section>
        ) : null}

        {hoursOk ? (
          <section>
            <h2 className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400">
              <Clock className="size-3.5" />
              영업시간
            </h2>
            <ul className="space-y-1.5 text-sm">
              {DAY_OF_WEEK_ORDER.map((day) => {
                const row = salon.openingHours[day];
                const isToday = day === today;
                return (
                  <li
                    key={day}
                    className={cn(
                      "flex items-center justify-between gap-3",
                      isToday
                        ? "font-semibold text-neutral-950"
                        : "text-neutral-600",
                    )}
                  >
                    <span>{DAY_LABELS_KO[day]}</span>
                    <span className="tabular-nums">
                      {!row || row.closed
                        ? "휴무"
                        : `${row.open} – ${row.close}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {hasServices ? (
          <section>
            <h2 className="text-sm font-semibold text-neutral-400">서비스</h2>
            <ul className="mt-3 space-y-2">
              {serviceGroups.flatMap((group) =>
                group.services.map((service) => {
                  const price = formatPrice(service.price);
                  return (
                    <li
                      key={service.id}
                      className="flex items-baseline justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-neutral-900">
                          {service.name}
                        </p>
                        {service.durationMinutes > 0 ? (
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {service.durationMinutes}분
                          </p>
                        ) : null}
                      </div>
                      {price ? (
                        <p className="shrink-0 tabular-nums text-sm font-semibold">
                          {price}
                        </p>
                      ) : null}
                    </li>
                  );
                }),
              )}
            </ul>
          </section>
        ) : null}

        {Number.isFinite(salon.latitude) && Number.isFinite(salon.longitude) ? (
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="text-sm font-semibold text-neutral-400">지도</h2>
              <a
                href={buildDirectionsUrl(salon)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-neutral-800 underline-offset-4 hover:underline"
              >
                길찾기
              </a>
            </div>
            <div className="overflow-hidden rounded-2xl border border-neutral-200">
              <GoogleMap
                salons={[salon]}
                selectedId={salon.id}
                className="h-[280px]"
              />
            </div>
          </section>
        ) : null}
      </main>

      {bookHref ? (
        <div className="sticky bottom-0 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur">
          <Link
            href={bookHref}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white"
          >
            예약하기
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function KoreanSalonNotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-20 text-center">
      <p className="text-sm text-neutral-600">업체를 찾지 못했습니다.</p>
      <Link href="/" className="mt-4 inline-block text-sm font-medium underline">
        검색으로
      </Link>
    </div>
  );
}

export function KoreanSalonError({ message }: { message?: string }) {
  return (
    <div className="mx-auto max-w-lg px-5 py-20 text-center">
      <p className="text-sm text-red-600">
        {message ?? "업체 정보를 불러오지 못했습니다."}
      </p>
      <Link href="/" className="mt-4 inline-block text-sm font-medium underline">
        검색으로
      </Link>
    </div>
  );
}
