"use client";

import type { BusinessSocialLinks } from "@/features/business";

type SocialLinksProps = {
  value: BusinessSocialLinks;
  onChange: (next: BusinessSocialLinks) => void;
};

export function SocialLinks({ value, onChange }: SocialLinksProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-1">
      {(
        [
          ["instagram", "Instagram", "https://instagram.com/…"],
          ["facebook", "Facebook", "https://facebook.com/…"],
          ["tiktok", "TikTok", "https://tiktok.com/@…"],
        ] as const
      ).map(([key, label, placeholder]) => (
        <label key={key} className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-neutral-500">
            {label}
          </span>
          <input
            type="url"
            value={value[key]}
            placeholder={placeholder}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
          />
        </label>
      ))}
    </div>
  );
}
