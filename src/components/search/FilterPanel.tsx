"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import {
  SEARCH_DISTANCE_KM,
  SEARCH_MIN_RATING_OPTIONS,
  type SearchDistanceKm,
} from "@/features/search/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterPanelValues = {
  minRating: number | null;
  verifiedOnly: boolean;
  openNow: boolean;
  parkingOnly: boolean;
  wifiOnly: boolean;
  kidsOnly: boolean;
  keyword: string;
};

type FilterPanelProps = {
  values: FilterPanelValues;
  onChange: (next: Partial<FilterPanelValues>) => void;
  /** Distance filter around the (top-bar) search origin */
  radiusKm?: SearchDistanceKm;
  onRadiusChange?: (radiusKm: SearchDistanceKm) => void;
  className?: string;
};

/**
 * Result refinements only — location lives in the top SearchBar.
 * Distance · Rating · Verified · Open now · Amenities · Keywords
 */
export function FilterPanel({
  values,
  onChange,
  radiusKm,
  onRadiusChange,
  className,
}: FilterPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className,
      )}
    >
      {onRadiusChange && radiusKm != null ? (
        <Select
          value={String(radiusKm)}
          onValueChange={(value) => {
            if (!value) return;
            onRadiusChange(Number(value) as SearchDistanceKm);
          }}
        >
          <SelectTrigger className="h-9 w-auto min-w-[118px] rounded-full border-neutral-200 bg-neutral-50 px-3 text-[13px] font-medium">
            <SelectValue placeholder="Distance" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {SEARCH_DISTANCE_KM.map((km) => (
              <SelectItem key={km} value={String(km)}>
                Within {km} km
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Select
        value={String(values.minRating ?? 0)}
        onValueChange={(value) => {
          if (value == null) return;
          const n = Number(value);
          onChange({ minRating: n > 0 ? n : null });
        }}
      >
        <SelectTrigger className="h-9 w-auto min-w-[120px] rounded-full border-neutral-200 bg-neutral-50 px-3 text-[13px] font-medium">
          <SelectValue placeholder="Rating" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          {SEARCH_MIN_RATING_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <KeywordSearchField
        value={values.keyword}
        onCommit={(keyword) => onChange({ keyword })}
      />

      <ToggleChip
        active={values.verifiedOnly}
        onClick={() => onChange({ verifiedOnly: !values.verifiedOnly })}
      >
        Verified only
      </ToggleChip>

      <ToggleChip
        active={values.openNow}
        onClick={() => onChange({ openNow: !values.openNow })}
      >
        Open now
      </ToggleChip>

      <ToggleChip
        active={values.parkingOnly}
        onClick={() => onChange({ parkingOnly: !values.parkingOnly })}
      >
        Parking
      </ToggleChip>

      <ToggleChip
        active={values.wifiOnly}
        onClick={() => onChange({ wifiOnly: !values.wifiOnly })}
      >
        Wi‑Fi
      </ToggleChip>

      <ToggleChip
        active={values.kidsOnly}
        onClick={() => onChange({ kidsOnly: !values.kidsOnly })}
      >
        Kids
      </ToggleChip>

      <ToggleChip
        active={values.keyword.toLowerCase() === "korean"}
        onClick={() =>
          onChange({
            keyword: values.keyword.toLowerCase() === "korean" ? "" : "korean",
          })
        }
      >
        Korean
      </ToggleChip>
    </div>
  );
}

function KeywordSearchField({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (keyword: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const next = draft.trim().toLowerCase();
    if (next === value.trim().toLowerCase()) return;
    onCommit(next);
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => submit()}
        placeholder="Keyword…"
        aria-label="Search keyword"
        className="h-9 w-[132px] rounded-full border border-neutral-200 bg-neutral-50 px-3 text-[13px] font-medium text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 sm:w-[160px]"
      />
    </form>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-3 text-[13px] font-medium transition",
        active
          ? "border-neutral-950 bg-neutral-950 text-white"
          : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300",
      )}
    >
      {children}
    </button>
  );
}
