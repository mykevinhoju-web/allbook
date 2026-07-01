import type { Metadata } from "next";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminShell } from "@/features/admin";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      <AdminShell>{children}</AdminShell>
    </TooltipProvider>
  );
}
