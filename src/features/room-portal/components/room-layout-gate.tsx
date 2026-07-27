"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { PortalThemeRoot } from "@/features/portal-theme";

interface RoomUser {
  role: "room";
  roomId: string;
  roomName: string;
  deviceId: string;
}

const RoomSessionContext = createContext<RoomUser | null>(null);

export function useRoomSession() {
  return useContext(RoomSessionContext);
}

interface RoomLayoutGateProps {
  children: React.ReactNode;
}

export function RoomLayoutGate({ children }: RoomLayoutGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/room/login";
  const [ready, setReady] = useState(isLoginPage);
  const [room, setRoom] = useState<RoomUser | null>(null);

  useEffect(() => {
    if (isLoginPage) {
      setReady(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/room/me");
      const data = (await response.json()) as {
        user?: RoomUser | null;
      };

      if (cancelled) return;

      if (!response.ok || !data.user) {
        router.replace("/room/login");
        return;
      }

      setRoom(data.user);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoginPage, router]);

  const sessionValue = useMemo(() => room, [room]);

  return (
    <>
      <PortalThemeRoot fetchFrom="/api/room/theme" />
      {!ready && !isLoginPage ? (
        <div className="flex min-h-svh items-center justify-center bg-background text-sm text-muted-foreground">
          Loading room…
        </div>
      ) : isLoginPage ? (
        children
      ) : (
        <RoomSessionContext.Provider value={sessionValue}>
          <div className="min-h-svh touch-manipulation bg-background text-foreground select-none">
            <div className="mx-auto w-full max-w-6xl px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6 md:px-8 md:py-8">
              {children}
            </div>
          </div>
        </RoomSessionContext.Provider>
      )}
    </>
  );
}
