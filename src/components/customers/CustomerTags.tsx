"use client";

import { CUSTOMER_TAGS, type CustomerTag } from "@/features/customers";
import { cn } from "@/lib/utils";

type CustomerTagsProps = {
  value: CustomerTag[];
  onChange: (tags: CustomerTag[]) => void;
};

export function CustomerTags({ value, onChange }: CustomerTagsProps) {
  function toggle(tag: CustomerTag) {
    onChange(
      value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CUSTOMER_TAGS.map((tag) => {
        const active = value.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
              active
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
            )}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
