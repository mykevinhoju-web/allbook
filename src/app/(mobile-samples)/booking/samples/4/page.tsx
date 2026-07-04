import {
  BookingSampleNoir,
  BookingSampleShell,
} from "@/features/booking/components/samples";
import { bookingStaffDarkMock } from "@/features/booking/config/booking-staff-dark-mock";

export default function BookingSample4Page() {
  return (
    <BookingSampleShell
      theme="dark"
      sampleLabel="Sample 4 — Noir"
      sampleNumber={4}
      title="Private evening"
      subtitle="Design preview only — not a live booking."
    >
      <BookingSampleNoir staff={bookingStaffDarkMock} />
    </BookingSampleShell>
  );
}
