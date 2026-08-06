"use client";

import { useEffect, useState } from "react";
import { Share, Smartphone, X } from "lucide-react";

import { AppButton } from "@/components/common";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  isIos,
  isStandalonePwa,
  usePwaInstall,
} from "@/features/pwa";

const DISMISS_KEY = "allbook-pwa-install-dismissed";

/**
 * Sticky speech-bubble under the admin header: add to Home Screen first
 * so background push alerts can work.
 */
export function AdminPwaInstallBubble() {
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
      <div className="relative z-20 border-b border-border/60 bg-background px-3 pb-3 pt-1 sm:px-4">
        <div className="relative mx-auto max-w-lg rounded-2xl border border-primary/25 bg-card px-3.5 py-3 shadow-md ring-1 ring-primary/10">
          {/* Speech-bubble tip pointing up toward the header */}
          <div
            aria-hidden
            className="absolute -top-1.5 right-10 size-3 rotate-45 border-l border-t border-primary/25 bg-card sm:right-14"
          />

          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="pr-6">
                <p className="text-sm font-semibold text-foreground">
                  First: add Admin to Home Screen
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Open AllBook from that icon, then turn on alerts. That is how
                  you get sound and messages when a booking comes in — even if
                  you leave this tab.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AppButton
                  type="button"
                  size="sm"
                  className="h-9 rounded-xl px-3 text-sm"
                  onClick={() => void handleInstallClick()}
                  disabled={installing}
                >
                  <Share className="size-3.5" />
                  {canInstall && !isIos()
                    ? "Install app"
                    : "How to add"}
                </AppButton>
                <AppButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-xl px-3 text-sm text-muted-foreground"
                  onClick={dismiss}
                >
                  Later
                </AppButton>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-2.5 top-2.5 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={iosGuideOpen} onOpenChange={setIosGuideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Home Screen</DialogTitle>
            <DialogDescription>
              Do this once on this phone, then always open Admin from the new
              icon. After that, turn on alerts inside the app.
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>
              Tap the <strong>Share</strong> button
              {isIos() ? " at the bottom of Safari" : " in the browser menu"}
            </li>
            <li>
              Scroll and tap <strong>Add to Home Screen</strong>
            </li>
            <li>
              Tap <strong>Add</strong>, then open the new icon
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
