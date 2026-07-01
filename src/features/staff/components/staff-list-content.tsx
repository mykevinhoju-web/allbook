"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

import { mockStaffList, staffFilterOptions } from "../config";
import type { StaffFilterStatus } from "../types";
import { StaffTable } from "./staff-table";

export function StaffListContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffFilterStatus>("all");

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    return mockStaffList.filter((member) => {
      const matchesSearch =
        query.length === 0 || member.name.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Staff
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage team members, schedules, and availability.
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

      <StaffTable staff={filteredStaff} />
    </div>
  );
}
