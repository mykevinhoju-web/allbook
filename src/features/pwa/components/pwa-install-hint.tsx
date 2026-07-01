"use client";

import { useEffect, useState } from "react";

import { Share, Smartphone } from "lucide-react";

import { AppButton } from "@/components/common";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { isIos, isStandalonePwa } from "../register-push";
import { usePwaInstall } from "../use-pwa-install";

const DISMISS_KEY = "allbook-pwa-install-dismissed";

export function PwaInstallHint() {
  const { canInstall, install } = usePwaInstall();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!mounted || isStandalonePwa() || dismissed) {
    return null;
  }

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const handleInstallClick = async () => {
    if (isIos()) {
      setIosGuideOpen(true);
      return;
    }

    if (canInstall) {
      setInstalling(true);
      try {
        const accepted = await install();
        if (accepted) {
          dismiss();
        }
      } finally {
        setInstalling(false);
      }
      return;
    }

    setIosGuideOpen(true);
  };

  return (
    <>
      <div className="mx-4 mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
        <div className="flex items-start gap-3">
          <Share className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <p className="font-medium">Install for background alerts</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                One-time setup on this phone. After that, alerts keep working in
                the background — no need to repeat unless you delete the app.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AppButton
                type="button"
                className="h-9 rounded-lg px-3 text-sm"
                onClick={() => void handleInstallClick()}
                disabled={installing}
              >
                <Smartphone className="size-4" />
                {canInstall && !isIos()
                  ? "Install app"
                  : "Add to Home Screen"}
              </AppButton>
              <AppButton
                type="button"
                variant="ghost"
                className="h-9 rounded-lg px-3 text-sm"
                onClick={dismiss}
              >
                Later
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={iosGuideOpen} onOpenChange={setIosGuideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Home Screen</DialogTitle>
            <DialogDescription>
              iPhone does not allow a one-tap install button. Follow these steps
              in Safari — you only need to do this once on this phone.
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>
              Tap the <strong>Share</strong> button at the bottom of Safari
            </li>
            <li>
              Scroll and tap <strong>Add to Home Screen</strong>
            </li>
            <li>
              Tap <strong>Add</strong>, then open the new icon on your home
              screen
            </li>
            <li>Tap <strong>Turn on alerts</strong> inside the app</li>
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
