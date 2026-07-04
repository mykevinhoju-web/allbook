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
      title="Choose your therapist"
      subtitle="Design preview only — not a live booking."
    >
      <BookingSampleCards staff={bookingStaffMock} />
    </BookingSampleShell>
  );
}
