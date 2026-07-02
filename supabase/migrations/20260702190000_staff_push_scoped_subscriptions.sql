-- Scope push subscriptions to admin vs staff, and add staff login accounts.

-- 1) Push subscriptions: add audience and optional staff_id
alter table public.push_subscriptions
  add column if not exists audience text not null default 'admin'
    check (audience in ('admin', 'staff')),
  add column if not exists staff_id uuid null references public.staff (id) on delete cascade;

create index if not exists push_subscriptions_tenant_audience_idx
  on public.push_subscriptions (tenant_slug, audience);

create index if not exists push_subscriptions_staff_idx
  on public.push_subscriptions (staff_id);

-- 2) Staff accounts: admin assigns login id + password
create table if not exists public.staff_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  login_id text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, login_id),
  unique (staff_id)
);

create index if not exists staff_accounts_tenant_idx
  on public.staff_accounts (tenant_id, login_id);

alter table public.staff_accounts enable row level security;

drop policy if exists "staff_accounts_admin_only" on public.staff_accounts;
create policy "staff_accounts_admin_only"
  on public.staff_accounts for all
  to anon, authenticated
  using (true) with check (true);

