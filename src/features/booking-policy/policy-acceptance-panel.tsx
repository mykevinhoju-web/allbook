"use client";

import type { ResolvedPolicy } from "@/features/booking-policy/types";
import { cn } from "@/lib/utils";

type Props = {
  policy: ResolvedPolicy | null;
  loading?: boolean;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  className?: string;
  copy?: {
    loading?: string;
    policies?: string;
    bookingPolicy?: string;
    cancellationPolicy?: string;
    depositPolicy?: string;
    refundPolicy?: string;
    noShowPolicy?: string;
    accept?: string;
  };
};

export function PolicyAcceptancePanel({
  policy,
  loading,
  accepted,
  onAcceptedChange,
  className,
  copy,
}: Props) {
  if (loading || !policy) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-neutral-200 bg-[#FAFBFC] px-4 py-3 text-[13px] text-neutral-500",
          className,
        )}
      >
        {copy?.loading ?? "Loading booking policies…"}
      </div>
    );
  }

  const { customerSummary } = policy;

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border border-neutral-200 bg-[#FAFBFC] p-4",
        className,
      )}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
        {copy?.policies ?? "Policies"}
      </p>
      <PolicyBlock
        title={copy?.bookingPolicy ?? "Booking policy"}
        body={customerSummary.bookingPolicy}
      />
      <PolicyBlock
        title={copy?.cancellationPolicy ?? "Cancellation policy"}
        body={customerSummary.cancellationPolicy}
      />
      <PolicyBlock
        title={copy?.depositPolicy ?? "Deposit policy"}
        body={customerSummary.depositPolicy}
      />
      <PolicyBlock
        title={copy?.refundPolicy ?? "Refund policy"}
        body={customerSummary.refundPolicy}
      />
      <PolicyBlock
        title={copy?.noShowPolicy ?? "No-show policy"}
        body={customerSummary.noShowPolicy}
      />

      <label className="mt-2 flex items-start gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-[13px] text-neutral-800">
        <input
          type="checkbox"
          className="mt-0.5 size-4"
          checked={accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
        />
        <span>
          {copy?.accept ??
            "I have read and accept the booking, cancellation, deposit, and refund policies for this appointment."}
        </span>
      </label>
    </div>
  );
}

function PolicyBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-neutral-800">{title}</p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-600">
        {body}
      </p>
    </div>
  );
}
