"use client";

import { MapPin, PenLine } from "lucide-react";

import type { RegistrationMethod } from "@/features/salon-registration";
import { cn } from "@/lib/utils";

import { registerPrimaryButtonClass } from "./register-ui";

type RegistrationMethodProps = {
  onSelect: (method: Exclude<RegistrationMethod, "admin">) => void;
};

export function RegistrationMethod({ onSelect }: RegistrationMethodProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-2 text-center sm:text-left">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Step 1 of 6
        </p>
        <h1 className="font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">
          How would you like to register?
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-neutral-600">
          Prefer finding your salon on Google if it already exists. New listings
          and ownership claims are reviewed by AllBook before booking goes live.
        </p>
      </header>

      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] leading-relaxed text-sky-950">
        <p className="font-semibold">Verification & review</p>
        <p className="mt-1">
          After you submit, ownership stays <strong>pending</strong> until
          AllBook verifies the business. Online booking stays off until
          approved.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MethodCard
          icon={<MapPin className="size-6" strokeWidth={1.6} />}
          title="Find My Salon on Google"
          description="Claim an existing catalogue listing. Best if your salon is already on Google. Approval required before you can manage it."
          buttonLabel="Continue with Google"
          accent="from-[#E8F0FE] to-white"
          onClick={() => onSelect("google")}
        />
        <MethodCard
          icon={<PenLine className="size-6" strokeWidth={1.6} />}
          title="Register Manually"
          description="If details match an existing listing, we claim that salon instead of creating a duplicate. New salons stay hidden until approved."
          buttonLabel="Register Manually"
          accent="from-[#F3F0EA] to-white"
          onClick={() => onSelect("manual")}
        />
      </div>
    </div>
  );
}

function MethodCard({
  icon,
  title,
  description,
  buttonLabel,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-h-[280px] flex-col rounded-[28px] border border-neutral-200/80 bg-gradient-to-b p-7 text-left shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] transition duration-300",
        "hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_28px_60px_-28px_rgba(15,23,42,0.4)]",
        accent,
      )}
    >
      <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200/80 transition group-hover:scale-[1.03]">
        {icon}
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
        {title}
      </h2>
      <p className="mt-2 flex-1 text-[14px] leading-relaxed text-neutral-600">
        {description}
      </p>
      <span className={cn(registerPrimaryButtonClass, "mt-6 w-full")}>
        {buttonLabel}
      </span>
    </button>
  );
}
