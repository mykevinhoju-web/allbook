import { BookingCheckoutFlow } from "@/features/booking/components/checkout/booking-checkout-flow";

interface BookingStaffPageProps {
  params: Promise<{ staffId: string }>;
  searchParams: Promise<{ returnTo?: string; theme?: string }>;
}

export default async function BookingStaffPage({
  params,
  searchParams,
}: BookingStaffPageProps) {
  const { staffId } = await params;
  const query = await searchParams;

  return (
    <BookingCheckoutFlow
      staffId={staffId}
      returnTo={query.returnTo ?? "/booking/samples"}
      theme={query.theme === "pastel" ? "pastel" : "default"}
    />
  );
}
