"use client";

import { Share } from "lucide-react";

import { isIos, isStandalonePwa } from "../register-push";

export function PwaInstallHint() {
  if (typeof window === "undefined") return null;
  if (isStandalonePwa()) return null;

  return (
    <div className="mx-4 mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
      <div className="flex items-start gap-3">
        <Share className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="font-medium">Install for background alerts</p>
          {isIos() ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Safari → Share → <strong>Add to Home Screen</strong>. iOS needs
              the home screen app for alerts while texting or using other apps.
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Use the browser menu → <strong>Install app</strong> or{" "}
              <strong>Add to Home screen</strong> for reliable background
              notifications.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
