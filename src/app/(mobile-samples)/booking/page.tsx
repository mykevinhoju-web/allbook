import type { Metadata } from "next";

import { BookingStaffPicker } from "@/features/booking/components/booking-staff-picker";

export const metadata: Metadata = {
  title: "Book appointment",
};

export default function BookingPage() {
  return <BookingStaffPicker />;
}
