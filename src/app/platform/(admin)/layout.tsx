import { redirect } from "next/navigation";

import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";

/** Server gate for AllBook Admin pages (not /platform/login). */
export default async function PlatformAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    await requirePlatformAdmin();
  } catch (error) {
    if (error instanceof PlatformAuthError && error.status === 403) {
      redirect("/platform/login?error=not_admin");
    }
    redirect("/platform/login");
  }

  return children;
}
