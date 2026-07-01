import type { Metadata } from "next";

import { TooltipProvider } from "@/components/ui/tooltip";
import { PlatformShell } from "@/features/platform";

export const metadata: Metadata = {
  title: "Platform",
  robots: { index: false, follow: false },
};

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      <PlatformShell>{children}</PlatformShell>
    </TooltipProvider>
  );
}
