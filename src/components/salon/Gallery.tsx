"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";

import type { SalonGalleryImage } from "@/types/salon";
import { cn } from "@/lib/utils";

type GalleryProps = {
  images: SalonGalleryImage[];
  salonName: string;
};

export function SalonGallery({ images, salonName }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <section className="rounded-3xl border border-neutral-200/80 bg-white px-6 py-12 text-center">
        <p className="text-sm text-neutral-500">No gallery photos yet.</p>
      </section>
    );
  }

  const active = activeIndex !== null ? images[activeIndex] : null;

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
            Gallery
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {images.length} photo{images.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "group relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100",
              "ring-offset-2 transition duration-300 hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-neutral-900",
              index === 0 && "sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-[280px]",
            )}
          >
            <Image
              src={image.url}
              alt={image.alt || salonName}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </button>
        ))}
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Gallery lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveIndex(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setActiveIndex(null);
          }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            onClick={() => setActiveIndex(null)}
          >
            <X className="size-5" />
          </button>
          <div
            className="relative h-[min(80vh,720px)] w-full max-w-5xl overflow-hidden rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={active.url}
              alt={active.alt || salonName}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
