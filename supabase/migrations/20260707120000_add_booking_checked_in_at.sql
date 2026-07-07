-- Staff room check-in: records when a therapist enters their assigned (or chosen) room.
alter table public.bookings
  add column if not exists checked_in_at timestamptz;

create index if not exists bookings_staff_checked_in_idx
  on public.bookings (tenant_id, staff_id, checked_in_at)
  where checked_in_at is not null and checked_out_at is null;
