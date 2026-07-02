-- AllBook setup: run once in Supabase SQL Editor
-- Dashboard → SQL Editor → New query → Paste → Run

-- 1. Tenants table
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  display_name text not null,
  tagline text,
  logo_url text,
  primary_domain text,
  timezone text not null default 'Australia/Sydney',
  currency text not null default 'AUD',
  locale text not null default 'en-AU',
  is_active boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenants_slug_idx on public.tenants (slug);
create index if not exists tenants_is_active_idx on public.tenants (is_active);

alter table public.tenants enable row level security;

drop policy if exists "tenants_public_read" on public.tenants;
create policy "tenants_public_read"
  on public.tenants
  for select
  using (is_active = true);

-- 2. DaySpa seed (first tenant)
insert into public.tenants (
  slug,
  name,
  display_name,
  tagline,
  primary_domain,
  timezone,
  currency,
  locale,
  is_active
)
values (
  'dayspa',
  'DaySpa',
  'DaySpa',
  'Premium day spa and massage bookings in Sydney.',
  'dayspa.allbook.com.au',
  'Australia/Sydney',
  'AUD',
  'en-AU',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  display_name = excluded.display_name,
  tagline = excluded.tagline,
  primary_domain = excluded.primary_domain,
  updated_at = now();

-- 3. Booking alert events (realtime admin notifications)
create table if not exists public.booking_alert_events (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null,
  staff_id text not null,
  staff_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists booking_alert_events_tenant_slug_idx
  on public.booking_alert_events (tenant_slug, created_at desc);

alter table public.booking_alert_events enable row level security;

drop policy if exists "booking_alerts_insert" on public.booking_alert_events;
create policy "booking_alerts_insert"
  on public.booking_alert_events
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "booking_alerts_select" on public.booking_alert_events;
create policy "booking_alerts_select"
  on public.booking_alert_events
  for select
  to anon, authenticated
  using (true);

do $$
begin
  alter publication supabase_realtime add table public.booking_alert_events;
exception
  when duplicate_object then null;
end $$;

-- 4. Push subscriptions (PWA Web Push)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_tenant_slug_idx
  on public.push_subscriptions (tenant_slug);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_insert" on public.push_subscriptions;
create policy "push_subscriptions_insert"
  on public.push_subscriptions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "push_subscriptions_select" on public.push_subscriptions;
create policy "push_subscriptions_select"
  on public.push_subscriptions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "push_subscriptions_delete" on public.push_subscriptions;
create policy "push_subscriptions_delete"
  on public.push_subscriptions
  for delete
  to anon, authenticated
  using (true);

-- 6. Operations (staff, rooms, bookings)
-- Staff profiles
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'on_leave')),
  attributes jsonb not null default '{}'::jsonb,
  working_days text[] not null default array['mon','tue','wed','thu','fri'],
  working_hours_start time not null default '09:00',
  working_hours_end time not null default '18:00',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_tenant_id_idx on public.staff (tenant_id, sort_order);
create index if not exists staff_tenant_status_idx on public.staff (tenant_id, status);

create table if not exists public.staff_photos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists staff_photos_staff_id_idx
  on public.staff_photos (staff_id, sort_order);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rooms_tenant_id_idx on public.rooms (tenant_id, sort_order);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete restrict,
  room_id uuid references public.rooms (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes int not null check (duration_minutes > 0),
  price_cents int not null default 0 check (price_cents >= 0),
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  customer_name text,
  customer_phone text,
  customer_postcode text,
  customer_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists bookings_tenant_starts_idx
  on public.bookings (tenant_id, starts_at);
create index if not exists bookings_staff_starts_idx
  on public.bookings (staff_id, starts_at);
create index if not exists bookings_room_starts_idx
  on public.bookings (room_id, starts_at);

alter table public.staff enable row level security;
alter table public.staff_photos enable row level security;
alter table public.rooms enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "staff_all" on public.staff;
create policy "staff_all" on public.staff for all to anon, authenticated using (true) with check (true);

drop policy if exists "staff_photos_all" on public.staff_photos;
create policy "staff_photos_all" on public.staff_photos for all to anon, authenticated using (true) with check (true);

drop policy if exists "rooms_all" on public.rooms;
create policy "rooms_all" on public.rooms for all to anon, authenticated using (true) with check (true);

drop policy if exists "bookings_all" on public.bookings;
create policy "bookings_all" on public.bookings for all to anon, authenticated using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table public.bookings;
exception
  when duplicate_object then null;
end $$;

insert into public.rooms (tenant_id, name, sort_order)
select t.id, 'Room ' || n.num, n.num
from public.tenants t
cross join generate_series(1, 6) as n(num)
where t.slug = 'dayspa'
  and not exists (select 1 from public.rooms r where r.tenant_id = t.id);

insert into storage.buckets (id, name, public)
values ('staff-photos', 'staff-photos', true)
on conflict (id) do nothing;

drop policy if exists "staff_photos_storage_select" on storage.objects;
create policy "staff_photos_storage_select"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'staff-photos');

drop policy if exists "staff_photos_storage_insert" on storage.objects;
create policy "staff_photos_storage_insert"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'staff-photos');

drop policy if exists "staff_photos_storage_delete" on storage.objects;
create policy "staff_photos_storage_delete"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'staff-photos');

alter table public.bookings
  add column if not exists customer_postcode text,
  add column if not exists customer_email text;

alter table public.bookings
  add column if not exists price_cents int not null default 0 check (price_cents >= 0);

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

-- 7. Verify
select slug, display_name, is_active from public.tenants;
