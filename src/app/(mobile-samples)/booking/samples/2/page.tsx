import {
  BookingSampleCards,
  BookingSampleShell,
} from "@/features/booking/components/samples";

export default function BookingSample2Page() {
  return (
    <BookingSampleShell
      sampleLabel="Sample 2"
      sampleNumber={2}
      title="Choose your therapist"
      subtitle="Card layout with full-width Book button."
    >
      <BookingSampleCards />
    </BookingSampleShell>
  );
}
