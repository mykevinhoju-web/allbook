"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface MultiImageUploadProps {
  value: File[];
  existingUrls?: { id: string; url: string }[];
  maxFiles?: number;
  onChange: (files: File[]) => void;
  onRemoveExisting?: (photoId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function MultiImageUpload({
  value,
  existingUrls = [],
  maxFiles = 5,
  onChange,
  onRemoveExisting,
  disabled = false,
  className,
}: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const totalCount = existingUrls.length + value.length;
  const canAddMore = totalCount < maxFiles;

  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );
    const remaining = maxFiles - totalCount;
    const next = [...value, ...incoming.slice(0, remaining)];
    onChange(next);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {existingUrls.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted/20"
          >
            <Image
              src={photo.url}
              alt="Staff photo"
              fill
              className="object-cover"
              sizes="160px"
            />
            {onRemoveExisting ? (
              <button
                type="button"
                className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
                onClick={() => onRemoveExisting(photo.id)}
                aria-label="Remove photo"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
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
