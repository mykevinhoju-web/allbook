import {
  BookingSampleNoir,
  BookingSampleShell,
} from "@/features/booking/components/samples";

export default function BookingSample4Page() {
  return (
    <BookingSampleShell
      theme="dark"
      sampleLabel="Sample 4 — Noir"
      sampleNumber={4}
      title="Private evening"
      subtitle="Cinematic portraits · discreet reserve."
    >
      <BookingSampleNoir />
    </BookingSampleShell>
  );
}
