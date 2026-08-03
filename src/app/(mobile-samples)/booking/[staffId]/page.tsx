import { headers } from "next/headers";

import { BookingCheckoutFlow } from "@/features/booking/components/checkout/booking-checkout-flow";
import { PlatformDemoCheckout } from "@/features/booking/components/platform-demo-checkout";
import { isPlatformHost } from "@/features/tenants";

interface BookingStaffPageProps {
  params: Promise<{ staffId: string }>;
}

export default async function BookingStaffPage({
  params,
}: BookingStaffPageProps) {
  const { staffId } = await params;
  const host = (await headers()).get("host") ?? "";

  if (isPlatformHost(host)) {
    return <PlatformDemoCheckout staffId={staffId} />;
  }

  return <BookingCheckoutFlow staffId={staffId} returnTo="/booking" />;
}
