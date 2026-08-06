import {
  BookingSampleCtaColors,
  BookingSampleShell,
} from "@/features/booking/components/samples";
import { bookingStaffMock } from "@/features/booking/config/booking-staff-mock";

export default function BookingSample8Page() {
  return (
    <BookingSampleShell
      sampleLabel="Sample 8"
      sampleNumber={8}
      title="Choose your therapist"
      subtitle="Black background · Burgundy Book Now"
      theme="black"
    >
      <BookingSampleCtaColors
        staff={bookingStaffMock}
        variant="burgundy-black"
      />
    </BookingSampleShell>
  );
}
