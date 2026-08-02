import { Plus_Jakarta_Sans } from "next/font/google";

import { LandingSamplePulse } from "@/features/platform-landing";

const pulse = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-landing-pulse",
  display: "swap",
});

/** Platform apex landing (allbook.com.au) — Pulse design. */
export function PlatformLandingPage() {
  return (
    <div className={pulse.variable}>
      <LandingSamplePulse mode="live" />
    </div>
  );
}
