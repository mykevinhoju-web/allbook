import {
  BookingSamplePortrait,
  BookingSampleShell,
} from "@/features/booking/components/samples";
import { bookingStaffMock } from "@/features/booking/config/booking-staff-mock";

export default function BookingSample3Page() {
  return (
    <BookingSampleShell
      sampleLabel="Sample 3"
      sampleNumber={3}
      title="Select staff"
      subtitle="Design preview only — not a live booking."
    >
      <BookingSamplePortrait staff={bookingStaffMock} />
    </BookingSampleShell>
  );
}
