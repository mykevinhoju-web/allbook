-- Ever (Everwell Massage) — simple site booking requests (no staff/room engine).

create table if not exists public.ever_services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  duration_minutes int not null default 60 check (duration_minutes > 0),
  price_cents int check (price_cents is null or price_cents >= 0),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ever_services_tenant_idx
  on public.ever_services (tenant_id, sort_order);

create table if not exists public.ever_site_bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  service_id uuid not null references public.ever_services (id) on delete restrict,
  starts_at timestamptz not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  customer_postcode text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ever_site_bookings_tenant_starts_idx
  on public.ever_site_bookings (tenant_id, starts_at desc);

create index if not exists ever_site_bookings_tenant_status_idx
  on public.ever_site_bookings (tenant_id, status, created_at desc);

alter table public.ever_services enable row level security;
alter table public.ever_site_bookings enable row level security;

drop policy if exists "ever_services_all" on public.ever_services;
create policy "ever_services_all"
  on public.ever_services for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "ever_site_bookings_all" on public.ever_site_bookings;
create policy "ever_site_bookings_all"
  on public.ever_site_bookings for all to anon, authenticated
  using (true) with check (true);

-- Default Ever services
insert into public.ever_services (tenant_id, name, duration_minutes, price_cents, sort_order)
select t.id, v.name, v.duration_minutes, v.price_cents, v.sort_order
from public.tenants t
cross join (
  values
    ('Relaxation Massage', 60, 9000, 1),
    ('Deep Tissue Massage', 60, 10000, 2),
    ('Hot Stone Massage', 90, 12000, 3)
) as v(name, duration_minutes, price_cents, sort_order)
where t.slug = 'everwellmassage'
  and not exists (
    select 1 from public.ever_services s where s.tenant_id = t.id
  );
