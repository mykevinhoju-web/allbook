"use client";

import { BellRing } from "lucide-react";

import { AppButton } from "@/components/common";

interface BookingAlertEnableBannerProps {
  onEnable: () => void;
}

export function BookingAlertEnableBanner({
  onEnable,
}: BookingAlertEnableBannerProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border/60 bg-card p-4 shadow-soft-lg ring-1 ring-black/5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BellRing className="size-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Enable booking alerts
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Enables push notifications and sound. On iPhone, also add this app
              to your Home Screen for alerts while using other apps.
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
