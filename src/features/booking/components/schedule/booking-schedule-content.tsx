"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, LayoutGrid, List, Plus } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPriceFromCents } from "@/features/services";
import type { ServiceOption } from "@/features/services";
import {
  DEFAULT_PRICING_ADJUSTMENTS,
  type PricingAdjustments,
} from "@/features/services/lib/pricing-adjustments";
import { useTenant } from "@/features/tenants";
import type { StaffRecord } from "@/features/staff/types";
import {
  isStaffWorkingOnDate,
  parseDaySchedule,
} from "@/features/staff/utils/day-schedule";
import { parseShiftPlan } from "@/features/staff/utils/shift-plan";
import {
  getStaffShiftLabelForDate,
  isStaffBookableOnDate,
} from "@/features/staff/utils/shift-label";
import { cn } from "@/lib/utils";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";

import {
  adminBookingSheetBodyClassName,
  adminBookingSheetClassName,
  adminBookingSheetHandleClassName,
  adminBookingSheetScrollClassName,
} from "../../lib/admin-booking-sheet";

import { useBookingRealtime } from "../../lib/booking-schedule-realtime";
import { useBookingAlerts } from "../../context/booking-alert-provider";
import { useAdminAvailabilitySlots } from "../../hooks/use-admin-availability-slots";
import {
  getRoomAvailabilityAtTime,
  pickFirstAvailableRoom,
  toRoomSlotBookings,
} from "../../lib/room-availability";
import {
  resolveBookingStartsAt,
  formatScheduleDate,
  isValidServiceDuration,
  todayDateInZone,
} from "../../lib/schedule-utils";
import { filterActiveRoomBookings } from "../../lib/room-occupancy";
import { useNowTick } from "@/hooks/use-now-tick";
import { computeScheduleGridWindow } from "../../lib/schedule-grid-utils";
import type { AdminBooking } from "../../types/admin-booking";
import {
  BookingFormSheet,
  defaultBookingFormValues,
  type BookingFormValues,
} from "./booking-form-sheet";
import { StaffScheduleColumn } from "./staff-schedule-column";
import { StaffScheduleDetail } from "./staff-schedule-detail";
import { StaffBookingTimeline } from "./staff-booking-timeline";
import { BookingDetailSheet } from "./booking-detail-sheet";

