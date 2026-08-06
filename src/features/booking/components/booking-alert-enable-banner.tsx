"use client";

import { useEffect, useState } from "react";
import { BellRing, Smartphone } from "lucide-react";

import { AppButton } from "@/components/common";
import { isIos, isStandalonePwa } from "@/features/pwa";

interface BookingAlertEnableBannerProps {
  onEnable: () => void;
}

export function BookingAlertEnableBanner({
  onEnable,
}: BookingAlertEnableBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [needsHomeScreen, setNeedsHomeScreen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNeedsHomeScreen(!isStandalonePwa() && isIos());
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-4">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border/60 bg-card p-4 shadow-soft-lg ring-1 ring-black/5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {needsHomeScreen ? (
              <Smartphone className="size-5" />
            ) : (
              <BellRing className="size-5" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {needsHomeScreen
                ? "Step 2: turn on booking alert sound"
                : "Turn on booking alert sound"}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {needsHomeScreen ? (
                <>
                  Finish the Home Screen tip at the top first, open Admin from
                  that icon, then tap below. On-screen booking messages already
                  work; this adds sound and background push.
                </>
              ) : (
                <>
                  On-screen “New booking” messages already work on every Admin
                  page. Tap to also enable sound and push when the app is in the
                  background.
                </>
              )}
            </p>
          </div>
        </div>
        <AppButton
          type="button"
          className="mt-4 h-11 w-full rounded-xl text-base"
          onClick={onEnable}
        >
          Turn on alerts
        </AppButton>
      </div>
    </div>
  );
}
