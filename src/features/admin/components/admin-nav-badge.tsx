import { cn } from "@/lib/utils";

export function formatAdminNavBadgeCount(count: number): string {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
}

/** Small red count pill for admin nav (sidebar / bottom tabs). */
export function AdminNavBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  const label = formatAdminNavBadgeCount(count);
  if (!label) return null;

  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums shadow-sm",
        className,
      )}
      aria-label={`${count} new booking${count === 1 ? "" : "s"}`}
    >
      {label}
    </span>
  );
}
