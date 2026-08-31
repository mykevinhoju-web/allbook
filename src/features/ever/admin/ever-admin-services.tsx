"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { formatPriceFromCents } from "@/features/services";

import type { EverService } from "../types";

type EditableService = {
  id?: string;
  name: string;
  durationMinutes: string;
  price: string;
  isActive: boolean;
};

function toEditable(service: EverService): EditableService {
  return {
    id: service.id,
    name: service.name,
    durationMinutes: String(service.durationMinutes),
    price:
      service.priceCents === null
        ? ""
        : String((service.priceCents / 100).toFixed(0)),
    isActive: service.isActive,
  };
}

function emptyRow(): EditableService {
  return {
    name: "",
    durationMinutes: "60",
    price: "",
    isActive: true,
  };
}

export function EverAdminServicesContent() {
  const [rows, setRows] = useState<EditableService[]>([emptyRow()]);
  const [currency, setCurrency] = useState("AUD");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminApi("/api/admin/ever/services");
      const data = (await response.json()) as {
        services?: EverService[];
        currency?: string;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 401) return;
        toast.error("Could not load services", {
          description: data.error ?? "Try again.",
        });
        return;
      }

      setCurrency(data.currency ?? "AUD");
      setRows(
        data.services?.length
          ? data.services.map(toEditable)
          : [emptyRow()],
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const services = rows
      .filter((row) => row.name.trim())
      .map((row, index) => ({
        id: row.id,
        name: row.name.trim(),
        durationMinutes: Number(row.durationMinutes),
        priceCents: row.price.trim()
          ? Math.round(Number(row.price) * 100)
          : null,
        sortOrder: index + 1,
        isActive: row.isActive,
      }));

    if (!services.length) {
      toast.error("Add at least one service.");
      return;
    }

    for (const service of services) {
      if (!service.durationMinutes || service.durationMinutes <= 0) {
        toast.error("Each service needs a valid duration.");
        return;
      }
      if (service.priceCents !== null && Number.isNaN(service.priceCents)) {
        toast.error("Enter a valid price or leave it blank.");
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetchAdminApi("/api/admin/ever/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error("Could not save services", {
          description: data.error ?? "Try again.",
        });
        return;
      }

      toast.success("Services saved");
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <AdminPageHeader
        title="Services"
        description="Treatments shown on the public booking form"
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading services…
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.id ?? `new-${index}`}
              className="grid gap-3 rounded-2xl border border-border/60 bg-card p-4 md:grid-cols-[1fr_100px_100px_auto_auto]"
            >
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Name</span>
                <Input
                  value={row.name}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="Relaxation Massage"
                  className="rounded-xl"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Minutes</span>
                <Input
                  type="number"
                  min={15}
                  step={15}
                  value={row.durationMinutes}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, durationMinutes: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className="rounded-xl"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Price ({currency})</span>
                <Input
                  type="number"
                  min={0}
                  step={5}
                  value={row.price}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, price: event.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="90"
                  className="rounded-xl"
                />
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.isActive}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, isActive: event.target.checked }
                          : item,
                      ),
                    )
                  }
                />
                <span className="text-muted-foreground">Active</span>
              </label>
              <div className="flex items-end justify-end pb-1">
                <AppButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove service"
                  disabled={rows.length <= 1}
                  onClick={() =>
                    setRows((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </AppButton>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <AppButton
              type="button"
              variant="outline"
              onClick={() => setRows((current) => [...current, emptyRow()])}
            >
              <Plus className="size-4" />
              Add service
            </AppButton>
            <AppButton
              type="button"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : "Save services"}
            </AppButton>
          </div>

          <p className="text-xs text-muted-foreground">
            Prices are optional and shown on the booking form as{" "}
            {formatPriceFromCents(9000, currency)} style amounts.
          </p>
        </div>
      )}
    </div>
  );
}
