import { cn } from "@/lib/utils";

export function ReportBookingTypeBadge({ walkIn }: { walkIn: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        walkIn
          ? "bg-blue-100 text-blue-800"
          : "bg-orange-100 text-orange-900",
      )}
    >
      {walkIn ? "Walk-in" : "Booking"}
    </span>
  );
}
