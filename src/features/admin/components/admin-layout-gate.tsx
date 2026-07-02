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
  const [checked, setChecked] = useState(isLoginPage);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true);
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
        router.replace("/admin/bookings");
        return;
      }

      setUser(data.user);
      setChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoginPage, pathname, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!checked) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
