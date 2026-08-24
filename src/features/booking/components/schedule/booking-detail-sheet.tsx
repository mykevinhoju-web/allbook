"use client";

import { useEffect, useMemo, useState } from "react";

import { AppButton, toast } from "@/components/common";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { formatPriceFromCents } from "@/features/services";
import { cn } from "@/lib/utils";

import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import {
  formatPaymentMethodLabel,
  type SettledInternalPaymentMethod,
} from "../../lib/internal-payment-method";
import { bookingCustomerTheme as theme } from "../../lib/booking-customer-theme";
import {
  adminBookingSheetBodyClassName,
  adminBookingSheetClassName,
  adminBookingSheetHandleClassName,
  adminBookingSheetScrollClassName,
} from "../../lib/admin-booking-sheet";
import { canCheckInToBooking, canResumeEndedService } from "../../lib/booking-check-in";
import { getAvailableExtendMinutes } from "../../lib/booking-extend";

import {
  formatAmPmTime,
  formatBookingSummary,
  formatDurationLabel,
  formatScheduleDate,
  formatShiftDateTime,
} from "../../lib/schedule-utils";
import {
  getBookingRoomChangeWindow,
  getRoomAvailabilityInWindow,
  toRoomSlotBookings,
} from "../../lib/room-availability";
import { isBookingOccupyingRoom } from "../../lib/room-occupancy";
import type { AdminBooking } from "../../types/admin-booking";
import { BookingCheckoutButton } from "./booking-checkout-button";

type BookingFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

interface BookingDetailSheetProps {
  booking: AdminBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: string;
  rooms?: { id: string; name: string }[];
  /** Other bookings on the same day (for room free/busy). */
  dayBookings?: AdminBooking[];
  onCheckedOut?: () => void;
  onRoomChanged?: (booking: AdminBooking) => void;
  onCancelled?: () => void;
  onPaymentConfirmed?: (booking: AdminBooking) => void;
  fetchApi?: BookingFetch;
  allowCancel?: boolean;
  hideStaffField?: boolean;
  onEnterRoom?: () => void;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-100 py-3 last:border-0">
      <span className={cn(theme.label, "normal-case tracking-normal")}>{label}</span>
      <span className="text-right text-sm font-medium text-stone-800">{value}</span>
    </div>
  );
}

