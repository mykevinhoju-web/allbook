import {
  BookingSamplePortrait,
  BookingSampleShell,
} from "@/features/booking/components/samples";
import { bookingStaffMock } from "@/features/booking/config/booking-staff-mock";

export default function BookingSample6Page() {
  return (
    <BookingSampleShell
      sampleLabel="Sample 6"
      sampleNumber={6}
      title="Select staff"
      subtitle="Portrait rows with pink Book button."
    >
      <BookingSamplePortrait
        staff={bookingStaffMock}
        buttonTone="pink"
        buttonVariant="full"
      />
    </BookingSampleShell>
  );
}
