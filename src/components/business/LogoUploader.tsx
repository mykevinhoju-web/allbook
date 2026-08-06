"use client";

import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

type LogoUploaderProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  onUploadFile?: (file: File) => Promise<string>;
  className?: string;
};

export function LogoUploader({
  value,
  onChange,
  onUploadFile,
  className,
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (onUploadFile) {
      setBusy(true);
      try {
        const url = await onUploadFile(file);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setBusy(false);
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-4">
        <div className="relative size-20 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
          {value ? (
            <Image src={value} alt="" fill className="object-cover" sizes="80px" />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              <ImagePlus className="size-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-neutral-900">Logo</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center rounded-full bg-neutral-950 px-3 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Uploading…" : "Upload"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 px-3 text-[13px] font-medium text-neutral-600"
              >
                <Trash2 className="size-3.5" />
                Remove
              </button>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
          <input
            type="url"
            placeholder="Or paste image URL"
            value={value?.startsWith("http") ? value : ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-3 text-[13px] outline-none focus:border-neutral-400"
          />
        </div>
      </div>
      {error ? <p className="text-[13px] text-rose-600">{error}</p> : null}
    </div>
  );
}
