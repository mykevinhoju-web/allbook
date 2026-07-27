"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminShell } from "@/features/admin";
import { ADMIN_THEME_CLASS } from "@/features/admin/lib/admin-theme";

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
    document.documentElement.classList.add(ADMIN_THEME_CLASS);
    return () => {
      document.documentElement.classList.remove(ADMIN_THEME_CLASS);
    };
  }, []);

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

  if (isLoginPage) {
    return <>{children}</>;
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
