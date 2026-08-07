-- Google Sync Engine: snapshot change detection + sync history.
-- Does not alter marketplace search architecture.

alter table public.salons
  add column if not exists owner_name_override boolean not null default false,
  add column if not exists google_business_status text,
  add column if not exists google_snapshot_hash text,
  add column if not exists permanently_closed boolean not null default false;

comment on column public.salons.owner_name_override is
  'When true, Google sync must not overwrite salons.name.';
comment on column public.salons.google_business_status is
  'Last Google Places businessStatus (OPERATIONAL, CLOSED_TEMPORARILY, CLOSED_PERMANENTLY, …).';
comment on column public.salons.google_snapshot_hash is
  'Hash of Google-managed snapshot fields — skip write when unchanged.';
comment on column public.salons.permanently_closed is
  'True when Google reports CLOSED_PERMANENTLY.';

create table if not exists public.google_sync_runs (
  id uuid primary key default gen_random_uuid(),
  scope text not null
    check (scope in ('single', 'city', 'state', 'scheduled')),
  country text,
  state text,
  city text,
  salon_id uuid references public.salons (id) on delete set null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed')),
  triggered_by text,
  totals jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists google_sync_runs_created_idx
  on public.google_sync_runs (created_at desc);

create index if not exists google_sync_runs_status_idx
  on public.google_sync_runs (status, created_at desc);

create table if not exists public.google_sync_run_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.google_sync_runs (id) on delete cascade,
  salon_id uuid references public.salons (id) on delete set null,
  place_id text,
  business_name text,
  result text not null
    check (result in ('updated', 'unchanged', 'failed', 'closed', 'missing')),
  changed_fields text[] not null default '{}',
  error text,
  created_at timestamptz not null default now()
);

create index if not exists google_sync_run_items_run_idx
  on public.google_sync_run_items (run_id, created_at);

alter table public.google_sync_runs enable row level security;
alter table public.google_sync_run_items enable row level security;
-- Admin/service-role only (no public policies).
