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

-- 5. Verify
select slug, display_name, is_active from public.tenants;
