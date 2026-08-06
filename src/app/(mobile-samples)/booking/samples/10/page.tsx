import {
  BookingSampleCtaColors,
  BookingSampleShell,
} from "@/features/booking/components/samples";
import { bookingStaffMock } from "@/features/booking/config/booking-staff-mock";

export default function BookingSample10Page() {
  return (
    <BookingSampleShell
      sampleLabel="Sample 10"
      sampleNumber={10}
      title="Choose your therapist"
      subtitle="Deep hot-pink Book Now"
    >
      <BookingSampleCtaColors staff={bookingStaffMock} variant="hot-pink" />
    </BookingSampleShell>
  );
}
