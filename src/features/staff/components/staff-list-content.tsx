"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Plus } from "lucide-react";

import { appButtonVariants, SearchBox } from "@/components/common";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatScheduleTime,
  isWorkingToday,
} from "@/features/booking/lib/schedule-utils";

import { mockStaffList, staffFilterOptions } from "../config";
import type { AdminStaffRow, StaffFilterStatus, StaffRecord } from "../types";
import { StaffTable } from "./staff-table";

interface BookingSummary {
  staffId: string;
  startsAt: string;
}

export function StaffListContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffFilterStatus>("all");
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [useMock, setUseMock] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const staffResponse = await fetch("/api/admin/staff");
      const staffData = (await staffResponse.json()) as {
        staff?: StaffRecord[];
        error?: string;
      };

      if (!staffResponse.ok || !staffData.staff) {
        setUseMock(true);
        setStaff([]);
        return;
      }

      setUseMock(false);
      setStaff(staffData.staff);

      const today = new Date().toISOString().slice(0, 10);
      const bookingsResponse = await fetch(`/api/admin/bookings?date=${today}`);
      const bookingsData = (await bookingsResponse.json()) as {
        bookings?: { staffId: string; startsAt: string }[];
      };

      setBookings(
        (bookingsData.bookings ?? []).map((booking) => ({
          staffId: booking.staffId,
          startsAt: booking.startsAt,
        })),
      );
    } catch {
      setUseMock(true);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const rows: AdminStaffRow[] = useMemo(() => {
    if (useMock) {
      return mockStaffList;
    }

    const now = Date.now();

    return staff.map((member) => {
      const upcoming = bookings
        .filter(
          (booking) =>
            booking.staffId === member.id &&
            new Date(booking.startsAt).getTime() >= now,
        )
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        )[0];

      return {
        id: member.id,
        name: member.name,
        photoUrl: member.photoUrl,
        status: member.status,
        workingToday:
          member.status === "active" && isWorkingToday(member.workingDays),
        nextBooking: upcoming
          ? `Today, ${formatScheduleTime(upcoming.startsAt)}`
          : null,
      };
    });
  }, [bookings, staff, useMock]);

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((member) => {
      const matchesSearch =
        query.length === 0 || member.name.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Staff
          </h1>
          <p className="text-sm text-muted-foreground">
            Register, edit, and remove team members. Photos and profile fields
            are tenant-scoped for future platform reuse.
          </p>
        </div>
        <Link
          href="/admin/staff/new"
          className={cn(appButtonVariants({ variant: "primary" }), "shrink-0")}
        >
          <Plus className="size-4" />
          Add Staff
        </Link>
      </div>

      {useMock ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Database tables are not ready yet. Run{" "}
          <code className="rounded bg-black/5 px-1">supabase/setup.sql</code>{" "}
          section 6 in Supabase SQL Editor. Showing sample data for now.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBox
          value={search}
          onValueChange={setSearch}
          placeholder="Search staff by name..."
          containerClassName="sm:max-w-sm"
          aria-label="Search staff"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StaffFilterStatus)}
        >
          <SelectTrigger className="h-10 w-full rounded-xl border-border/60 bg-background shadow-soft sm:w-44">
            <Filter className="size-4 text-muted-foreground" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent align="start">
            {staffFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <StaffTable
        staff={filteredStaff}
        onChanged={() => void loadData()}
      />
    </div>
  );
}
