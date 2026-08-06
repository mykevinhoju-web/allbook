"use client";

import { CalendarDays, MapPin, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { SERVICE_OPTIONS } from "./mock-salons";

const ACCENT = "#6B5CF6";

type SearchToolbarProps = {
  location: string;
  service: string;
  dateLabel: string;
  onLocationChange: (value: string) => void;
  onServiceChange: (value: string) => void;
  onDateClick: () => void;
  onSearch: () => void;
  className?: string;
};

export function SearchToolbar({
  location,
  service,
  dateLabel,
  onLocationChange,
  onServiceChange,
  onDateClick,
  onSearch,
  className,
}: SearchToolbarProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[#E8E6F2] bg-white p-2 shadow-[0_12px_40px_rgba(27,31,59,0.06)] sm:p-2.5",
        className,
      )}
    >
      <div className="grid gap-2 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
        <label className="flex min-h-12 items-center gap-2.5 rounded-2xl bg-[#FAFAFE] px-3.5 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6B5CF6]/25">
          <MapPin className="size-4 shrink-0 text-[#6B5CF6]" strokeWidth={2.2} />
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA0B4]">
              Location
            </span>
            <Input
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Suburb, city or postcode"
              className="h-7 border-0 bg-transparent px-0 text-sm font-medium text-[#1B1F3B] shadow-none focus-visible:ring-0 md:text-sm"
              aria-label="Search location"
            />
          </div>
        </label>

        <div className="flex min-h-12 items-center gap-2.5 rounded-2xl bg-[#FAFAFE] px-3.5 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6B5CF6]/25">
          <Search className="size-4 shrink-0 text-[#6B5CF6]" strokeWidth={2.2} />
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA0B4]">
              Service
            </span>
            <Select value={service} onValueChange={onServiceChange}>
              <SelectTrigger className="h-7 w-full border-0 bg-transparent px-0 text-sm font-medium text-[#1B1F3B] shadow-none focus-visible:ring-0 data-[size=default]:h-7">
                <SelectValue placeholder="All services" />
              </SelectTrigger>
              <SelectContent align="start" className="rounded-2xl">
                {SERVICE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <button
          type="button"
          onClick={onDateClick}
          className="flex min-h-12 items-center gap-2.5 rounded-2xl bg-[#FAFAFE] px-3.5 text-left transition hover:bg-white hover:ring-2 hover:ring-[#6B5CF6]/20"
        >
          <CalendarDays
            className="size-4 shrink-0 text-[#6B5CF6]"
            strokeWidth={2.2}
          />
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA0B4]">
              Date
            </span>
            <span className="block truncate text-sm font-medium text-[#1B1F3B]">
              {dateLabel}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onSearch}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(107,92,246,0.35)] transition hover:opacity-95 hover:shadow-[0_14px_28px_rgba(107,92,246,0.42)] active:scale-[0.98] lg:min-w-[120px]"
          style={{ backgroundColor: ACCENT }}
        >
          <Search className="size-4" strokeWidth={2.4} />
          Search
        </button>
      </div>
    </div>
  );
}
