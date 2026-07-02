-- Admin login accounts per tenant
create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  login_id text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, login_id)
);

create index if not exists admin_accounts_tenant_idx
  on public.admin_accounts (tenant_id, login_id);

alter table public.admin_accounts enable row level security;

drop policy if exists "admin_accounts_all" on public.admin_accounts;
create policy "admin_accounts_all"
  on public.admin_accounts for all
  to anon, authenticated
  using (true) with check (true);
