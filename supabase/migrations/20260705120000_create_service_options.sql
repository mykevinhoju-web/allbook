-- Service duration + price options per tenant
create table if not exists public.service_options (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  duration_minutes int not null check (duration_minutes > 0),
  price_cents int not null check (price_cents >= 0),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, duration_minutes)
);

create index if not exists service_options_tenant_idx
  on public.service_options (tenant_id, sort_order);

alter table public.service_options enable row level security;

drop policy if exists "service_options_all" on public.service_options;
create policy "service_options_all"
  on public.service_options for all to anon, authenticated
  using (true) with check (true);

alter table public.bookings
  add column if not exists price_cents int not null default 0 check (price_cents >= 0);

-- DaySpa default pricing
insert into public.service_options (tenant_id, duration_minutes, price_cents, sort_order)
select t.id, v.duration_minutes, v.price_cents, v.sort_order
from public.tenants t
cross join (
  values
    (20, 3000, 1),
    (30, 4500, 2),
    (45, 6500, 3),
    (60, 10000, 4)
) as v(duration_minutes, price_cents, sort_order)
where t.slug = 'dayspa'
  and not exists (
    select 1 from public.service_options s where s.tenant_id = t.id
  );
