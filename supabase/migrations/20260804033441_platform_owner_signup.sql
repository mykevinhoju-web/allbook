-- Platform owner signup: profiles + tenant memberships (free trial accounts)

create table if not exists public.platform_owner_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_owner_profiles_email_idx
  on public.platform_owner_profiles (lower(email));

create table if not exists public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner'
    check (role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  unique (tenant_id, auth_user_id)
);

create index if not exists tenant_memberships_auth_user_idx
  on public.tenant_memberships (auth_user_id);

create index if not exists tenant_memberships_tenant_idx
  on public.tenant_memberships (tenant_id);

alter table public.platform_owner_profiles enable row level security;
alter table public.tenant_memberships enable row level security;

-- Service-role APIs only; deny PostgREST access for anon/authenticated.
comment on table public.platform_owner_profiles is
  'Owner profile for AllBook platform free-trial signup (linked to auth.users).';
comment on table public.tenant_memberships is
  'Links auth users to tenants they own or administer.';
