"use client";

import { CreditCard, DollarSign } from "lucide-react";

import { formatPriceFromCents } from "@/features/services";

export function ReportPaymentIcons({
  cashCents,
  cardCents,
  currency,
}: {
  cashCents: number;
  cardCents: number;
  currency: string;
}) {
  const showCash = cashCents > 0;
  const showCard = cardCents > 0;
  const isSplit = showCash && showCard;
  if (!showCash && !showCard) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  if (!isSplit) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {showCash ? (
          <>
            <span
              className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"
              aria-hidden
            >
              <DollarSign className="size-3.5" strokeWidth={2.5} />
            </span>
            <span className="text-sm font-medium text-foreground">Cash</span>
          </>
        ) : (
          <>
            <span
              className="inline-flex size-7 items-center justify-center rounded-full bg-sky-100 text-sky-800"
              aria-hidden
            >
              <CreditCard className="size-3.5" strokeWidth={2.5} />
            </span>
            <span className="text-sm font-medium text-foreground">Card</span>
          </>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1" title="Cash">
        <span
          className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"
          aria-label="Cash"
        >
          <DollarSign className="size-3.5" strokeWidth={2.5} />
        </span>
        <span className="text-xs font-semibold tabular-nums text-emerald-800">
          {formatPriceFromCents(cashCents, currency)}
        </span>
      </span>
      <span className="inline-flex items-center gap-1" title="Card">
        <span
          className="inline-flex size-7 items-center justify-center rounded-full bg-sky-100 text-sky-800"
          aria-label="Card"
        >
          <CreditCard className="size-3.5" strokeWidth={2.5} />
        </span>
        <span className="text-xs font-semibold tabular-nums text-sky-800">
          {formatPriceFromCents(cardCents, currency)}
        </span>
      </span>
    </span>
  );
}
