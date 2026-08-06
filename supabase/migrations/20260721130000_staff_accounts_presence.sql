-- Track staff login presence for admin staff list (Online / Offline).
alter table public.staff_accounts
  add column if not exists last_seen_at timestamptz,
  add column if not exists session_started_at timestamptz;

create index if not exists staff_accounts_presence_idx
  on public.staff_accounts (tenant_id, last_seen_at desc)
  where last_seen_at is not null;
