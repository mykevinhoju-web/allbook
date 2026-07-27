"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PortalThemeRoot } from "@/features/portal-theme";

import { StaffShell } from "./staff-shell";

interface StaffLayoutGateProps {
  children: React.ReactNode;
}

interface StaffUser {
  role: "staff";
  loginId: string;
  name: string;
  staffId: string;
}

export function StaffLayoutGate({ children }: StaffLayoutGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/staff/login";
  const [user, setUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    if (isLoginPage) return;

    let cancelled = false;

    void (async () => {
      const response = await fetch("/api/staff/auth/me");
      const data = (await response.json()) as {
        user?: StaffUser | { role: string } | null;
      };

      if (cancelled) return;

      if (!data.user || data.user.role !== "staff" || !("staffId" in data.user)) {
        router.replace("/staff/login");
        return;
      }

      setUser(data.user);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoginPage, router]);

  return (
    <>
      <PortalThemeRoot />
      {isLoginPage ? children : <StaffShell user={user}>{children}</StaffShell>}
    </>
  );
}
