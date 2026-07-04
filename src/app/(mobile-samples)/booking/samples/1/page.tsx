import {
  BookingSampleList,
  BookingSampleShell,
} from "@/features/booking/components/samples";

export default function BookingSample1Page() {
  return (
    <BookingSampleShell
      sampleLabel="Sample 1"
      sampleNumber={1}
      title="Choose your therapist"
      subtitle="White & pink list — photo, name, Book."
      theme="pink"
    >
      <BookingSampleList tone="pink" />
    </BookingSampleShell>
  );
}
