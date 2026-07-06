-- Requires public.bookings (run supabase/setup.sql or migration 20260703120000 first).
-- Staff early checkout: frees the room before scheduled ends_at.
alter table public.bookings
  add column if not exists checked_out_at timestamptz;

create index if not exists bookings_room_active_idx
  on public.bookings (tenant_id, room_id, ends_at)
  where room_id is not null and status not in ('cancelled', 'completed');
