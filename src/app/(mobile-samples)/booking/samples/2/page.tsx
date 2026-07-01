import {
  BookingSampleCards,
  BookingSampleShell,
} from "@/features/booking/components/samples";
import { bookingStaffMock } from "@/features/booking/config/booking-staff-mock";

export default function BookingSample2Page() {
  return (
    <BookingSampleShell
      sampleLabel="Sample 2"
      sampleNumber={2}
      title="Book a session"
      subtitle="Card layout with full-width Book button."
    >
      <BookingSampleCards staff={bookingStaffMock} />
    </BookingSampleShell>
  );
}
