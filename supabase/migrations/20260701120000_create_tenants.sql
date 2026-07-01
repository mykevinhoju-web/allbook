-- AllBook: tenants table (multi-tenant foundation)
-- Every business entity must reference tenant_id.

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

-- Public read for active tenants (branding resolution)
create policy "tenants_public_read"
  on public.tenants
  for select
  using (is_active = true);

comment on table public.tenants is 'Multi-tenant root entity. All business data is scoped by tenant_id.';
