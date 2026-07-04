-- Scale: hot-path indexes + prevent double-booking under concurrency.
-- Safe for existing data if no active overlaps exist.

create extension if not exists btree_gist;

-- Conflict / availability lookups (exclude cancelled)
create index if not exists bookings_tenant_staff_active_starts_idx
  on public.bookings (tenant_id, staff_id, starts_at)
  where status <> 'cancelled';

create index if not exists bookings_staff_active_range_idx
  on public.bookings (staff_id, starts_at, ends_at)
  where status <> 'cancelled';

create index if not exists bookings_room_active_range_idx
  on public.bookings (room_id, starts_at, ends_at)
  where status <> 'cancelled' and room_id is not null;

-- Push fan-out filters
create index if not exists push_subscriptions_tenant_audience_idx
  on public.push_subscriptions (tenant_slug, audience);

create index if not exists push_subscriptions_tenant_staff_idx
  on public.push_subscriptions (tenant_slug, staff_id)
  where staff_id is not null;

-- Tenant resolution (active only)
create index if not exists tenants_slug_active_idx
  on public.tenants (slug)
  where is_active = true;

-- Hard guarantee: no overlapping active bookings for the same staff
do $$
begin
  alter table public.bookings
    add constraint bookings_staff_no_overlap
    exclude using gist (
      staff_id with =,
      tstzrange(starts_at, ends_at, '[)') with &&
    )
    where (status is distinct from 'cancelled');
exception
  when duplicate_object then null;
  when exclusion_violation then
    raise notice 'bookings_staff_no_overlap skipped: existing overlapping active bookings';
end $$;

-- Hard guarantee: no overlapping active bookings for the same room
do $$
begin
  alter table public.bookings
    add constraint bookings_room_no_overlap
    exclude using gist (
      room_id with =,
      tstzrange(starts_at, ends_at, '[)') with &&
    )
    where (status is distinct from 'cancelled' and room_id is not null);
exception
  when duplicate_object then null;
  when exclusion_violation then
    raise notice 'bookings_room_no_overlap skipped: existing overlapping active room bookings';
end $$;
