import { Plus_Jakarta_Sans } from "next/font/google";

import { LandingSampleVista } from "@/features/platform-landing";

const pulse = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-landing-pulse",
  display: "swap",
});

/** Platform apex landing (allbook.com.au) — Vista marketplace with hero search. */
export function PlatformLandingPage() {
  return (
    <div className={pulse.variable}>
      <LandingSampleVista mode="live" />
    </div>
  );
}