export function BookingDetailSheet({
  booking,
  open,
  onOpenChange,
  currency = "AUD",
  rooms = [],
  dayBookings = [],
  onCheckedOut,
  onRoomChanged,
  onCancelled,
  onPaymentConfirmed,
  fetchApi = fetchAdminApi,
  allowCancel = true,
  hideStaffField = false,
  onEnterRoom,
}: BookingDetailSheetProps) {
  const [roomId, setRoomId] = useState("");
  const [savingRoom, setSavingRoom] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [extending, setExtending] = useState<number | null>(null);
  const [confirmMethod, setConfirmMethod] =
    useState<SettledInternalPaymentMethod | "">("");
  const [confirmSplitCash, setConfirmSplitCash] = useState("");
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    setRoomId(booking?.roomId ?? "");
    setConfirmMethod("");
    setConfirmSplitCash("");
  }, [booking?.id, booking?.roomId]);

  const canChangeRoom =
    Boolean(booking) &&
    !booking!.outCall &&
    booking!.status !== "cancelled" &&
    booking!.status !== "completed";

  const canCancel =
    allowCancel &&
    Boolean(booking) &&
    booking!.status !== "cancelled" &&
    booking!.status !== "completed";

  const roomChange = useMemo(() => {
    if (!booking || !canChangeRoom || rooms.length === 0) {
      return null;
    }

    const window = getBookingRoomChangeWindow(
      booking.startsAt,
      booking.endsAt,
    );
    if (!window) return null;

    return {
      window,
      statuses: getRoomAvailabilityInWindow(
        rooms,
        window.startsAt,
        window.endsAt,
        toRoomSlotBookings(dayBookings),
        {
          excludeBookingId: booking.id,
          currentRoomId: booking.roomId,
        },
      ),
    };
  }, [
    booking,
    canChangeRoom,
    rooms,
    dayBookings,
  ]);

  if (!booking) return null;

  const inProgress = isBookingOccupyingRoom(booking);
  const canEnterRoom = Boolean(onEnterRoom) && canCheckInToBooking(booking);
  const canResumeService = canResumeEndedService(booking);
  const canExtend =
    Boolean(booking.checkedInAt) &&
    !booking.checkedOutAt &&
    booking.status !== "completed" &&
    booking.status !== "cancelled";

  const extendMinuteOptions = [10, 15, 20] as const;
  const availableExtendMinutes = getAvailableExtendMinutes(
    booking.endsAt,
    dayBookings
      .filter(
        (row) =>
          row.id !== booking.id &&
          row.status !== "cancelled" &&
          row.status !== "completed" &&
          (row.roomId === booking.roomId || row.staffId === booking.staffId),
      )
      .map((row) => row.startsAt),
    extendMinuteOptions,
  );

  const extendBooking = async (minutes: number) => {
    setExtending(minutes);
    try {
      const response = await fetchApi(
        `/api/admin/bookings/${booking.id}/extend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutes }),
        },
      );
      const data = (await response.json()) as {
        error?: string;
        booking?: AdminBooking;
      };
      if (!response.ok || !data.booking) {
        toast.error("Could not extend", { description: data.error });
        return;
      }
      toast.success(`Extended +${minutes} min`);
      onRoomChanged?.(data.booking);
    } finally {
      setExtending(null);
    }
  };

  const priceLabel =
    booking.priceCents > 0
      ? formatPriceFromCents(booking.priceCents, currency)
      : null;

  const roomDirty = roomId !== (booking.roomId ?? "");
  const selectedStatus = roomChange?.statuses.find((room) => room.id === roomId);
  const canSaveRoom =
    canChangeRoom &&
    roomDirty &&
    Boolean(roomId) &&
    (selectedStatus?.available ?? false);

  const saveRoom = async () => {
    if (!canSaveRoom) return;

    setSavingRoom(true);
    try {
      const response = await fetchApi(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      const data = (await response.json()) as {
        error?: string;
        booking?: AdminBooking;
      };

      if (!response.ok) {
        toast.error("Could not change room", {
          description: data.error ?? "Try another room.",
        });
        return;
      }

      toast.success("Room updated", {
        description: data.booking?.roomName
          ? `Moved to ${data.booking.roomName}.`
          : "Room assignment saved.",
      });

      if (data.booking) {
        onRoomChanged?.(data.booking);
      }
    } catch {
      toast.error("Could not change room", {
        description: "Network error. Try again.",
      });
    } finally {
      setSavingRoom(false);
    }
  };

  const cancelBooking = async () => {
    if (!canCancel || cancelling) return;

    const confirmed = window.confirm(
      "Cancel this booking? The time slot will become available again.",
    );
    if (!confirmed) return;

    setCancelling(true);
    try {
      const response = await fetchApi(`/api/admin/bookings/${booking.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error("Could not cancel booking", {
          description: data.error ?? "Try again.",
        });
        return;
      }

      toast.success("Booking cancelled");
      onCancelled?.();
      onOpenChange(false);
    } catch {
      toast.error("Could not cancel booking", {
        description: "Network error. Try again.",
      });
    } finally {
      setCancelling(false);
    }
  };

  const confirmPayment = async () => {
    if (!booking || !confirmMethod || confirmingPayment) return;

    const splitCashCents =
      confirmMethod === "split"
        ? Math.round(Number(confirmSplitCash || 0) * 100)
        : undefined;

    if (
      confirmMethod === "split" &&
      (!splitCashCents ||
        splitCashCents <= 0 ||
        splitCashCents >= booking.priceCents)
    ) {
      toast.error("Enter a cash amount less than the total");
      return;
    }

    setConfirmingPayment(true);
    try {
      const response = await fetchApi(
        `/api/admin/bookings/${booking.id}/confirm-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod: confirmMethod,
            splitCashCents,
          }),
        },
      );
      const data = (await response.json()) as {
        booking?: AdminBooking;
        error?: string;
      };

      if (!response.ok) {
        toast.error("Could not confirm payment", {
          description: data.error ?? "Try again.",
        });
        return;
      }

      toast.success("Payment confirmed");
      if (data.booking) onPaymentConfirmed?.(data.booking);
      onOpenChange(false);
    } catch {
      toast.error("Could not confirm payment", {
        description: "Network error. Try again.",
      });
    } finally {
      setConfirmingPayment(false);
    }
  };

  const resumeService = async () => {
    if (!booking || !canResumeService || resuming) return;
    setResuming(true);
    try {
      const response = await fetchApi(
        `/api/admin/bookings/${booking.id}/resume-service`,
        { method: "POST" },
      );
      const data = (await response.json()) as {
        booking?: AdminBooking;
        error?: string;
      };
      if (!response.ok || !data.booking) {
        toast.error("Could not resume service", {
          description: data.error ?? "Try again.",
        });
        return;
      }
      toast.success("Service is in progress again");
      onRoomChanged?.(data.booking);
    } catch {
      toast.error("Could not resume service", {
        description: "Network error. Try again.",
      });
    } finally {
      setResuming(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" showCloseButton className={adminBookingSheetClassName}>
        <div className={adminBookingSheetBodyClassName}>
          <div className={adminBookingSheetHandleClassName} />

          <SheetHeader className="shrink-0 border-b border-stone-100 px-4 py-3 text-left">
            <p className={theme.eyebrow}>Booking</p>
            <SheetTitle className="text-lg font-semibold tracking-tight text-stone-900">
              Booking details
            </SheetTitle>
            <p className="text-sm text-stone-500">
              {formatScheduleDate(booking.startsAt)}
              {inProgress ? (
                <span className="ml-2 text-xs font-semibold uppercase text-amber-700">
                  In progress
                </span>
              ) : null}
            </p>
          </SheetHeader>

          <div className={adminBookingSheetScrollClassName}>
            <div className={cn(theme.panel, "px-4 py-1")}>
              <DetailRow label="Time" value={formatBookingSummary(booking)} />
              {hideStaffField ? null : (
                <DetailRow
                  label="Staff"
                  value={
                    booking.otherStaff
                      ? `Other Staff${booking.otherStaffName ? ` · ${booking.otherStaffName}` : ""}`
                      : booking.staffName
                  }
                />
              )}
              <DetailRow
                label="Customer"
                value={booking.customerName ?? "Walk-in"}
              />
              <DetailRow label="Phone" value={booking.customerPhone} />
              <DetailRow label="Email" value={booking.customerEmail} />
              <DetailRow label="Postcode" value={booking.customerPostcode} />
              <DetailRow
                label="Room"
                value={
                  booking.outCall ? "Out call" : (booking.roomName ?? "—")
                }
              />
              <DetailRow
                label="Service"
                value={formatDurationLabel(booking.durationMinutes)}
              />
              <DetailRow label="Price" value={priceLabel} />
              <DetailRow
                label="Payment"
                value={formatPaymentMethodLabel(
                  booking.paymentMethod,
                  booking.splitCashCents,
                  booking.priceCents,
                )}
              />
              <DetailRow label="Status" value={booking.status} />
              <DetailRow
                label="Starts"
                value={formatShiftDateTime(booking.startsAt)}
              />
              <DetailRow
                label="Ends"
                value={formatShiftDateTime(booking.endsAt)}
              />
            </div>

            {roomChange ? (
              <div className={cn(theme.panel, "space-y-3")}>
                <p className="text-sm font-semibold text-stone-900">Change room</p>
                <p className="text-xs text-stone-500">
                  {roomChange.window.remainingOnly
                    ? "Only rooms free for the remaining time are shown as available."
                    : "Only rooms free for this booking window are shown as available."}
                </p>
                <select
                  className={theme.field}
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value)}
                  disabled={savingRoom}
                >
                  <option value="" disabled>
                    Select a room
                  </option>
                  {roomChange.statuses.map((room) => (
                    <option
                      key={room.id}
                      value={room.id}
                      disabled={!room.available && room.id !== booking.roomId}
                    >
                      {room.name}
                      {room.id === booking.roomId
                        ? " (current)"
                        : room.available
                          ? " · Available"
                          : room.conflictLabel
                            ? ` · Busy ${room.conflictLabel}`
                            : " · Busy"}
                    </option>
                  ))}
                </select>
                <AppButton
                  type="button"
                  className={cn(theme.goldButton, "mt-1")}
                  disabled={!canSaveRoom || savingRoom}
                  onClick={() => void saveRoom()}
                >
                  {savingRoom ? "Saving…" : "Save room"}
                </AppButton>
              </div>
            ) : null}

            {canEnterRoom ? (
              <AppButton
                type="button"
                className={cn(theme.goldButton, "w-full")}
                onClick={() => {
                  onEnterRoom?.();
                  onOpenChange(false);
                }}
              >
                Enter room
              </AppButton>
            ) : null}

            {booking.paymentStatus === "unpaid" ||
            booking.paymentMethod === "pre" ? (
              <div className={cn(theme.panel, "space-y-3")}>
                <p className="text-sm font-semibold text-stone-900">
                  Confirm payment
                </p>
                <p className="text-xs text-stone-500">
                  Pre booking — choose how the guest paid to add it to revenue.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "cash" as const, label: "Cash" },
                      { value: "card" as const, label: "Card" },
                      { value: "split" as const, label: "Split" },
                    ] as const
                  ).map((option) => {
                    const selected = confirmMethod === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setConfirmMethod(option.value);
                          if (option.value !== "split") setConfirmSplitCash("");
                        }}
                        className={cn(
                          "min-h-10 rounded-xl border text-sm font-semibold transition",
                          selected
                            ? "border-[#8A6A3A] bg-[#8A6A3A]/10 text-stone-900 ring-2 ring-[#8A6A3A]/25"
                            : "border-stone-200 bg-white text-stone-700",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {confirmMethod === "split" ? (
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-stone-500">
                      Cash amount ({currency})
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      value={confirmSplitCash}
                      onChange={(event) =>
                        setConfirmSplitCash(event.target.value)
                      }
                      placeholder="e.g. 20"
                      className="h-11 rounded-xl border-stone-200"
                    />
                  </label>
                ) : null}
                <AppButton
                  type="button"
                  className={cn(theme.goldButton, "w-full")}
                  disabled={!confirmMethod || confirmingPayment}
                  onClick={() => void confirmPayment()}
                >
                  {confirmingPayment ? "Confirming…" : "Confirm payment"}
                </AppButton>
              </div>
            ) : null}

            {canExtend ? (
              <div className={cn(theme.panel, "space-y-3")}>
                <p className="text-sm font-semibold text-stone-900">
                  Extend service time
                </p>
                <p className="text-xs text-stone-500">
                  Only options that fit before the next room or staff booking
                  are shown.
                </p>
                {availableExtendMinutes.length === 0 ? (
                  <p className="text-sm text-stone-500">
                    No extend available — next booking is too soon.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableExtendMinutes.map((minutes) => (
                      <AppButton
                        key={minutes}
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl"
                        disabled={extending !== null}
                        onClick={() => void extendBooking(minutes)}
                      >
                        {extending === minutes ? "…" : `+${minutes}m`}
                      </AppButton>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {inProgress && booking.roomId ? (
              <BookingCheckoutButton
                bookingId={booking.id}
                roomName={booking.roomName}
                size="default"
                className={theme.goldButton}
                fetchApi={fetchApi}
                onCheckedOut={() => {
                  onCheckedOut?.();
                  onOpenChange(false);
                }}
              />
            ) : null}

            {canResumeService ? (
              <div className={cn(theme.panel, "space-y-3")}>
                <p className="text-sm font-semibold text-stone-900">
                  Resume in progress
                </p>
                <p className="text-xs text-stone-500">
                  This service was ended early. Restore it while the booked
                  time is still running.
                </p>
                <AppButton
                  type="button"
                  className={cn(theme.goldButton, "w-full")}
                  disabled={resuming}
                  onClick={() => void resumeService()}
                >
                  {resuming ? "Resuming…" : "Mark as in progress"}
                </AppButton>
              </div>
            ) : null}

            {canCancel ? (
              <AppButton
                type="button"
                variant="outline"
                className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                disabled={cancelling}
                onClick={() => void cancelBooking()}
              >
                {cancelling ? "Cancelling…" : "Cancel booking"}
              </AppButton>
            ) : null}

            <p className="text-center text-xs text-stone-500">
              {formatAmPmTime(booking.startsAt)} – {formatAmPmTime(booking.endsAt)}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
