"use client";

import { useState } from "react";

import type { CustomerNote } from "@/features/customers";

type CustomerNotesProps = {
  notes: CustomerNote[];
  onAdd: (note: string) => void;
};

export function CustomerNotes({ notes, onAdd }: CustomerNotesProps) {
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
        Internal notes — visible only to salon staff.
      </div>

      <div className="flex gap-2">
        <input
          className="h-11 flex-1 rounded-xl border border-neutral-200 px-3.5 text-[14px] outline-none focus:border-neutral-400"
          placeholder="Add an internal note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="button"
          className="h-11 rounded-full bg-neutral-950 px-4 text-[13px] font-semibold text-white"
          onClick={() => {
            if (!draft.trim()) return;
            onAdd(draft.trim());
            setDraft("");
          }}
        >
          Add
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="text-[13px] text-neutral-500">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-2xl border border-neutral-200 bg-[#FAFBFC] px-4 py-3"
            >
              <p className="text-[13px] text-neutral-800">{note.note}</p>
              <p className="mt-1 text-[11px] text-neutral-400">
                {note.staffName ?? "Staff"} ·{" "}
                {new Date(note.createdAt).toLocaleString("en-AU")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
