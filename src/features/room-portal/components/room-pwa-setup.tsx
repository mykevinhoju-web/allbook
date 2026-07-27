"use client";

import { useEffect, useState } from "react";
import { BellRing, Share, Smartphone } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  isIos,
  isPushSupported,
  isStandalonePwa,
  subscribeToWebPush,
  usePwaInstall,
} from "@/features/pwa";
import { useTenant } from "@/features/tenants";

const LATER_KEY = "allbook-room-pwa-install-later";
const ALERTS_KEY = "allbook-room-alerts-enabled";

/**
 * Room tablets need Home Screen install first so background alerts can work.
 * Show install before PIN; after install, prompt to turn on alerts.
 */
export function RoomPwaSetup() {
  const tenant = useTenant();
  const { canInstall, install } = usePwaInstall();
  const [mounted, setMounted] = useState(false);
  const [later, setLater] = useState(false);
  const [alertsOn, setAlertsOn] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [enablingAlerts, setEnablingAlerts] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLater(window.sessionStorage.getItem(LATER_KEY) === "1");
    setAlertsOn(window.localStorage.getItem(ALERTS_KEY) === "1");
  }, []);

  if (!mounted) return null;

  const standalone = isStandalonePwa();

  const markLater = () => {
    window.sessionStorage.setItem(LATER_KEY, "1");
    setLater(true);
  };

  const handleInstallClick = async () => {
    if (isIos()) {
      setIosGuideOpen(true);
      return;
    }

    if (canInstall) {
      setInstalling(true);
      try {
        await install();
      } finally {
        setInstalling(false);
      }
      return;
    }

    setIosGuideOpen(true);
  };

  const handleEnableAlerts = async () => {
    if (!isPushSupported()) {
      toast.error("This tablet browser does not support alerts.");
      return;
    }
    setEnablingAlerts(true);
    try {
      await subscribeToWebPush(tenant.slug);
      window.localStorage.setItem(ALERTS_KEY, "1");
      setAlertsOn(true);
      toast.success("Alerts on for this room tablet");
    } catch (error) {
      toast.error("Could not enable alerts", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setEnablingAlerts(false);
    }
  };

  // Already set up
  if (standalone && alertsOn) return null;

  // Step 2: alerts (after Home Screen install)
  if (standalone && !alertsOn) {
    return (
      <div className="mb-5 rounded-3xl border border-[#9B5BAF]/30 bg-card p-5 shadow-sm ring-1 ring-[#9B5BAF]/10 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#9B5BAF]/10 text-[#9B5BAF]">
            <BellRing className="size-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-base font-semibold text-foreground md:text-lg">
              Step 2: turn on room alerts
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              So this tablet can notify when service time ends ??even if the
              screen is locked or the app is in the background.
            </p>
          </div>
        </div>
        <AppButton
          type="button"
          className="mt-4 h-14 w-full rounded-2xl bg-[#9B5BAF] text-base hover:bg-[#8A4F9C] md:h-16 md:text-lg"
          disabled={enablingAlerts}
          onClick={() => void handleEnableAlerts()}
        >
          {enablingAlerts ? "Enabling?? : "Turn on alerts"}
        </AppButton>
      </div>
    );
  }

  // Step 1: install (skipped for this session only if Later)
  if (later) return null;

  return (
    <>
      <div className="mb-5 rounded-3xl border border-[#9B5BAF]/30 bg-card p-5 shadow-sm ring-1 ring-[#9B5BAF]/10 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#9B5BAF]/10 text-[#9B5BAF]">
            <Smartphone className="size-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-base font-semibold text-foreground md:text-lg">
              First: add to Home Screen
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Install this Room app on the tablet, then always open it from
              that icon. That is how service-end alerts can reach this room
              reliably.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <AppButton
            type="button"
            className="h-14 flex-1 rounded-2xl bg-[#9B5BAF] text-base hover:bg-[#8A4F9C] md:h-16 md:text-lg"
            disabled={installing}
            onClick={() => void handleInstallClick()}
          >
            <Share className="size-5" />
            {canInstall && !isIos() ? "Install app" : "How to add"}
          </AppButton>
          <AppButton
            type="button"
            variant="ghost"
            className="h-14 rounded-2xl px-4 text-base text-muted-foreground md:h-16"
            onClick={markLater}
          >
            Later
          </AppButton>
        </div>
      </div>

      <Dialog open={iosGuideOpen} onOpenChange={setIosGuideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Room to Home Screen</DialogTitle>
            <DialogDescription>
              Do this once on this tablet, then always open Room from the new
              icon before staff use the PIN pad.
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>
              Tap the <strong>Share</strong> or browser menu button
            </li>
            <li>
              Tap <strong>Add to Home Screen</strong>
            </li>
            <li>
              Tap <strong>Add</strong>, then open the new <strong>Room</strong>{" "}
              icon
            </li>
            <li>
              Inside the app, tap <strong>Turn on alerts</strong>
            </li>
          </ol>
          <AppButton
            type="button"
            className="mt-2 h-10 w-full rounded-xl"
            onClick={() => setIosGuideOpen(false)}
          >
            Got it
          </AppButton>
        </DialogContent>
      </Dialog>
    </>
  );
}
