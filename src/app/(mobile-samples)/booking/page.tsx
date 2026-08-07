import type { Metadata } from "next";
import { headers } from "next/headers";

import { BookingStaffPicker } from "@/features/booking/components/booking-staff-picker";
import { PlatformDemoBooking } from "@/features/booking/components/platform-demo-booking";
import { isPrivatePreviewEnabled } from "@/features/private-preview";
import { isPlatformHost } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Book appointment demo",
  description:
    "Try the AllBook booking demo — customisable online appointments for Australian service businesses.",
  robots: isPrivatePreviewEnabled()
    ? { index: false, follow: false }
    : { index: true, follow: true },
};

export default async function BookingPage() {
  const host = (await headers()).get("host") ?? "";

  if (isPlatformHost(host)) {
    return <PlatformDemoBooking />;
  }

  return <BookingStaffPicker />;
}
