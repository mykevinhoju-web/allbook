import type { Metadata } from "next";

import { PlatformSignupForm } from "@/features/platform-auth";

export const metadata: Metadata = {
  title: "Complete signup",
  robots: { index: false, follow: false },
};

export default async function SignupCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; name?: string; phone?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#F4F0EA]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.9),_transparent_55%)]" />
      <div className="relative mx-auto flex min-h-svh max-w-lg items-center px-6 py-12">
        <PlatformSignupForm
          mode="complete"
          initial={{
            email: params.email ?? "",
            fullName: params.name ?? "",
            phone: params.phone ?? "",
          }}
        />
      </div>
    </div>
  );
}
