import {
  BookingSampleShell,
  BookingSampleVelvet,
} from "@/features/booking/components/samples";

export default function BookingSample5Page() {
  return (
    <BookingSampleShell
      theme="dark"
      sampleLabel="Sample 5 — Velvet"
      sampleNumber={5}
      title="Velvet lounge"
      subtitle="Soft glow rows · after-hours mood."
    >
      <BookingSampleVelvet />
    </BookingSampleShell>
  );
}
