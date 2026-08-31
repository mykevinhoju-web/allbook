import type { Metadata } from "next";
import { headers } from "next/headers";

import { BookingStaffPicker } from "@/features/booking/components/booking-staff-picker";
import { PlatformDemoBooking } from "@/features/booking/components/platform-demo-booking";
import {
  EverBookingForm,
  EverLandingFonts,
  isEverTenant,
} from "@/features/ever";
import { isPrivatePreviewEnabled } from "@/features/private-preview";
import { isPlatformHost } from "@/features/tenants";
import { getTenantOptional } from "@/features/tenants/server";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantOptional();

  if (tenant && isEverTenant(tenant.slug)) {
    return {
      title: "Book — Everwell Massage",
      description: "Request an appointment at Everwell Massage.",
      robots: { index: true, follow: true },
    };
  }

  return {
    title: "Book appointment demo",
    description:
      "Try the AllBook booking demo — customisable online appointments for Australian service businesses.",
    robots: isPrivatePreviewEnabled()
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function BookingPage() {
  const host = (await headers()).get("host") ?? "";
  const tenant = await getTenantOptional();

  if (tenant && isEverTenant(tenant.slug)) {
    return (
      <EverLandingFonts>
        <EverBookingForm />
      </EverLandingFonts>
    );
  }

  if (isPlatformHost(host)) {
    return <PlatformDemoBooking />;
  }

  return <BookingStaffPicker />;
}
