import Link from "next/link";

export default function AdminBookingsSamplesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Booking UI samples
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Experimental layouts. The live Bookings page is unchanged.
        </p>
      </div>
      <ul className="max-w-lg space-y-2">
        <li>
          <Link
            href="/admin/bookings"
            className="block rounded-2xl border border-border/50 px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to live Bookings
          </Link>
        </li>
      </ul>
    </div>
  );
}
