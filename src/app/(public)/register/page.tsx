import type { Metadata } from "next";

import { SalonRegistrationWizard } from "@/features/salon-registration/salon-registration-wizard";
import { isPrivatePreviewEnabled } from "@/features/private-preview";

export const metadata: Metadata = {
  title: "Register your salon",
  description:
    "Create your AllBook salon page — import from Google or register manually. Free to start.",
  robots: isPrivatePreviewEnabled()
    ? { index: false, follow: false }
    : { index: true, follow: true },
};

export default function RegisterSalonPage() {
  return <SalonRegistrationWizard />;
}
