"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { EverLogo } from "./ever-logo";
import { EVER_BRAND } from "../theme";

/**
 * Ever index — Verdant night background + brand logo while the full landing ships.
 */
export function EverUnderConstruction() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "ever-home min-h-svh bg-[#121814] text-[#E9EDE8]",
        "font-[family-name:var(--font-ever-verdant-body)]",
      )}
      data-ready={ready ? "true" : "false"}
    >
      <style jsx global>{`
        @keyframes ever-rise {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .ever-home [data-rise] {
          opacity: 0;
        }
        .ever-home[data-ready="true"] [data-rise] {
          animation: ever-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .ever-home[data-ready="true"] [data-rise="1"] {
          animation-delay: 0.06s;
        }
        .ever-home[data-ready="true"] [data-rise="2"] {
          animation-delay: 0.2s;
        }
        .ever-home[data-ready="true"] [data-rise="3"] {
          animation-delay: 0.34s;
        }
      `}</style>

      <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-16 text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[#121814]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(196,168,98,0.14),transparent_58%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(27,46,38,0.55),transparent_45%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121814] via-transparent to-[#121814]/60" />
        </div>

        <div data-rise="1" className="mx-auto max-w-[min(100%,280px)] sm:max-w-xs">
          <EverLogo href={undefined} width={260} priority className="mx-auto shadow-black/25" />
        </div>

        <h1
          data-rise="2"
          className="mt-10 font-[family-name:var(--font-ever-verdant-display)] text-2xl tracking-tight text-[#E9EDE8] sm:text-3xl"
        >
          Under construction
        </h1>
        <p
          data-rise="3"
          className="mt-4 max-w-sm text-[15px] leading-relaxed"
          style={{ color: EVER_BRAND.textMuted }}
        >
          We&apos;re preparing something calm and beautiful. Please check back
          soon.
        </p>
      </div>
    </div>
  );
}
