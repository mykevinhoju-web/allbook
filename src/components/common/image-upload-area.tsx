"use client";

import { ImagePlus, Upload } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface ImageUploadAreaProps extends React.ComponentProps<"div"> {
  title?: string;
  description?: string;
  accept?: string;
  disabled?: boolean;
}

export function ImageUploadArea({
  title = "Upload image",
  description = "Drag and drop an image here, or click to browse",
  accept = "image/*",
  disabled = false,
  className,
  ...props
}: ImageUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={cn(
        "relative flex min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border/80 bg-muted/20 hover:border-primary/40 hover:bg-muted/30",
        disabled && "pointer-events-none opacity-50",
        className,
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
      }}
      {...props}
    >
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={title}
        onChange={() => undefined}
      />
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {isDragging ? (
          <Upload className="size-6" aria-hidden="true" />
        ) : (
          <ImagePlus className="size-6" aria-hidden="true" />
        )}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        {description}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        PNG, JPG or WEBP up to 5MB
      </p>
    </div>
  );
}
