import type { Metadata } from "next";
import { headers } from "next/headers";

import { BookingStaffPicker } from "@/features/booking/components/booking-staff-picker";
import { isPlatformHost } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Book appointment",
};

export default async function BookingPage() {
  const host = (await headers()).get("host") ?? "";
  const isPlatformDemo = isPlatformHost(host);

  return <BookingStaffPicker isPlatformDemo={isPlatformDemo} />;
}
