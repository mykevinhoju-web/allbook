"use client";

import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

type OwnerKeywordsEditorProps = {
  value: string[];
  limit: number;
  onChange: (next: string[]) => void;
};

/**
 * Chip-style keyword editor for salon owners (marketplace search).
 */
export function OwnerKeywordsEditor({
  value,
  limit,
  onChange,
}: OwnerKeywordsEditorProps) {
  const [draft, setDraft] = useState("");
  const remaining = Math.max(0, limit - value.length);
  const atLimit = remaining <= 0;

  function addToken(raw: string) {
    const token = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (!token || atLimit) return;
    if (value.includes(token)) {
      setDraft("");
      return;
    }
    onChange([...value, token].slice(0, limit));
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addToken(draft);
      return;
    }
    if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {value.map((keyword) => (
          <span
            key={keyword}
            className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[13px] font-medium text-neutral-800"
          >
            {keyword}
            <button
              type="button"
              aria-label={`Remove ${keyword}`}
              onClick={() => onChange(value.filter((k) => k !== keyword))}
              className="rounded-full p-0.5 text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-700"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        {value.length === 0 ? (
          <span className="text-[13px] text-neutral-400">
            No keywords yet — e.g. korean, balayage, kids
          </span>
        ) : null}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          disabled={atLimit}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) addToken(draft);
          }}
          placeholder={
            atLimit
              ? `Limit reached (${limit})`
              : "Type a keyword and press Enter"
          }
          className={cn(
            "h-11 flex-1 rounded-2xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-400",
          )}
        />
        <button
          type="button"
          disabled={atLimit || !draft.trim()}
          onClick={() => addToken(draft)}
          className="inline-flex h-11 items-center rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <p className="text-[12px] text-neutral-500">
        {value.length}/{limit} keywords · customers can find you with these on
        AllBook search
      </p>
    </div>
  );
}
