import {
  BookingSamplePastel,
  BookingSampleShell,
} from "@/features/booking/components/samples";
import { bookingStaffMock } from "@/features/booking/config/booking-staff-mock";

export default function BookingSample7Page() {
  return (
    <BookingSampleShell
      theme="pastel"
      sampleLabel="Sample 7"
      sampleNumber={7}
      title="Select staff"
      subtitle="Pastel pink · white pill button with magenta outline."
    >
      <BookingSamplePastel staff={bookingStaffMock} />
    </BookingSampleShell>
  );
}
