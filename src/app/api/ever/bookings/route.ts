import { NextResponse } from "next/server";

import { isEverTenant } from "@/features/ever/config";
import { createEverSiteBooking } from "@/features/ever/server/ever-data";
import {
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function combineDateAndTime(
  dateIso: string,
  time: string,
  timeZone: string,
): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match || !timeMatch) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  const probe = new Date(
    Date.UTC(year, month - 1, day, hour, minute, 0),
  );
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(probe);

  const read = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const localYear = Number(read("year"));
  const localMonth = Number(read("month"));
  const localDay = Number(read("day"));
  const localHour = Number(read("hour"));
  const localMinute = Number(read("minute"));

  const utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const shownMs = Date.UTC(
    localYear,
    localMonth - 1,
    localDay,
    localHour,
    localMinute,
    0,
  );
  const offsetMs = shownMs - utcMs;

  return new Date(utcMs - offsetMs).toISOString();
}

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);

    if (!isEverTenant(tenant.slug)) {
      return NextResponse.json(
        { error: "This booking form is not available." },
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      date?: string;
      time?: string;
      serviceId?: string;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      customerPostcode?: string;
    };

    const customerName = body.customerName?.trim() ?? "";
    const customerPhone = body.customerPhone?.trim() ?? "";
    const customerEmail = body.customerEmail?.trim() ?? "";
    const customerPostcode = body.customerPostcode?.trim() ?? "";

    if (
      !body.date ||
      !body.time ||
      !body.serviceId ||
      !customerName ||
      !customerPhone ||
      !customerEmail ||
      !customerPostcode
    ) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 },
      );
    }

    if (!isValidEmail(customerEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const startsAt = combineDateAndTime(
      body.date,
      body.time,
      tenant.settings.timezone || "Australia/Brisbane",
    );

    if (!startsAt) {
      return NextResponse.json(
        { error: "Invalid date or time." },
        { status: 400 },
      );
    }

    if (new Date(startsAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Please choose a future date and time." },
        { status: 400 },
      );
    }

    const booking = await createEverSiteBooking(tenant.id, {
      serviceId: body.serviceId,
      startsAt,
      customerName,
      customerPhone,
      customerEmail,
      customerPostcode,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
