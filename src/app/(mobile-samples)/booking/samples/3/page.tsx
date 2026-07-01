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
      subtitle="Portrait-first rows with outlined Book."
    >
      <BookingSamplePortrait staff={bookingStaffMock} />
    </BookingSampleShell>
  );
}
