"use client";

import { STAFF_LANGUAGE_OPTIONS } from "@/features/salon-staff";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-[14px] outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-950/5";

type ProfileEditorProps = {
  bio: string;
  instagram: string;
  languages: string[];
  certificates: string[];
  portfolioImages: string[];
  specialties: string[];
  onChange: (patch: {
    bio?: string;
    instagram?: string;
    languages?: string[];
    certificates?: string[];
    portfolioImages?: string[];
    specialties?: string[];
  }) => void;
  className?: string;
};

export function ProfileEditor({
  bio,
  instagram,
  languages,
  certificates,
  portfolioImages,
  specialties,
  onChange,
  className,
}: ProfileEditorProps) {
  function toggleLanguage(lang: string) {
    onChange({
      languages: languages.includes(lang)
        ? languages.filter((l) => l !== lang)
        : [...languages, lang],
    });
  }

  return (
    <div className={cn("space-y-4", className)}>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Biography
        </span>
        <textarea
          rows={4}
          className={cn(fieldClass, "h-auto py-2.5")}
          value={bio}
          onChange={(e) => onChange({ bio: e.target.value })}
          placeholder="Tell guests about this stylist…"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Instagram
        </span>
        <input
          className={fieldClass}
          value={instagram}
          onChange={(e) => onChange({ instagram: e.target.value })}
          placeholder="@username"
        />
      </label>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-neutral-700">
          Languages
        </p>
        <div className="flex flex-wrap gap-2">
          {STAFF_LANGUAGE_OPTIONS.map((lang) => {
            const active = languages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                  active
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-600",
                )}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Specialties
        </span>
        <input
          className={fieldClass}
          value={specialties.join(", ")}
          onChange={(e) =>
            onChange({
              specialties: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="Cuts, Colour, Balayage"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Certificates
        </span>
        <input
          className={fieldClass}
          value={certificates.join(", ")}
          onChange={(e) =>
            onChange({
              certificates: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="Comma-separated"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Portfolio image URLs
        </span>
        <textarea
          rows={3}
          className={cn(fieldClass, "h-auto py-2.5")}
          value={portfolioImages.join("\n")}
          onChange={(e) =>
            onChange({
              portfolioImages: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="One image URL per line"
        />
      </label>
    </div>
  );
}
