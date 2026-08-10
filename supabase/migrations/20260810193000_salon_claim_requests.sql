-- Ownership claim applications: register against an existing (or new hidden) salon.
-- salon_owners is created only after platform admin approval.

create table if not exists public.salon_claim_requests (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  auth_user_id uuid not null,
  full_name text not null,
  email text not null,
  password_hash text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  match_reasons text[] not null default '{}',
  created_new_salon boolean not null default false,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  updated_at timestamptz not null default now()
);

create unique index if not exists salon_claim_requests_pending_salon_uidx
  on public.salon_claim_requests (salon_id)
  where status = 'pending';

create unique index if not exists salon_claim_requests_pending_email_uidx
  on public.salon_claim_requests (lower(email))
  where status = 'pending';

create index if not exists salon_claim_requests_status_idx
  on public.salon_claim_requests (status, created_at desc);

create index if not exists salon_claim_requests_auth_user_idx
  on public.salon_claim_requests (auth_user_id);

comment on table public.salon_claim_requests is
  'Owner claim / registration applications. Approved requests create salon_owners; until then no owner login.';

alter table public.salon_claim_requests enable row level security;
-- Service role only (no anon policies).
