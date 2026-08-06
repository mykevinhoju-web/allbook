import {
  BookingSampleCtaColors,
  BookingSampleShell,
} from "@/features/booking/components/samples";
import { bookingStaffMock } from "@/features/booking/config/booking-staff-mock";

export default function BookingSample9Page() {
  return (
    <BookingSampleShell
      sampleLabel="Sample 9"
      sampleNumber={9}
      title="Choose your therapist"
      subtitle="Wine red gradient Book Now"
    >
      <BookingSampleCtaColors staff={bookingStaffMock} variant="wine" />
    </BookingSampleShell>
  );
}
