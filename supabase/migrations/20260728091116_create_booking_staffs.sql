-- Multi-staff bookings: primary stays on bookings.staff_id;
-- additional staff (e.g. room tablet join) live in booking_staffs.

create table if not exists public.booking_staffs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (booking_id, staff_id)
);

create index if not exists booking_staffs_staff_time_idx
  on public.booking_staffs (tenant_id, staff_id);

create index if not exists booking_staffs_booking_idx
  on public.booking_staffs (booking_id);

-- Backfill primary staff for existing bookings.
insert into public.booking_staffs (tenant_id, booking_id, staff_id, is_primary)
select b.tenant_id, b.id, b.staff_id, true
from public.bookings b
on conflict (booking_id, staff_id) do nothing;

alter table public.booking_staffs enable row level security;

-- Server routes use service role (bypasses RLS). No anon policies.
