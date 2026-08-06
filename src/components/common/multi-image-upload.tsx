"use client";

import { GripVertical, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface MultiImageUploadProps {
  value: File[];
  existingUrls?: { id: string; url: string }[];
  maxFiles?: number;
  onChange: (files: File[]) => void;
  onRemoveExisting?: (photoId: string) => void;
  /** Persist a new order for existing photos (first = main). */
  onReorderExisting?: (orderedIds: string[]) => void;
  disabled?: boolean;
  className?: string;
}

function ExistingPhoto({
  photo,
  isMain,
  draggable,
  isDragging,
  isDropTarget,
  onRemove,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  photo: { id: string; url: string };
  isMain: boolean;
  draggable: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onRemove?: (photoId: string) => void;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDragLeave?: () => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photo.url]);

  return (
    <div
      draggable={draggable}
      onDragStart={(event) => {
        if (!draggable) return;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", photo.id);
        onDragStart?.();
      }}
      onDragOver={(event) => {
        if (!draggable) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver?.();
      }}
      onDragLeave={() => onDragLeave?.()}
      onDrop={(event) => {
        if (!draggable) return;
        event.preventDefault();
        onDrop?.();
      }}
      onDragEnd={() => onDragEnd?.()}
      className={cn(
        "relative aspect-square overflow-hidden rounded-xl border bg-muted/20 transition",
        isDropTarget
          ? "border-primary ring-2 ring-primary/30"
          : "border-border/60",
        isDragging && "opacity-50",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
    >
      {failed ? (
        <div className="flex size-full items-center justify-center bg-muted/40 px-2 text-center text-xs text-muted-foreground">
          Image unavailable
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.url}
          alt="Staff photo"
          className="pointer-events-none size-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}

      {draggable ? (
        <span className="pointer-events-none absolute bottom-2 left-2 flex size-7 items-center justify-center rounded-full bg-black/55 text-white">
          <GripVertical className="size-3.5" />
        </span>
      ) : null}

      {isMain ? (
        <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
          Main
        </span>
      ) : null}

      {onRemove ? (
        <button
          type="button"
          className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
          onClick={() => onRemove(photo.id)}
          aria-label="Remove photo"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

function reorderById(
  photos: { id: string; url: string }[],
  fromId: string,
  toId: string,
): { id: string; url: string }[] {
  if (fromId === toId) return photos;
  const fromIndex = photos.findIndex((photo) => photo.id === fromId);
  const toIndex = photos.findIndex((photo) => photo.id === toId);
  if (fromIndex < 0 || toIndex < 0) return photos;

  const next = [...photos];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return photos;
  next.splice(toIndex, 0, moved);
  return next;
}

export function MultiImageUpload({
  value,
  existingUrls = [],
  maxFiles = 5,
  onChange,
  onRemoveExisting,
  onReorderExisting,
  disabled = false,
  className,
}: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPhotoId, setDragPhotoId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const totalCount = existingUrls.length + value.length;
  const canAddMore = totalCount < maxFiles;
  const canReorder =
    !disabled && Boolean(onReorderExisting) && existingUrls.length > 1;

  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );
    const remaining = maxFiles - totalCount;
    const next = [...value, ...incoming.slice(0, remaining)];
    onChange(next);
  };

  const finishReorder = (fromId: string, toId: string) => {
    if (!onReorderExisting) return;
    const next = reorderById(existingUrls, fromId, toId);
    if (next === existingUrls) return;
    onReorderExisting(next.map((photo) => photo.id));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {canReorder ? (
        <p className="text-xs text-muted-foreground">
          Drag photos to change order. The first image is the main profile
          photo.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {existingUrls.map((photo, index) => (
          <ExistingPhoto
            key={photo.id}
            photo={photo}
            isMain={index === 0}
            draggable={canReorder}
            isDragging={dragPhotoId === photo.id}
            isDropTarget={dropTargetId === photo.id && dragPhotoId !== photo.id}
            onRemove={onRemoveExisting}
            onDragStart={() => setDragPhotoId(photo.id)}
            onDragOver={() => setDropTargetId(photo.id)}
            onDragLeave={() =>
              setDropTargetId((current) =>
                current === photo.id ? null : current,
              )
            }
            onDrop={() => {
              if (dragPhotoId) finishReorder(dragPhotoId, photo.id);
              setDragPhotoId(null);
              setDropTargetId(null);
            }}
            onDragEnd={() => {
              setDragPhotoId(null);
              setDropTargetId(null);
            }}
          />
        ))}

        {value.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted/20"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="size-full object-cover"
            />
            {existingUrls.length === 0 && index === 0 ? (
              <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                Main
              </span>
            ) : null}
            <button
              type="button"
              className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
              onClick={() =>
                onChange(value.filter((_, fileIndex) => fileIndex !== index))
              }
              aria-label="Remove photo"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {canAddMore ? (
        <div
          className={cn(
            "relative flex min-h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border/80 bg-muted/20 hover:border-primary/40",
            disabled && "pointer-events-none opacity-50",
          )}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            if (!disabled) addFiles(event.dataTransfer.files);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={disabled}
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <ImagePlus className="mb-2 size-6 text-primary" />
          <p className="text-sm font-medium">Add photos (up to {maxFiles})</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalCount}/{maxFiles} selected
          </p>
        </div>
      ) : null}
    </div>
  );
}
