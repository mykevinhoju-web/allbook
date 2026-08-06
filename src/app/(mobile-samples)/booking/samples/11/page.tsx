import {
  BookingSampleDevilHeartButton,
  BookingSampleShell,
} from "@/features/booking/components/samples";
import { bookingStaffMock } from "@/features/booking/config/booking-staff-mock";

export default function BookingSample11Page() {
  return (
    <BookingSampleShell
      sampleLabel="Sample 11"
      sampleNumber={11}
      title="Choose your therapist"
      subtitle="Live layout · devil-heart icon Book Now button"
      totalSamples={11}
    >
      <BookingSampleDevilHeartButton staff={bookingStaffMock} />
    </BookingSampleShell>
  );
}
