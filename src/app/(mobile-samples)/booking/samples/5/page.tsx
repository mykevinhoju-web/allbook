import {
  BookingSampleShell,
  BookingSampleVelvet,
} from "@/features/booking/components/samples";
import { bookingStaffDarkMock } from "@/features/booking/config/booking-staff-dark-mock";

export default function BookingSample5Page() {
  return (
    <BookingSampleShell
      theme="dark"
      sampleLabel="Sample 5 — Velvet"
      sampleNumber={5}
      title="Velvet lounge"
      subtitle="Design preview only — not a live booking."
    >
      <BookingSampleVelvet staff={bookingStaffDarkMock} />
    </BookingSampleShell>
  );
}
