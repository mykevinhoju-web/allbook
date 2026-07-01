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

-- 3. Verify
select slug, display_name, is_active from public.tenants;
