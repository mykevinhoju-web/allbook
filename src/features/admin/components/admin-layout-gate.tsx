"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminShell } from "@/features/admin";

interface AdminLayoutGateProps {
  children: React.ReactNode;
}

interface AuthUser {
  role: "admin" | "staff";
  loginId: string;
  name: string;
}

export function AdminLayoutGate({ children }: AdminLayoutGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const response = await fetch("/api/admin/auth/me");
      const data = (await response.json()) as { user?: AuthUser | null };

      if (cancelled) return;

      if (!data.user) {
        // Drop stale cookies so middleware does not bounce login → /admin.
        await fetch("/api/admin/auth/logout", { method: "POST" }).catch(
          () => {},
        );
        await fetch("/api/staff/auth/logout", { method: "POST" }).catch(
          () => {},
        );
        router.replace("/admin/login");
        return;
      }

      if (
        data.user.role === "staff" &&
        !pathname.startsWith("/admin/bookings")
      ) {
        router.replace("/staff");
        return;
      }

      setUser(data.user);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoginPage, pathname, router]);

  return (
    <>
      {isLoginPage ? children : <AdminShell user={user}>{children}</AdminShell>}
    </>
  );
}
