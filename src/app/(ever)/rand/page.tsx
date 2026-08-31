import type { Metadata } from "next";

import { EverHomePage } from "@/features/ever";
import { requireEverTenant } from "@/features/ever/server/require-ever-tenant";

export const metadata: Metadata = {
  title: "Everwell Massage — WIP landing",
  description:
    "Work-in-progress marketing site for Everwell Massage, Brisbane.",
  robots: { index: false, follow: false },
};

/** WIP full landing — not linked from public index until launch. */
export default async function EverRandLandingPage() {
  await requireEverTenant();
  return <EverHomePage />;
}
