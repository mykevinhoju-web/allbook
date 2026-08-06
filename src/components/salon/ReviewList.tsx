"use client";

import Image from "next/image";
import { Heart, Star } from "lucide-react";
import { useState } from "react";

import type { SalonReviewsSummary } from "@/types/salon";
import { cn } from "@/lib/utils";

type ReviewListProps = {
  summary: SalonReviewsSummary;
};

function formatReviewDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ReviewList({ summary }: ReviewListProps) {
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  if (summary.reviews.length === 0) {
    return (
      <section className="rounded-3xl border border-neutral-200/80 bg-white px-6 py-12 text-center">
        <p className="text-sm text-neutral-500">No reviews yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
          Reviews
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          What clients are saying
        </p>
      </div>

      <div className="grid gap-4 rounded-3xl border border-neutral-200/80 bg-white p-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:p-6">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-neutral-50 py-4">
          <p className="text-4xl font-semibold tracking-tight text-neutral-950">
            {summary.average.toFixed(1)}
          </p>
          <div className="mt-1 flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                className={cn(
                  "size-3.5",
                  index < Math.round(summary.average)
                    ? "fill-amber-400 text-amber-400"
                    : "text-neutral-300",
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-[12px] text-neutral-500">
            {summary.total} review{summary.total === 1 ? "" : "s"}
          </p>
        </div>

        <ul className="space-y-2.5">
          {summary.distribution.map((row) => (
            <li key={row.stars} className="flex items-center gap-3 text-sm">
              <span className="w-8 tabular-nums text-neutral-500">
                {row.stars}★
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-neutral-900 transition-all duration-500"
                  style={{ width: `${row.percent}%` }}
                />
              </div>
              <span className="w-8 text-right tabular-nums text-neutral-400">
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="space-y-3">
        {summary.reviews.map((review) => {
          const isLiked = liked[review.id] ?? false;
          const likeCount = review.likeCount + (isLiked ? 1 : 0);
          return (
            <li
              key={review.id}
              className="rounded-3xl border border-neutral-200/80 bg-white p-5"
            >
              <div className="flex items-start gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                  {review.authorAvatar ? (
                    <Image
                      src={review.authorAvatar}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-semibold text-neutral-500">
                      {review.authorName.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-neutral-950">
                      {review.authorName}
                    </p>
                    <p className="text-[12px] text-neutral-400">
                      {formatReviewDate(review.createdAt)}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={cn(
                          "size-3.5",
                          index < Math.round(review.rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-neutral-300",
                        )}
                      />
                    ))}
                  </div>
                  {review.comment ? (
                    <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                      {review.comment}
                    </p>
                  ) : null}

                  {review.images.length > 0 ? (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {review.images.map((url) => (
                        <div
                          key={url}
                          className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100"
                        >
                          <Image
                            src={url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() =>
                      setLiked((prev) => ({
                        ...prev,
                        [review.id]: !isLiked,
                      }))
                    }
                    className={cn(
                      "mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition",
                      isLiked
                        ? "bg-rose-50 text-rose-600"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                    )}
                  >
                    <Heart
                      className={cn("size-3.5", isLiked && "fill-current")}
                    />
                    {likeCount}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