export function BookingScheduleContent() {
  const tenant = useTenant();
  const searchParams = useSearchParams();
  const { notifyBooking } = useBookingAlerts();
  const now = useNowTick(60_000);
  const today = todayDateInZone(tenant.settings.timezone, now);
  const [date, setDate] = useState(() =>
    todayDateInZone(tenant.settings.timezone),
  );
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [pricingAdjustments, setPricingAdjustments] =
    useState<PricingAdjustments>(DEFAULT_PRICING_ADJUSTMENTS);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<BookingFormValues>(defaultBookingFormValues);
  const prefillsApplied = useRef(false);
  const [currentUser, setCurrentUser] = useState<{
    role: "admin" | "staff";
    staffId?: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(
    null,
  );

  const loadSchedule = useCallback(async () => {
    try {
      const timeZone = tenant.settings.timezone;
      const now = new Date();

      const staffResponse = await fetchAdminApi("/api/admin/staff");
      const staffData = (await staffResponse.json()) as { staff?: StaffRecord[] };
      const staffMembers = staffData.staff ?? [];
      setStaff(staffMembers);

      const gridWindow = computeScheduleGridWindow(
        staffMembers,
        date,
        timeZone,
        now,
      );

      const bookingsUrl = gridWindow
        ? `/api/admin/bookings?from=${encodeURIComponent(
            new Date(gridWindow.startMs).toISOString(),
          )}&to=${encodeURIComponent(
            new Date(gridWindow.endMs).toISOString(),
          )}`
        : `/api/admin/bookings?date=${date}`;

      const [bookingsResponse, optionsResponse, roomsResponse] =
        await Promise.all([
          fetchAdminApi(bookingsUrl),
          fetchAdminApi("/api/admin/service-options"),
          fetchAdminApi("/api/admin/rooms"),
        ]);

      const bookingsData = (await bookingsResponse.json()) as {
        bookings?: AdminBooking[];
      };
      const optionsData = (await optionsResponse.json()) as {
        options?: ServiceOption[];
        pricingAdjustments?: PricingAdjustments;
      };
      const roomsData = (await roomsResponse.json()) as {
        rooms?: { id: string; name: string; isActive?: boolean }[];
      };

      setBookings(bookingsData.bookings ?? []);
      setServiceOptions(optionsData.options ?? []);
      if (optionsData.pricingAdjustments) {
        setPricingAdjustments(optionsData.pricingAdjustments);
      }
      setRooms(
        (roomsData.rooms ?? [])
          .filter((room) => room.isActive !== false)
          .map((room) => ({ id: room.id, name: room.name })),
      );
    } catch {
      toast.error("Could not load schedule");
    }
  }, [date, tenant.settings.timezone]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    void (async () => {
      const response = await fetchAdminApi("/api/admin/auth/me");
      const data = (await response.json()) as {
        user?: { role: "admin" | "staff"; staffId?: string } | null;
      };
      setCurrentUser(data.user ?? null);
    })();
  }, []);

  useBookingRealtime(tenant.id, loadSchedule);

  const visibleBookings = useMemo(
    () => filterActiveRoomBookings(bookings, now),
    [bookings, now],
  );

  const setScheduleDate = (next: string) => {
    setDate(next < today ? today : next);
  };

  const allowedDurations = useMemo(
    () => serviceOptions.map((option) => option.durationMinutes),
    [serviceOptions],
  );

  const defaultDuration =
    serviceOptions[0]?.durationMinutes != null
      ? String(serviceOptions[0].durationMinutes)
      : "";

  const workingStaff = useMemo(
    () =>
      staff.filter(
        (member) =>
          member.status === "active" &&
          isStaffWorkingOnDate(
            member.status,
            parseDaySchedule(member.attributes.daySchedule),
            date,
            parseShiftPlan(member.attributes.shiftPlan),
            tenant.settings.timezone,
          ),
      ),
    [staff, date, tenant.settings.timezone],
  );

  const bookableStaff = useMemo(
    () =>
      workingStaff.filter((member) =>
        isStaffBookableOnDate({
          status: member.status,
          attributes: member.attributes,
          date,
          timeZone: tenant.settings.timezone,
          workingHoursStart: member.workingHoursStart,
          workingHoursEnd: member.workingHoursEnd,
        }),
      ),
    [workingStaff, date, tenant.settings.timezone],
  );

  useEffect(() => {
    if (prefillsApplied.current || serviceOptions.length === 0) return;

    const staffId = searchParams.get("staffId");
    const roomId = searchParams.get("roomId");
    if (!staffId && !roomId) return;

    prefillsApplied.current = true;
    if (staffId) setSelectedStaffId(staffId);
    setForm({
      ...defaultBookingFormValues,
      staffId: staffId ?? "",
      roomId: roomId ?? "",
      durationMinutes:
        serviceOptions[0]?.durationMinutes != null
          ? String(serviceOptions[0].durationMinutes)
          : "",
    });
    setShowCreate(true);
  }, [searchParams, serviceOptions]);

  const selectedStaff =
    workingStaff.find((member) => member.id === selectedStaffId) ??
    staff.find((member) => member.id === selectedStaffId) ??
    null;

  const allRoomBookings = useMemo(
    () => toRoomSlotBookings(bookings),
    [bookings],
  );

  const selectedRoomBookings = useMemo(
    () =>
      allRoomBookings
        .filter((booking) => booking.roomId === form.roomId)
        .map((booking) => ({
          startsAt: booking.startsAt,
          endsAt: booking.endsAt,
        })),
    [allRoomBookings, form.roomId],
  );

  const { timeSlotOptions, timeSlotsLoading, timeSlotsHint } =
    useAdminAvailabilitySlots({
      staffId: form.staffId,
      durationMinutes: form.durationMinutes,
      date,
      timeZone: tenant.settings.timezone,
      roomId: form.roomId || undefined,
      roomBookings: selectedRoomBookings,
      rooms,
      allRoomBookings,
    });

  const resolvedStartsAt = useMemo(() => {
    if (!form.startsAt) return null;
    try {
      return resolveBookingStartsAt(
        date,
        form.startsAt,
        tenant.settings.timezone,
      );
    } catch {
      return null;
    }
  }, [date, form.startsAt, tenant.settings.timezone]);

  const roomStatuses = useMemo(() => {
    if (!resolvedStartsAt || !form.durationMinutes) return undefined;
    return getRoomAvailabilityAtTime(
      rooms,
      resolvedStartsAt,
      Number(form.durationMinutes),
      allRoomBookings,
    );
  }, [resolvedStartsAt, form.durationMinutes, rooms, allRoomBookings]);

  const suggestedAutoRoomName = useMemo(() => {
    if (!resolvedStartsAt || !form.durationMinutes || form.roomId) return null;
    const startMs = new Date(resolvedStartsAt).getTime();
    const endMs = startMs + Number(form.durationMinutes) * 60_000;
    return pickFirstAvailableRoom(rooms, startMs, endMs, allRoomBookings)?.name ?? null;
  }, [
    resolvedStartsAt,
    form.durationMinutes,
    form.roomId,
    rooms,
    allRoomBookings,
  ]);

  const dateLabel = useMemo(
    () => formatScheduleDate(`${date}T12:00:00`),
    [date],
  );

  const openCreateForm = (partial?: Partial<BookingFormValues>) => {
    const requestedStaffId = partial?.staffId ?? selectedStaffId ?? "";
    const staffId =
      requestedStaffId &&
      bookableStaff.some((member) => member.id === requestedStaffId)
        ? requestedStaffId
        : "";

    setForm({
      ...defaultBookingFormValues,
      staffId,
      startsAt: partial?.startsAt ?? "",
      durationMinutes: partial?.durationMinutes ?? defaultDuration,
      roomId: partial?.roomId ?? "",
      customerName: "",
      customerPhone: "",
      customerPostcode: "",
      customerEmail: "",
    });
    setShowCreate(true);
  };

  const createBooking = async () => {
    if (!form.staffId || !form.startsAt || !form.durationMinutes) {
      toast.error("Staff, start time, and service are required");
      return;
    }

    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast.error("Customer name and phone are required");
      return;
    }

    setSubmitting(true);

    try {
      const durationMinutes = Number(form.durationMinutes);

      if (!isValidServiceDuration(durationMinutes, allowedDurations)) {
        toast.error("Select a valid service duration");
        return;
      }

      const response = await fetchAdminApi("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: form.staffId,
          startsAt: resolveBookingStartsAt(
            date,
            form.startsAt,
            tenant.settings.timezone,
          ),
          durationMinutes,
          roomId: form.roomId || undefined,
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          customerPostcode: form.customerPostcode.trim() || undefined,
          customerEmail: form.customerEmail.trim() || undefined,
        }),
      });

      const data = (await response.json()) as {
        booking?: AdminBooking;
        error?: string;
      };

      if (!response.ok) {
        toast.error("Could not create booking", { description: data.error });
        return;
      }

      const priceLabel = data.booking?.priceCents
        ? formatPriceFromCents(
            data.booking.priceCents,
            tenant.settings.currency,
          )
        : null;

      toast.success("Booking created", {
        description: [priceLabel, data.booking?.roomName]
          .filter(Boolean)
          .join(" · "),
      });

      if (data.booking?.staffName) {
        notifyBooking(data.booking.staffName);
      }

      setShowCreate(false);
      setForm(defaultBookingFormValues);
      void loadSchedule();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-14 z-10 border-b border-border/40 bg-background px-3 py-3 sm:px-4">
        {/* Mobile: stacked so Book never clips */}
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 sm:hidden">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold tracking-tight">
                {dateLabel}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {workingStaff.length} staff working
              </p>
            </div>
            <div className="flex shrink-0 rounded-xl border border-border/60 bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg transition",
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg transition",
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
                aria-label="List view"
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              min={today}
              onChange={(event) => setScheduleDate(event.target.value)}
              className="h-11 min-w-0 flex-1 rounded-xl text-sm"
            />
            <AppButton
              type="button"
              className="h-11 shrink-0 rounded-xl px-3"
              onClick={() => openCreateForm()}
              disabled={serviceOptions.length === 0}
            >
              <Plus className="size-4" />
              Book
            </AppButton>
          </div>
        </div>

        {/* Desktop / tablet: single row */}
        <div className="mx-auto hidden w-full max-w-6xl items-center gap-2 sm:flex">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold tracking-tight">
              {dateLabel}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {workingStaff.length} staff working
            </p>
          </div>
          <div className="flex shrink-0 rounded-xl border border-border/60 bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg transition",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg transition",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
              aria-label="List view"
            >
              <List className="size-4" />
            </button>
          </div>
          <Input
            type="date"
            value={date}
            min={today}
            onChange={(event) => setScheduleDate(event.target.value)}
            className="h-11 w-[9.5rem] shrink-0 rounded-xl text-sm"
          />
          <AppButton
            type="button"
            className="h-11 shrink-0 rounded-xl px-4"
            onClick={() => openCreateForm()}
            disabled={serviceOptions.length === 0}
          >
            <Plus className="size-4" />
            Book
          </AppButton>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5">
        {serviceOptions.length === 0 ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
            No service pricing yet.{" "}
            <Link href="/admin/services" className="font-medium text-primary underline">
              Add durations and prices
            </Link>{" "}
            before creating bookings.
          </div>
        ) : null}

        {workingStaff.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center">
            <CalendarDays className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="font-medium">No staff scheduled for this day</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add staff or update working days to see the schedule.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <StaffBookingTimeline
            date={date}
            staff={workingStaff}
            bookings={visibleBookings}
            timeZone={tenant.settings.timezone}
            onStaffSelect={setSelectedStaffId}
            onSlotSelect={(staffId, startsAt) => {
              openCreateForm({
                staffId,
                startsAt,
                durationMinutes: defaultDuration,
              });
            }}
            onBookingSelect={(booking) => {
              setSelectedBooking(booking);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {workingStaff.map((member) => (
              <StaffScheduleColumn
                key={member.id}
                name={member.name}
                photoUrl={member.photoUrl ?? member.photos[0]?.url}
                bookings={visibleBookings.filter(
                  (booking) => booking.staffId === member.id,
                )}
                currency={tenant.settings.currency}
                shiftLabel={getStaffShiftLabelForDate(
                  member.attributes,
                  date,
                  tenant.settings.timezone,
                  member.workingHoursStart,
                  member.workingHoursEnd,
                )}
                selected={selectedStaffId === member.id}
                onSelect={() => setSelectedStaffId(member.id)}
              />
            ))}
          </div>
        )}

        <p className="pb-2 text-center text-xs text-muted-foreground">
          {viewMode === "grid"
            ? "Timeline view · tap a dot for details · tap staff for schedule"
            : "Tap a staff member to view times and create a booking."}
        </p>
      </div>

      <BookingDetailSheet
        booking={selectedBooking}
        open={selectedBooking !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(null);
        }}
        currency={tenant.settings.currency}
        rooms={rooms}
        dayBookings={bookings}
        onCheckedOut={() => void loadSchedule()}
        onRoomChanged={(updated) => {
          setSelectedBooking(updated);
          void loadSchedule();
        }}
        onCancelled={() => void loadSchedule()}
      />

      <Sheet
        open={selectedStaffId !== null}
        onOpenChange={(open) => !open && setSelectedStaffId(null)}
      >
        <SheetContent side="bottom" showCloseButton className={adminBookingSheetClassName}>
          <div className={adminBookingSheetBodyClassName}>
            <div className={adminBookingSheetHandleClassName} />
            <SheetHeader className="sr-only">
              <SheetTitle>Staff schedule</SheetTitle>
            </SheetHeader>
            <div className={adminBookingSheetScrollClassName}>
              {selectedStaff ? (
                <StaffScheduleDetail
              staff={selectedStaff}
              date={date}
              bookings={visibleBookings.filter(
                (booking) => booking.staffId === selectedStaff.id,
              )}
              serviceOptions={serviceOptions}
              currency={tenant.settings.currency}
              currentStaffId={currentUser?.staffId ?? null}
              onAddBooking={(startsAt, durationMinutes) => {
                setSelectedStaffId(null);
                openCreateForm({
                  staffId: selectedStaff.id,
                  startsAt,
                  durationMinutes: String(durationMinutes),
                });
              }}
              onCheckedOut={() => {
                void loadSchedule();
              }}
                />
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <BookingFormSheet
        open={showCreate}
        onOpenChange={setShowCreate}
        date={date}
        onDateChange={setDate}
        timeZone={tenant.settings.timezone}
        staffOptions={(bookableStaff.length > 0 ? bookableStaff : workingStaff).map(
          (member) => ({ id: member.id, name: member.name }),
        )}
        roomOptions={rooms}
        serviceOptions={serviceOptions}
        pricingAdjustments={pricingAdjustments}
        currency={tenant.settings.currency}
        timeSlotOptions={timeSlotOptions}
        timeSlotsLoading={timeSlotsLoading}
        timeSlotsHint={timeSlotsHint}
        roomStatuses={roomStatuses}
        suggestedAutoRoomName={suggestedAutoRoomName}
        values={form}
        onChange={setForm}
        onSubmit={() => void createBooking()}
        submitting={submitting}
      />
    </div>
  );
}
