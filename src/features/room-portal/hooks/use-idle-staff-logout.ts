"use client";

import { useEffect, useRef } from "react";

const IDLE_MS = 5 * 60_000;

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "click",
  "scroll",
] as const;

/** Fire `onIdle` after 5 minutes with no user input. */
export function useIdleStaffLogout(args: {
  enabled: boolean;
  onIdle: () => void;
}) {
  const onIdleRef = useRef(args.onIdle);
  onIdleRef.current = args.onIdle;

  useEffect(() => {
    if (!args.enabled) return;

    let timer: number | null = null;
    const arm = () => {
      if (timer != null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        onIdleRef.current();
      }, IDLE_MS);
    };

    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, arm, { capture: true, passive: true });
    }
    arm();

    return () => {
      if (timer != null) window.clearTimeout(timer);
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, arm, { capture: true });
      }
    };
  }, [args.enabled]);
}
