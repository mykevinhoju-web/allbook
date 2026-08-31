"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, StickyNote, Trash2 } from "lucide-react";

import { AppButton, ConfirmDialog, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import { useOptionalTenant } from "@/features/tenants";
import { todayDateInZone } from "@/features/booking/lib/schedule-utils";
import { cn } from "@/lib/utils";

type StaffOption = { id: string; name: string };

type StaffNote = {
  id: string;
  staffId: string;
  staffName: string;
  noteDate: string;
  body: string;
  createdAt: string;
};

function formatNoteDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function formatPostedAt(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function NotesContent() {
  const tenant = useOptionalTenant();
  const timeZone = tenant?.settings.timezone || "Australia/Sydney";
  const today = todayDateInZone(timeZone);

  const [notes, setNotes] = useState<StaffNote[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [noteDate, setNoteDate] = useState(today);
  const [staffId, setStaffId] = useState("");
  const [body, setBody] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetchAdminApi("/api/admin/notes");
    const data = (await response.json()) as {
      notes?: StaffNote[];
      staff?: StaffOption[];
      error?: string;
    };

    if (!response.ok) {
      if (response.status === 401) return;
      toast.error("Could not load notes", { description: data.error });
      return;
    }

    setNotes(data.notes ?? []);
    setStaff(data.staff ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  useEffect(() => {
    setNoteDate(today);
  }, [today]);

  const submit = async () => {
    if (!staffId) {
      toast.error("Select staff");
      return;
    }
    if (!body.trim()) {
      toast.error("Enter a note");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetchAdminApi("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          noteDate,
          body: body.trim(),
        }),
      });

      const data = (await response.json()) as {
        note?: StaffNote;
        error?: string;
      };

      if (!response.ok || !data.note) {
        toast.error("Could not save note", { description: data.error });
        return;
      }

      setBody("");
      setNotes((current) => [data.note!, ...current]);
      toast.success("Note posted");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteNote = async () => {
    if (!deleteId) return;

    const response = await fetchAdminApi(`/api/admin/notes/${deleteId}`, {
      method: "DELETE",
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      toast.error("Could not delete note", { description: data.error });
      return;
    }

    setNotes((current) => current.filter((note) => note.id !== deleteId));
    setDeleteId(null);
    toast.success("Note deleted");
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 sm:px-4 lg:p-6">
      <AdminPageHeader
        title="Note"
        description="Post notes by date and staff. Newest entries appear first."
      />

      <section className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <StickyNote className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Write a note</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Date</span>
            <Input
              type="date"
              value={noteDate}
              onChange={(event) => setNoteDate(event.target.value)}
              className="h-11 rounded-xl"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Staff</span>
            <select
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">Select staff</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-3 block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Note</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={4}
            placeholder="Write your note…"
            className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <div className="mt-3 flex justify-end">
          <AppButton
            type="button"
            disabled={submitting || !staffId || !body.trim()}
            onClick={() => void submit()}
          >
            {submitting ? "Posting…" : "Post note"}
          </AppButton>
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft">
        <p className="mb-3 text-sm font-semibold">Board</p>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
            No notes yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-xl border border-border/50 bg-background px-4 py-3"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{note.staffName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNoteDate(note.noteDate)} · Posted {formatPostedAt(note.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteId(note.id)}
                    className={cn(
                      "shrink-0 rounded-lg p-2 text-muted-foreground transition",
                      "hover:bg-destructive/10 hover:text-destructive",
                    )}
                    aria-label="Delete note"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {note.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete this note?"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void deleteNote()}
      />
    </div>
  );
}
