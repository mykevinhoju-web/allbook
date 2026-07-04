import { BookingCheckoutFlow } from "@/features/booking/components/checkout/booking-checkout-flow";

interface BookingStaffPageProps {
  params: Promise<{ staffId: string }>;
}

export default async function BookingStaffPage({
  params,
}: BookingStaffPageProps) {
  const { staffId } = await params;

  return <BookingCheckoutFlow staffId={staffId} returnTo="/booking" />;
}
