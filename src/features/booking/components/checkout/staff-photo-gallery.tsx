"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface StaffPhotoGalleryProps {
  name: string;
  initials: string;
  photos: string[];
  /** Fallback when photos array is empty. */
  photoUrl?: string | null;
}

function GalleryTile({
  src,
  alt,
  className,
  sizes,
  priority,
  onOpen,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-stone-100 text-sm font-semibold text-[#8A6A3A]",
          className,
        )}
      >
        {alt.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "relative block overflow-hidden bg-stone-100 transition active:opacity-90",
        className,
      )}
      aria-label={`View photo of ${alt}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover object-top"
        priority={priority}
        unoptimized
        onError={() => setFailed(true)}
      />
    </button>
  );
}

export function StaffPhotoGallery({
  name,
  initials,
  photos,
  photoUrl,
}: StaffPhotoGalleryProps) {
  const urls =
    photos.length > 0
      ? photos
      : photoUrl
        ? [photoUrl]
        : [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowRight") {
        setLightboxIndex((current) =>
          current === null ? null : (current + 1) % urls.length,
        );
      }
      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) =>
          current === null
            ? null
            : (current - 1 + urls.length) % urls.length,
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxIndex, urls.length]);

  if (urls.length === 0) {
    return (
      <div className="mx-auto flex size-28 items-center justify-center rounded-full bg-stone-100 text-xl font-semibold text-[#8A6A3A] shadow-md ring-2 ring-stone-100">
        {initials}
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <>
        <GalleryTile
          src={urls[0]!}
          alt={name}
          className="mx-auto aspect-[4/5] w-full max-w-[220px] rounded-2xl shadow-md"
          sizes="220px"
          priority
          onOpen={() => setLightboxIndex(0)}
        />
        <PhotoLightbox
          name={name}
          urls={urls}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      </>
    );
  }

  const hero = urls[0]!;
  const side = urls.slice(1, 5);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100 shadow-soft">
        <div className="grid aspect-[4/3] grid-cols-4 grid-rows-2 gap-0.5 sm:gap-1">
          <GalleryTile
            src={hero}
            alt={name}
            className="col-span-2 row-span-2 min-h-0"
            sizes="(max-width: 448px) 50vw, 224px"
            priority
            onOpen={() => setLightboxIndex(0)}
          />
          {side.map((url, index) => (
            <GalleryTile
              key={`${url}-${index}`}
              src={url}
              alt={`${name} ${index + 2}`}
              className="min-h-0"
              sizes="(max-width: 448px) 25vw, 112px"
              onOpen={() => setLightboxIndex(index + 1)}
            />
          ))}
        </div>
      </div>

      <PhotoLightbox
        name={name}
        urls={urls}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
}

function PhotoLightbox({
  name,
  urls,
  index,
  onClose,
  onIndexChange,
}: {
  name: string;
  urls: string[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  if (index === null) return null;

  const src = urls[index];
  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} photo`}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm"
        aria-label="Close"
      >
        <X className="size-5" />
      </button>

      {urls.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-lg text-white backdrop-blur-sm"
            aria-label="Previous photo"
            onClick={(event) => {
              event.stopPropagation();
              onIndexChange((index - 1 + urls.length) % urls.length);
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-lg text-white backdrop-blur-sm"
            aria-label="Next photo"
            onClick={(event) => {
              event.stopPropagation();
              onIndexChange((index + 1) % urls.length);
            }}
          >
            ›
          </button>
        </>
      ) : null}

      <div
        className="relative h-[min(78dvh,720px)] w-full max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src={src}
          alt={`${name} photo ${index + 1}`}
          fill
          sizes="(max-width: 512px) 100vw, 512px"
          className="object-contain"
          priority
          unoptimized
        />
      </div>

      {urls.length > 1 ? (
        <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
          {index + 1} / {urls.length}
        </p>
      ) : null}
    </div>
  );
}
