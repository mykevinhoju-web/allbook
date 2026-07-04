import {
  BookingSamplePortrait,
  BookingSampleShell,
} from "@/features/booking/components/samples";

export default function BookingSample3Page() {
  return (
    <BookingSampleShell
      sampleLabel="Sample 3"
      sampleNumber={3}
      title="Select staff"
      subtitle="Portrait-first rows with outlined Book."
    >
      <BookingSamplePortrait />
    </BookingSampleShell>
  );
}
