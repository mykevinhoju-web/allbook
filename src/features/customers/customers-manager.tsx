"use client";

import { Download, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CustomerProfile, CustomerTable } from "@/components/customers";
import {
  CUSTOMER_STATUSES,
  CUSTOMER_TAGS,
  addCustomerNote,
  blockCustomer,
  createCustomer,
  exportCustomersToCsv,
  setCustomerTags,
  updateCustomer,
  type CustomerStatus,
  type CustomerTag,
  type SalonCustomer,
} from "@/features/customers";

type CustomersManagerProps = {
  salonId: string;
  initialCustomers: SalonCustomer[];
};

export function CustomersManager({
  salonId,
  initialCustomers,
}: CustomersManagerProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "all">("all");
  const [tag, setTag] = useState<CustomerTag | "all">("all");
  const [sort, setSort] = useState<
    "name" | "last_visit" | "total_spent" | "joined"
  >("name");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCustomers[0]?.id ?? null,
  );
  const [editing, setEditing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = customers.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (tag !== "all" && !c.tags.includes(tag)) return false;
      if (!q) return true;
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
      );
    });

    rows = [...rows].sort((a, b) => {
      if (sort === "last_visit") {
        return (b.statistics.lastVisit ?? "").localeCompare(
          a.statistics.lastVisit ?? "",
        );
      }
      if (sort === "total_spent") {
        return b.statistics.totalSpent - a.statistics.totalSpent;
      }
      if (sort === "joined") return b.joinedAt.localeCompare(a.joinedAt);
      return a.fullName.localeCompare(b.fullName);
    });
    return rows;
  }, [customers, search, status, tag, sort]);

  const selected =
    filtered.find((c) => c.id === selectedId) ??
    customers.find((c) => c.id === selectedId) ??
    null;

  function replaceCustomer(next: SalonCustomer) {
    setCustomers((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  }

  function exportAll() {
    const csv = exportCustomersToCsv(
      filtered.map((c) => ({
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        status: c.status,
        totalVisits: c.statistics.completedBookings,
        totalSpent: c.statistics.totalSpent,
        lastVisit: c.statistics.lastVisit,
        nextBooking: c.statistics.nextBooking,
        tags: c.tags,
      })),
    );
    downloadCsv(csv, "salon-customers.csv");
  }

  function exportOne(customer: SalonCustomer) {
    const csv = exportCustomersToCsv([
      {
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        status: customer.status,
        totalVisits: customer.statistics.completedBookings,
        totalSpent: customer.statistics.totalSpent,
        lastVisit: customer.statistics.lastVisit,
        nextBooking: customer.statistics.nextBooking,
        tags: customer.tags,
      },
    ]);
    downloadCsv(
      csv,
      `${customer.fullName.replace(/\s+/g, "-").toLowerCase()}.csv`,
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            CRM
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
            Customers
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Profiles, history, and notes — updated automatically from bookings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportAll}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-[13px] font-semibold text-neutral-800"
          >
            <Download className="size-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white"
          >
            <Plus className="size-4" />
            Add customer
          </button>
        </div>
      </div>

      <div className="space-y-3 rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, or email…"
              className="h-11 w-full rounded-full border border-neutral-200 bg-[#FAFBFC] pl-10 pr-4 text-[14px] outline-none focus:border-neutral-300 focus:bg-white"
            />
          </label>
          <select
            className="h-11 rounded-full border border-neutral-200 bg-white px-4 text-[13px] font-medium"
            value={status}
            onChange={(e) => setStatus(e.target.value as CustomerStatus | "all")}
          >
            <option value="all">All statuses</option>
            {CUSTOMER_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-full border border-neutral-200 bg-white px-4 text-[13px] font-medium"
            value={tag}
            onChange={(e) => setTag(e.target.value as CustomerTag | "all")}
          >
            <option value="all">All tags</option>
            {CUSTOMER_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-full border border-neutral-200 bg-white px-4 text-[13px] font-medium"
            value={sort}
            onChange={(e) =>
              setSort(
                e.target.value as
                  | "name"
                  | "last_visit"
                  | "total_spent"
                  | "joined",
              )
            }
          >
            <option value="name">Sort: Name</option>
            <option value="last_visit">Sort: Last visit</option>
            <option value="total_spent">Sort: Revenue</option>
            <option value="joined">Sort: Joined</option>
          </select>
          <p className="text-[13px] text-neutral-500">
            {filtered.length} customers
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.95fr)]">
        <CustomerTable
          customers={filtered}
          selectedId={selectedId}
          onSelect={(c) => {
            setSelectedId(c.id);
            setEditing(false);
          }}
        />

        {selected ? (
          editing ? (
            <CustomerEditForm
              customer={selected}
              onCancel={() => setEditing(false)}
              onSave={async (patch) => {
                const next = await updateCustomer(selected, patch);
                replaceCustomer(next);
                setEditing(false);
              }}
            />
          ) : (
            <CustomerProfile
              customer={selected}
              onAddNote={async (note) => {
                const next = await addCustomerNote(selected, note, {
                  id: "staff_owner",
                  name: "Owner",
                });
                replaceCustomer(next);
              }}
              onTagsChange={async (tags) => {
                const next = await setCustomerTags(selected, tags);
                replaceCustomer(next);
              }}
              onEdit={() => setEditing(true)}
              onBlock={async () => {
                if (!window.confirm(`Block ${selected.fullName}?`)) return;
                const next = await blockCustomer(selected);
                replaceCustomer(next);
              }}
              onCreateBooking={() => router.push("/platform/salon/bookings")}
              onExport={() => exportOne(selected)}
            />
          )
        ) : (
          <div className="rounded-[24px] border border-dashed border-neutral-300 bg-white px-5 py-16 text-center text-[14px] text-neutral-500">
            Select a customer to view their profile.
          </div>
        )}
      </div>

      {createOpen ? (
        <CustomerCreateDialog
          onClose={() => setCreateOpen(false)}
          onCreate={async (input) => {
            const created = await createCustomer(salonId, input);
            setCustomers((prev) => [created, ...prev]);
            setSelectedId(created.id);
            setCreateOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CustomerEditForm({
  customer,
  onCancel,
  onSave,
}: {
  customer: SalonCustomer;
  onCancel: () => void;
  onSave: (patch: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    status: CustomerStatus;
  }) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(customer.firstName);
  const [lastName, setLastName] = useState(customer.lastName);
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email);
  const [status, setStatus] = useState(customer.status);

  return (
    <form
      className="space-y-4 rounded-[24px] border border-neutral-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave({ firstName, lastName, phone, email, status });
      }}
    >
      <h2 className="text-[18px] font-semibold">Edit customer</h2>
      <Field label="First name" value={firstName} onChange={setFirstName} />
      <Field label="Last name" value={lastName} onChange={setLastName} />
      <Field label="Phone" value={phone} onChange={setPhone} />
      <Field label="Email" value={email} onChange={setEmail} />
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium">Status</span>
        <select
          className="h-11 w-full rounded-xl border border-neutral-200 px-3"
          value={status}
          onChange={(e) => setStatus(e.target.value as CustomerStatus)}
        >
          {CUSTOMER_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-full border border-neutral-200 px-4 text-[13px] font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="h-11 rounded-full bg-neutral-950 px-4 text-[13px] font-semibold text-white"
        >
          Save
        </button>
      </div>
    </form>
  );
}

function CustomerCreateDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  }) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <form
        className="w-full max-w-md space-y-4 rounded-[24px] bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void onCreate({ firstName, lastName, phone, email });
        }}
      >
        <h2 className="text-[18px] font-semibold">Add customer</h2>
        <Field label="First name *" value={firstName} onChange={setFirstName} />
        <Field label="Last name *" value={lastName} onChange={setLastName} />
        <Field label="Phone" value={phone} onChange={setPhone} />
        <Field label="Email" value={email} onChange={setEmail} />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-full border px-4 text-[13px] font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-11 rounded-full bg-neutral-950 px-4 text-[13px] font-semibold text-white"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      <input
        className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-[14px] outline-none focus:border-neutral-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
