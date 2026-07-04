import {
  BookingSamplePortrait,
  BookingSampleShell,
} from "@/features/booking/components/samples";

export default function BookingSample6Page() {
  return (
    <BookingSampleShell
      sampleLabel="Sample 6"
      sampleNumber={6}
      title="Select staff"
      subtitle="Portrait rows with pink Book button."
    >
      <BookingSamplePortrait buttonTone="pink" buttonVariant="full" />
    </BookingSampleShell>
  );
}
