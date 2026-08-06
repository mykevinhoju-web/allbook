import type { Metadata } from "next";

import { SalonRegistrationWizard } from "@/features/salon-registration/salon-registration-wizard";

export const metadata: Metadata = {
  title: "Register your salon",
  description:
    "Create your AllBook salon page — import from Google or register manually. Free to start.",
  robots: { index: true, follow: true },
};

export default function RegisterSalonPage() {
  return <SalonRegistrationWizard />;
}
