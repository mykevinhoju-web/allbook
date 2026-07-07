"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Plus } from "lucide-react";

import { ConfirmDialog, SearchBox, toast } from "@/components/common";
import { appButtonVariants } from "@/components/common/app-button";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
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
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import {
  isStaffWorkingOnDate,
  parseDaySchedule,
} from "../utils/day-schedule";
import { parseShiftPlan } from "../utils/shift-plan";
import { useOptionalTenant } from "@/features/tenants";
import { mockStaffList, staffFilterOptions } from "../config";
import type { AdminStaffRow, StaffFilterStatus, StaffRecord } from "../types";
import { StaffTable } from "./staff-table";
import { StaffMobileList } from "./staff-mobile-list";

interface BookingSummary {
  staffId: string;
  startsAt: string;
}

export function StaffListContent() {
  const tenant = useOptionalTenant();
  const timeZone = tenant?.settings.timezone || "Australia/Sydney";
  const today = todayDateInZone(timeZone);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffFilterStatus>("all");
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [useMock, setUseMock] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/staff/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to delete staff.");
      }

      toast.success("Staff deleted");
      void loadData();
    } catch (error) {
      toast.error("Could not delete staff", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [staffResponse, bookingsResponse] = await Promise.all([
        fetch("/api/admin/staff"),
        fetch(`/api/admin/bookings?date=${today}`),
      ]);

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
        workingToday: isStaffWorkingOnDate(
          member.status,
          parseDaySchedule(member.attributes.daySchedule),
          today,
          parseShiftPlan(member.attributes.shiftPlan),
          timeZone,
        ),
        nextBooking: upcoming
          ? `Today, ${formatScheduleTime(upcoming.startsAt)}`
          : null,
      };
    });
  }, [bookings, staff, today, timeZone, useMock]);

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
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-3 py-4 sm:px-4 lg:gap-6 lg:p-6">
      <AdminPageHeader
        title="Staff"
        description="Register, edit, and remove team members."
        action={
          <Link
            href="/admin/staff/new"
            className={cn(appButtonVariants({ variant: "primary" }), "w-full rounded-xl sm:w-auto")}
          >
            <Plus className="size-4" />
            Add Staff
          </Link>
        }
      />

      {useMock ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Database tables are not ready yet. Run{" "}
          <code className="rounded bg-black/5 px-1">supabase/setup.sql</code>{" "}
          section 6 in Supabase SQL Editor. Showing sample data for now.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBox
          value={search}
          onValueChange={setSearch}
          placeholder="Search staff..."
          containerClassName="flex-1"
          aria-label="Search staff"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StaffFilterStatus)}
        >
          <SelectTrigger className="h-11 w-full rounded-xl border-border/60 bg-background shadow-soft sm:w-44">
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

      <StaffMobileList
        staff={filteredStaff}
        onDelete={(id) => setDeleteId(id)}
      />

      <div className="hidden lg:block">
        <StaffTable
          staff={filteredStaff}
          onChanged={() => void loadData()}
        />
      </div>

      {filteredStaff.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground lg:hidden">
          No staff found. Try another search or add a team member.
        </p>
      ) : null}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete staff member?"
        description="This removes the staff profile and photos. Existing bookings may need to be reassigned."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
