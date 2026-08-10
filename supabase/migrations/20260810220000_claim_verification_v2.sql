-- Claim verification v2: additive ownership verification layer.
-- Does NOT drop columns, delete rows, or replace salon_claim_requests.

-- Catalogue vs owner authority on the live salon profile.
alter table public.salons
  add column if not exists profile_authority text not null default 'catalogue';

alter table public.salons
  drop constraint if exists salons_profile_authority_check;

alter table public.salons
  add constraint salons_profile_authority_check
  check (profile_authority in ('catalogue', 'owner'));

comment on column public.salons.profile_authority is
  'catalogue = Google/catalogue projection may populate profile; owner = verified owner profile is authoritative; Google sync must not overwrite owner profile fields.';

update public.salons s
set profile_authority = 'owner'
where s.profile_authority = 'catalogue'
  and (
    s.ownership_status = 'verified'
    or (
      s.claimed = true
      and exists (select 1 from public.salon_owners so where so.salon_id = s.id)
    )
  );

-- Extend claim request workflow (keep pending/approved/rejected; add verification states).
alter table public.salon_claim_requests
  drop constraint if exists salon_claim_requests_status_check;

alter table public.salon_claim_requests
  add constraint salon_claim_requests_status_check
  check (
    status in (
      'pending',
      'email_verified',
      'business_verification_required',
      'business_verified',
      'verified',
      'approved',
      'rejected',
      'manual_review',
      'conflict'
    )
  );

alter table public.salon_claim_requests
  add column if not exists verification_state text not null default 'pending';

alter table public.salon_claim_requests
  drop constraint if exists salon_claim_requests_verification_state_check;

alter table public.salon_claim_requests
  add constraint salon_claim_requests_verification_state_check
  check (
    verification_state in (
      'pending',
      'email_verified',
      'business_verification_required',
      'business_verified',
      'verified',
      'rejected',
      'manual_review',
      'conflict'
    )
  );

alter table public.salon_claim_requests
  add column if not exists risk_score integer not null default 0,
  add column if not exists risk_flags text[] not null default '{}',
  add column if not exists match_confidence integer not null default 0,
  add column if not exists match_reasons_detail jsonb not null default '[]'::jsonb,
  add column if not exists claimant_phone text,
  add column if not exists catalogue_phone_match boolean,
  add column if not exists account_email_verified_at timestamptz,
  add column if not exists business_verified_at timestamptz,
  add column if not exists ownership_verified_at timestamptz,
  add column if not exists failed_verification_attempts integer not null default 0,
  add column if not exists postal_fallback_eligible boolean not null default false,
  add column if not exists last_verification_method text;

comment on column public.salon_claim_requests.verification_state is
  'Claim verification workflow state. ownership is only granted when verified/approved after business-control proof.';

-- Evidence records for each verification attempt/method.
create table if not exists public.salon_claim_verifications (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.salon_claim_requests (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete cascade,
  auth_user_id uuid not null,
  verification_method text not null
    check (
      verification_method in (
        'account_email',
        'sms',
        'business_phone',
        'website',
        'google_business_phone',
        'postal_mail',
        'manual_review'
      )
    ),
  status text not null default 'pending'
    check (
      status in (
        'pending',
        'sent',
        'queued',
        'verified',
        'failed',
        'expired',
        'cancelled',
        'unavailable'
      )
    ),
  token_hash text,
  challenge_hint text,
  target_hint text,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  risk_level text not null default 'low'
    check (risk_level in ('low', 'medium', 'high')),
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists salon_claim_verifications_claim_idx
  on public.salon_claim_verifications (claim_id, created_at desc);

create index if not exists salon_claim_verifications_method_status_idx
  on public.salon_claim_verifications (verification_method, status);

create unique index if not exists salon_claim_verifications_active_method_uidx
  on public.salon_claim_verifications (claim_id, verification_method)
  where status in ('pending', 'sent', 'queued');

comment on table public.salon_claim_verifications is
  'Claim verification evidence. Tokens stored hashed; plaintext OTPs must never be persisted.';

alter table public.salon_claim_verifications enable row level security;

create policy salon_claim_verifications_select_own
  on public.salon_claim_verifications
  for select
  to authenticated
  using (auth.uid() = auth_user_id);

-- Dedicated claim audit trail (do not log secrets).
create table if not exists public.salon_claim_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.salon_claim_requests (id) on delete cascade,
  salon_id uuid references public.salons (id) on delete set null,
  auth_user_id uuid,
  event text not null,
  verification_method text,
  result text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists salon_claim_events_claim_idx
  on public.salon_claim_events (claim_id, created_at desc);

create index if not exists salon_claim_events_salon_idx
  on public.salon_claim_events (salon_id, created_at desc);

comment on table public.salon_claim_events is
  'Audit log for claim verification. Never store passwords or plaintext OTPs.';

alter table public.salon_claim_events enable row level security;

create policy salon_claim_events_select_own
  on public.salon_claim_events
  for select
  to authenticated
  using (auth.uid() = auth_user_id);
