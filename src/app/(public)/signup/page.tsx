import type { Metadata } from "next";

import { PlatformSignupForm } from "@/features/platform-auth";

export const metadata: Metadata = {
  title: "Start free trial",
  description:
    "Create your AllBook account free — name, contact, business details, and email. No password required.",
  robots: { index: true, follow: true },
};

export default function SignupPage() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-[#F4F0EA]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.9),_transparent_55%)]" />
      <div className="relative mx-auto flex min-h-svh max-w-lg items-center px-6 py-12">
        <PlatformSignupForm />
      </div>
    </div>
  );
}
