-- Staff keep amount per service duration, snapshotted onto bookings at price time.
alter table public.service_options
  add column if not exists staff_payout_cents int not null default 0
  check (staff_payout_cents >= 0);

alter table public.bookings
  add column if not exists staff_payout_cents int
  check (staff_payout_cents is null or staff_payout_cents >= 0);

comment on column public.service_options.staff_payout_cents is
  'Amount the assigned staff keeps for this duration option (cents).';

comment on column public.bookings.staff_payout_cents is
  'Staff keep amount snapshotted when the booking price was set. Null uses current service_options.';
