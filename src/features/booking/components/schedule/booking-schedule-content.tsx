"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toast } from "@/components/common";
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
  isStaffBookableOnDate,
} from "@/features/staff/utils/shift-label";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";

import { useBookingRealtime } from "../../lib/booking-schedule-realtime";
import { useBookingAlerts } from "../../context/booking-alert-provider";
import { useAdminAvailabilitySlots } from "../../hooks/use-admin-availability-slots";
import {
  ANY_GIRL_LABEL,
  ANY_GIRL_SENTINEL,
  OTHER_STAFF_SENTINEL,
  isOtherStaffGuestAttributes,
} from "../../lib/booking-other-staff";
import {
  getRoomAvailabilityAtTime,
  pickFirstAvailableRoom,
  toRoomSlotBookings,
} from "../../lib/room-availability";
import {
  resolveBookingStartsAt,
  isValidServiceDuration,
  todayDateInZone,
} from "../../lib/schedule-utils";
import type { AdminBooking } from "../../types/admin-booking";
import {
  BookingFormSheet,
  defaultBookingFormValues,
  type BookingFormValues,
} from "./booking-form-sheet";
import {
  formatCustomerBookingName,
  isValidCustomerBookingNameParts,
} from "../../lib/customer-booking-name";
import {
  formatAuPostcodeInput,
  isValidAuMobile,
  isValidAuPostcode,
  normalizeAuMobile,
} from "../../lib/au-contact";
import { BookingDetailSheet } from "./booking-detail-sheet";
import { StaffGuideTimeline } from "./staff-guide-timeline";

