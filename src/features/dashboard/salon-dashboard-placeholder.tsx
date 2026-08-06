import Link from "next/link";

type SalonDashboardPlaceholderProps = {
  title: string;
  description: string;
};

export function SalonDashboardPlaceholder({
  title,
  description,
}: SalonDashboardPlaceholderProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[28px] border border-neutral-200/80 bg-white p-8 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] sm:p-10">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Coming soon
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-950">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-600">
          {description}
        </p>
        <Link
          href="/platform/salon"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white transition hover:bg-neutral-800"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
