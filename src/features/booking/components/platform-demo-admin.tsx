"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  Home,
  LayoutDashboard,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { AdminNavBadge } from "@/features/admin/components/admin-nav-badge";

import type { DemoBooking } from "../types/platform-demo-booking";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

type AdminTab = "home" | "bookings" | "staff";

export function PlatformDemoAdmin({
  bookings,
  unreadCount,
  showAlert,
  onDismissAlert,
  onOpenBooking,
  onClearUnread,
  onBookAnother,
}: {
  bookings: DemoBooking[];
  unreadCount: number;
  showAlert: boolean;
  onDismissAlert: () => void;
  onOpenBooking: (id: string) => void;
  onClearUnread: () => void;
  onBookAnother: () => void;
}) {
  const [tab, setTab] = useState<AdminTab>("home");
  const latest = bookings[0] ?? null;

  useEffect(() => {
    if (showAlert && latest) {
      // Keep focus on home so the alert + badge are visible first.
      setTab("home");
    }
  }, [showAlert, latest]);

  const openLatest = () => {
    if (!latest) return;
    onDismissAlert();
    onClearUnread();
    onOpenBooking(latest.id);
  };

  const openBookingsTab = () => {
    setTab("bookings");
    onClearUnread();
    onDismissAlert();
  };

  return (
    <div className="flex min-h-full flex-col bg-[#F6F5F3] text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white px-4 pb-3 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A6A3A]">
              AllBook Admin
            </p>
            <h1 className="text-lg font-bold tracking-tight">Demo Spa</h1>
          </div>
          <button
            type="button"
            onClick={openLatest}
            className="relative flex size-10 items-center justify-center rounded-full bg-stone-100 text-stone-700 transition hover:bg-stone-200"
            aria-label={
              unreadCount > 0
                ? `${unreadCount} new booking notification`
                : "Notifications"
            }
          >
            <Bell className="size-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5">
                <AdminNavBadge count={unreadCount} />
              </span>
            ) : null}
          </button>
        </div>
      </header>

      {showAlert && latest ? (
        <button
          type="button"
          onClick={openLatest}
          className="mx-3 mt-3 flex w-[calc(100%-1.5rem)] items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-3.5 py-3 text-left shadow-sm transition hover:bg-violet-100/80"
        >
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
            <Bell className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-violet-950">
              New booking
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-violet-800">
              {latest.customerName} · {latest.staffName} · {latest.timeLabel}
            </span>
            <span className="mt-1 block text-[11px] font-medium text-violet-600">
              Tap to view details
            </span>
          </span>
        </button>
      ) : null}

      <div className="flex-1 overflow-y-auto px-3 pb-24 pt-3">
        {tab === "home" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  Today
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {bookings.length}
                </p>
                <p className="mt-0.5 text-[11px] text-stone-500">bookings</p>
              </div>
              <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  New
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-red-500">
                  {unreadCount}
                </p>
                <p className="mt-0.5 text-[11px] text-stone-500">unread</p>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold">Latest activity</h2>
                <button
                  type="button"
                  onClick={openBookingsTab}
                  className="text-[11px] font-semibold text-violet-700"
                >
                  See all
                </button>
              </div>
              {latest ? (
                <button
                  type="button"
                  onClick={openLatest}
                  className="mt-3 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-3 text-left transition hover:bg-stone-100"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{latest.customerName}</p>
                    {unreadCount > 0 ? (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        NEW
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {latest.staffName} · {latest.date} · {latest.timeLabel}
                  </p>
                </button>
              ) : (
                <p className="mt-3 text-xs text-stone-500">No bookings yet.</p>
              )}
            </div>

            <button
              type="button"
              onClick={onBookAnother}
              className="w-full rounded-xl bg-neutral-950 py-3 text-sm font-semibold text-white"
            >
              Book another (customer view)
            </button>
          </div>
        ) : null}

        {tab === "bookings" ? (
          <div className="space-y-2.5">
            <h2 className="px-1 text-sm font-bold">Bookings</h2>
            {bookings.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-8 text-center text-xs text-stone-500">
                No bookings yet.
              </p>
            ) : (
              bookings.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => {
                    onClearUnread();
                    onOpenBooking(booking.id);
                  }}
                  className="flex w-full items-start justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white px-3.5 py-3 text-left shadow-sm transition hover:border-stone-300"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {booking.customerName}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {booking.staffName} · {booking.durationLabel}
                    </p>
                    <p className="mt-1 text-xs font-medium text-stone-700">
                      {booking.date} · {booking.timeLabel}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums">
                      {formatPrice(booking.priceCents)}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                      Confirmed
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : null}

        {tab === "staff" ? (
          <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold">Staff</h2>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">
              Demo only — staff management lives in the full admin portal.
            </p>
          </div>
        ) : null}
      </div>

      <nav className="absolute inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 px-2 pb-2 pt-1.5 backdrop-blur">
        <div className="grid grid-cols-3 gap-1">
          {(
            [
              { id: "home", label: "Home", icon: LayoutDashboard },
              { id: "bookings", label: "Bookings", icon: CalendarDays },
              { id: "staff", label: "Staff", icon: Users },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (id === "bookings") openBookingsTab();
                  else setTab(id);
                }}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold transition",
                  active ? "bg-stone-100 text-stone-950" : "text-stone-500",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {id === "bookings" && unreadCount > 0 ? (
                    <span className="absolute -right-2 -top-1">
                      <AdminNavBadge count={unreadCount} />
                    </span>
                  ) : null}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PlatformDemoBookingDetail({
  booking,
  onBack,
}: {
  booking: DemoBooking;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col bg-white text-stone-900">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-stone-100 bg-white px-3 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 items-center justify-center rounded-full text-[#8A6A3A] hover:bg-stone-50"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A6A3A]">
            Booking
          </p>
          <h1 className="truncate text-base font-bold">{booking.customerName}</h1>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
          Confirmed
        </span>
      </header>

      <div className="space-y-4 px-4 py-5">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Home className="size-4 text-stone-500" />
            Appointment
          </div>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Therapist</dt>
              <dd className="font-medium">{booking.staffName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Date</dt>
              <dd className="font-medium">{booking.date}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Time</dt>
              <dd className="font-medium">{booking.timeLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Duration</dt>
              <dd className="font-medium">{booking.durationLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Total</dt>
              <dd className="font-bold tabular-nums">
                {formatPrice(booking.priceCents)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-stone-200 p-4">
          <p className="text-sm font-semibold">Customer</p>
          <p className="mt-2 text-sm text-stone-800">{booking.customerName}</p>
          <p className="mt-1 text-sm text-stone-500">{booking.customerPhone}</p>
        </div>
      </div>
    </div>
  );
}