export function BookingScheduleContent() {
  const tenant = useTenant();
  const searchParams = useSearchParams();
  const { notifyBooking } = useBookingAlerts();
  const [date, setDate] = useState(() =>
    todayDateInZone(tenant.settings.timezone),
  );
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [pricingAdjustments, setPricingAdjustments] =
    useState<PricingAdjustments>(DEFAULT_PRICING_ADJUSTMENTS);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<BookingFormValues>(defaultBookingFormValues);
  const prefillsApplied = useRef(false);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(
    null,
  );

  const loadSchedule = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!opts?.soft) setLoading(true);
      try {
        const [staffResponse, bookingsResponse, optionsResponse, roomsResponse] =
          await Promise.all([
            fetchAdminApi("/api/admin/staff"),
            fetchAdminApi(
              `/api/admin/bookings?date=${encodeURIComponent(date)}`,
            ),
            fetchAdminApi("/api/admin/service-options"),
            fetchAdminApi("/api/admin/rooms"),
          ]);

        const staffData = (await staffResponse.json()) as {
          staff?: StaffRecord[];
        };
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

        if (staffData.staff) setStaff(staffData.staff);
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
        if (!opts?.soft) toast.error("Could not load schedule");
      } finally {
        if (!opts?.soft) setLoading(false);
      }
    },
    [date],
  );

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  useBookingRealtime(tenant.id, () => {
    void loadSchedule({ soft: true });
  });

  const visibleBookings = useMemo(
    () => bookings.filter((booking) => booking.status !== "cancelled"),
    [bookings],
  );

  const setScheduleDate = (next: string) => {
    setDate(next);
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
          !isOtherStaffGuestAttributes(member.attributes) &&
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

  const otherStaffOptions = useMemo(() => {
    const onBookingIds = new Set(
      (bookableStaff.length > 0 ? bookableStaff : workingStaff).map(
        (member) => member.id,
      ),
    );
    return staff
      .filter(
        (member) =>
          member.status === "active" &&
          !isOtherStaffGuestAttributes(member.attributes) &&
          !onBookingIds.has(member.id),
      )
      .map((member) => ({ id: member.id, name: member.name }));
  }, [staff, bookableStaff, workingStaff]);

  const assignableStaffOptions = useMemo(
    () =>
      staff
        .filter(
          (member) =>
            member.status === "active" &&
            !isOtherStaffGuestAttributes(member.attributes),
        )
        .map((member) => ({ id: member.id, name: member.name })),
    [staff],
  );

  useEffect(() => {
    if (prefillsApplied.current || serviceOptions.length === 0) return;

    const staffId = searchParams.get("staffId");
    const roomId = searchParams.get("roomId");
    if (!staffId && !roomId) return;

    prefillsApplied.current = true;
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
      roomId: form.outCall ? undefined : form.roomId || undefined,
      roomBookings: selectedRoomBookings,
      rooms,
      allRoomBookings,
      skipRoomAvailability: form.outCall,
      openAllDaySlots: form.staffId === OTHER_STAFF_SENTINEL,
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
    if (form.outCall) return null;
    if (!resolvedStartsAt || !form.durationMinutes || form.roomId) return null;
    const startMs = new Date(resolvedStartsAt).getTime();
    const endMs = startMs + Number(form.durationMinutes) * 60_000;
    return (
      pickFirstAvailableRoom(rooms, startMs, endMs, allRoomBookings)?.name ??
      null
    );
  }, [
    resolvedStartsAt,
    form.durationMinutes,
    form.outCall,
    form.roomId,
    rooms,
    allRoomBookings,
  ]);

  const openCreateForm = (partial?: Partial<BookingFormValues>) => {
    const requestedStaffId = partial?.staffId ?? "";
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
      customerFirstName: "",
      customerLastName: "",
    });
    setShowCreate(true);
  };

  const createBooking = async () => {
    const isOtherStaff = form.staffId === OTHER_STAFF_SENTINEL;
    const isAnyGirl =
      isOtherStaff &&
      (form.otherStaffMemberId === ANY_GIRL_SENTINEL ||
        form.otherStaffName.trim().toLowerCase() ===
          ANY_GIRL_LABEL.toLowerCase());
    const assignedOtherStaffId =
      isOtherStaff &&
      form.otherStaffMemberId &&
      form.otherStaffMemberId !== ANY_GIRL_SENTINEL
        ? form.otherStaffMemberId
        : "";
    const isWalkIn = isAnyGirl ? false : form.walkIn === true;
    const paymentMethod = isAnyGirl ? "pre" : form.paymentMethod;

    if (form.walkIn !== true && form.walkIn !== false && !isAnyGirl) {
      toast.error("Select Walk-in or Booking");
      return;
    }

    if (!form.staffId || !form.startsAt || !form.durationMinutes) {
      toast.error("Staff, start time, and service are required");
      return;
    }

    if (
      isOtherStaff &&
      !form.otherStaffMemberId &&
      !form.otherStaffName.trim()
    ) {
      toast.error("Select or enter the other staff name");
      return;
    }

    if (
      !isValidCustomerBookingNameParts(
        form.customerFirstName,
        form.customerLastName,
      )
    ) {
      toast.error("First name and family initial are required");
      return;
    }

    if (!isValidAuMobile(form.customerPhone)) {
      toast.error("Enter a valid Australian mobile (04XX XXX XXX)");
      return;
    }

    if (!isValidAuPostcode(form.customerPostcode)) {
      toast.error("Enter a valid Queensland postcode (4XXX)");
      return;
    }

    if (
      paymentMethod !== "cash" &&
      paymentMethod !== "card" &&
      paymentMethod !== "split" &&
      paymentMethod !== "pre"
    ) {
      toast.error("Select a payment method");
      return;
    }

    if (paymentMethod === "split") {
      const cash = Math.round(Number(form.splitCashAmount || 0) * 100);
      if (!Number.isFinite(cash) || cash <= 0) {
        toast.error("Enter the cash amount for Split");
        return;
      }
    }

    setSubmitting(true);

    try {
      const durationMinutes = Number(form.durationMinutes);

      if (!isValidServiceDuration(durationMinutes, allowedDurations)) {
        toast.error("Select a valid service duration");
        return;
      }

      const splitCashCents =
        paymentMethod === "split"
          ? Math.round(Number(form.splitCashAmount || 0) * 100)
          : undefined;

      const response = await fetchAdminApi("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: isAnyGirl
            ? undefined
            : assignedOtherStaffId || (isOtherStaff ? undefined : form.staffId),
          otherStaff: Boolean(isAnyGirl || (isOtherStaff && !assignedOtherStaffId)),
          otherStaffName: isAnyGirl
            ? ANY_GIRL_LABEL
            : isOtherStaff && !assignedOtherStaffId
              ? form.otherStaffName.trim()
              : undefined,
          walkIn: isWalkIn,
          startsAt: resolveBookingStartsAt(
            date,
            form.startsAt,
            tenant.settings.timezone,
          ),
          durationMinutes,
          roomId: form.outCall ? undefined : form.roomId || undefined,
          outCall: form.outCall,
          customerName: formatCustomerBookingName(
            form.customerFirstName,
            form.customerLastName,
          ),
          customerPhone: normalizeAuMobile(form.customerPhone),
          customerPostcode: formatAuPostcodeInput(form.customerPostcode),
          paymentMethod,
          splitCashCents,
          allowImmediateStart: form.allowImmediateStart,
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
        description: [
          priceLabel,
          data.booking?.otherStaff
            ? `Other Staff${data.booking.otherStaffName ? ` · ${data.booking.otherStaffName}` : ""}`
            : data.booking?.staffName,
          data.booking?.outCall ? "Out call" : data.booking?.roomName,
        ]
          .filter(Boolean)
          .join(" · "),
      });

      if (data.booking?.staffName && !data.booking?.otherStaff) {
        notifyBooking(data.booking.staffName);
      }

      setShowCreate(false);
      setForm(defaultBookingFormValues);
      void loadSchedule({ soft: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <StaffGuideTimeline
        date={date}
        onDateChange={setScheduleDate}
        timeZone={tenant.settings.timezone || "Australia/Sydney"}
        staff={staff}
        bookings={visibleBookings}
        loading={loading}
        selectedBookingId={selectedBooking?.id ?? null}
        onBookingSelect={setSelectedBooking}
        onCreateBooking={() => openCreateForm()}
        createDisabled={serviceOptions.length === 0}
        banner={
          serviceOptions.length === 0 ? (
            <div className="shrink-0 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
              No service pricing yet.{" "}
              <Link
                href="/admin/services"
                className="font-medium text-primary underline"
              >
                Add durations and prices
              </Link>{" "}
              before creating bookings.
            </div>
          ) : null
        }
      />

      <BookingDetailSheet
        booking={selectedBooking}
        open={selectedBooking !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(null);
        }}
        currency={tenant.settings.currency}
        rooms={rooms}
        dayBookings={bookings}
        onCheckedOut={() => void loadSchedule({ soft: true })}
        onRoomChanged={(updated) => {
          setSelectedBooking(updated);
          void loadSchedule({ soft: true });
        }}
        onCancelled={() => {
          setSelectedBooking(null);
          void loadSchedule({ soft: true });
        }}
        onPaymentConfirmed={(updated) => {
          setSelectedBooking(updated);
          void loadSchedule({ soft: true });
        }}
        assignableStaff={assignableStaffOptions}
      />

      <BookingFormSheet
        open={showCreate}
        onOpenChange={setShowCreate}
        date={date}
        onDateChange={setDate}
        timeZone={tenant.settings.timezone}
        staffOptions={(bookableStaff.length > 0
          ? bookableStaff
          : workingStaff
        ).map((member) => ({ id: member.id, name: member.name }))}
        otherStaffOptions={otherStaffOptions}
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
