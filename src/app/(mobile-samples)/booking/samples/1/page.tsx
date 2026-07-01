import {
  BookingSampleList,
  BookingSampleShell,
} from "@/features/booking/components/samples";
import { bookingStaffMock } from "@/features/booking/config/booking-staff-mock";

export default function BookingSample1Page() {
  return (
    <BookingSampleShell
      sampleLabel="Sample 1"
      sampleNumber={1}
      title="Choose your therapist"
      subtitle="Simple list — photo, name, Book."
    >
      <BookingSampleList staff={bookingStaffMock} />
    </BookingSampleShell>
  );
}
