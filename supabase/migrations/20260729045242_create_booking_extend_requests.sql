-- Pending room-tablet extend requests awaiting admin cash/card approval.

create table if not exists public.booking_extend_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  requested_by_staff_id uuid not null references public.staff (id) on delete cascade,
  minutes integer not null check (minutes > 0),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  payment_method text check (payment_method is null or payment_method in ('cash', 'card')),
  price_cents integer,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists booking_extend_requests_tenant_pending_idx
  on public.booking_extend_requests (tenant_id, created_at desc)
  where status = 'pending';

create index if not exists booking_extend_requests_booking_pending_idx
  on public.booking_extend_requests (booking_id)
  where status = 'pending';

-- Only one pending extend per booking at a time.
create unique index if not exists booking_extend_requests_one_pending_per_booking_idx
  on public.booking_extend_requests (booking_id)
  where status = 'pending';

alter table public.booking_extend_requests enable row level security;
