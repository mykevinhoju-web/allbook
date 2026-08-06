import { cn } from "@/lib/utils";

export const registerFieldClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[15px] text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-950/5";

export const registerLabelClass =
  "mb-1.5 block text-[13px] font-medium text-neutral-700";

export const registerHintClass = "mt-1.5 text-[12px] text-neutral-500";

export const registerPrimaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-6 text-[14px] font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50";

export const registerSecondaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-6 text-[14px] font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50";

export function RegisterField({
  label,
  htmlFor,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <label htmlFor={htmlFor} className={registerLabelClass}>
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </label>
      {children}
      {hint ? <p className={registerHintClass}>{hint}</p> : null}
    </div>
  );
}
