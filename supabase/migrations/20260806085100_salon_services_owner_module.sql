-- Salon owner services module: pricing modes, booking flags, staff assignment.
-- Domain model maps: duration → duration_minutes, display_order → sort_order.

alter table public.salon_services
  add column if not exists price_type text not null default 'fixed'
    check (price_type in ('fixed', 'from', 'range')),
  add column if not exists price_max integer
    check (price_max is null or price_max >= 0),
  add column if not exists booking_enabled boolean not null default true,
  add column if not exists featured boolean not null default false,
  add column if not exists status text not null default 'active'
    check (status in ('active', 'inactive', 'archived'));

-- Keep legacy is_active aligned with status for existing public pages.
update public.salon_services
set status = case when is_active then 'active' else 'inactive' end
where status is distinct from case when is_active then 'active' else 'inactive' end;

create index if not exists salon_services_salon_status_idx
  on public.salon_services (salon_id, status, sort_order);

create table if not exists public.salon_service_staff (
  service_id uuid not null references public.salon_services (id) on delete cascade,
  staff_id uuid not null references public.salon_staff (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (service_id, staff_id)
);

create index if not exists salon_service_staff_staff_id_idx
  on public.salon_service_staff (staff_id);

alter table public.salon_service_staff enable row level security;

drop policy if exists "Public can read salon service staff" on public.salon_service_staff;
create policy "Public can read salon service staff"
  on public.salon_service_staff for select to anon, authenticated
  using (true);

-- Public catalogue: active + booking-enabled (booking engine will filter further).
drop policy if exists "Public can read salon services" on public.salon_services;
create policy "Public can read salon services"
  on public.salon_services for select to anon, authenticated
  using (status = 'active');
