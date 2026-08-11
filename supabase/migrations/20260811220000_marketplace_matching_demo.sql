-- Marketplace matching demo Phase 1.5 (additive).
-- service_requests + request_matches + demo flag on partners.
-- Does NOT alter salons, salon_bookings, tenants, or bookings.

alter table public.marketplace_partners
  add column if not exists is_demo boolean not null default false;

comment on column public.marketplace_partners.is_demo is
  'Dev/demo seed partners only. Safe to wipe via demo reset; never treat as production supply.';

create index if not exists marketplace_partners_is_demo_idx
  on public.marketplace_partners (is_demo)
  where is_demo = true;

-- ---------------------------------------------------------------------------
-- service_requests (structured customer demand; no AI required)
-- ---------------------------------------------------------------------------

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  raw_query text,
  structured jsonb not null default '{}'::jsonb,
  service_category text,
  service_slug text,
  location_label text,
  suburb_id uuid references public.suburbs (id) on delete set null,
  preferred_date date,
  preferred_time text,
  budget_cents_max integer
    check (budget_cents_max is null or budget_cents_max >= 0),
  urgency text not null default 'normal'
    check (urgency in ('low', 'normal', 'high')),
  status text not null default 'open'
    check (
      status in (
        'draft',
        'open',
        'matched',
        'accepted',
        'closed',
        'cancelled'
      )
    ),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.service_requests is
  'Customer service demand. Phase 1.5 uses manually structured fields (no LLM).';

create index if not exists service_requests_status_idx
  on public.service_requests (status, created_at desc);

create index if not exists service_requests_is_demo_idx
  on public.service_requests (is_demo)
  where is_demo = true;

drop trigger if exists service_requests_set_updated_at on public.service_requests;
create trigger service_requests_set_updated_at
  before update on public.service_requests
  for each row execute function public.set_updated_at();

alter table public.service_requests enable row level security;

-- No public PII table yet; demo/matching goes through service-role APIs.
drop policy if exists "Platform admin manage service requests" on public.service_requests;
create policy "Platform admin manage service requests"
  on public.service_requests
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- request_matches
-- ---------------------------------------------------------------------------

create table if not exists public.request_matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests (id) on delete cascade,
  partner_id uuid not null references public.marketplace_partners (id) on delete cascade,
  partner_service_id uuid references public.partner_services (id) on delete set null,
  score numeric(6, 2) not null default 0,
  score_breakdown jsonb not null default '{}'::jsonb,
  status text not null default 'suggested'
    check (
      status in (
        'suggested',
        'notified',
        'accepted',
        'declined',
        'expired'
      )
    ),
  exclusion_reason text,
  quoted_price_cents integer
    check (quoted_price_cents is null or quoted_price_cents >= 0),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, partner_id)
);

comment on table public.request_matches is
  'Rule-based (or later AI-assisted) partner candidates for a service_request.';

create index if not exists request_matches_request_score_idx
  on public.request_matches (request_id, score desc);

create index if not exists request_matches_is_demo_idx
  on public.request_matches (is_demo)
  where is_demo = true;

drop trigger if exists request_matches_set_updated_at on public.request_matches;
create trigger request_matches_set_updated_at
  before update on public.request_matches
  for each row execute function public.set_updated_at();

alter table public.request_matches enable row level security;

drop policy if exists "Platform admin manage request matches" on public.request_matches;
create policy "Platform admin manage request matches"
  on public.request_matches
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Partners read own matches" on public.request_matches;
create policy "Partners read own matches"
  on public.request_matches
  for select
  to authenticated
  using (public.is_marketplace_partner_owner(partner_id));

-- Demo tables: allow anon/authenticated to insert/read is_demo rows only
-- (production traffic should not set is_demo; APIs are demo-gated in app code).
drop policy if exists "Demo insert service requests" on public.service_requests;
create policy "Demo insert service requests"
  on public.service_requests
  for insert
  to anon, authenticated
  with check (is_demo = true);

drop policy if exists "Demo read demo requests" on public.service_requests;
create policy "Demo read demo requests"
  on public.service_requests
  for select
  to anon, authenticated
  using (is_demo = true);

drop policy if exists "Demo insert request matches" on public.request_matches;
create policy "Demo insert request matches"
  on public.request_matches
  for insert
  to anon, authenticated
  with check (is_demo = true);

drop policy if exists "Demo read demo matches" on public.request_matches;
create policy "Demo read demo matches"
  on public.request_matches
  for select
  to anon, authenticated
  using (is_demo = true);
-- ---------------------------------------------------------------------------
-- Matching supply loader (no email/phone). Used by demo matching when the
-- app cannot use the service role locally.
-- ---------------------------------------------------------------------------

create or replace function public.load_marketplace_matching_catalog()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_agg(partner_row order by partner_row ->> 'display_name')
      from (
        select jsonb_build_object(
          'id', mp.id,
          'display_name', mp.display_name,
          'partner_type', mp.partner_type,
          'status', mp.status,
          'is_demo', mp.is_demo,
          'services', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', ps.id,
              'partner_id', ps.partner_id,
              'category_slug', ps.category_slug,
              'name', ps.name,
              'pricing_type', ps.pricing_type,
              'price_cents', ps.price_cents,
              'price_max_cents', ps.price_max_cents,
              'currency', ps.currency,
              'duration_minutes', ps.duration_minutes,
              'is_active', ps.is_active
            ) order by ps.name)
            from public.partner_services ps
            where ps.partner_id = mp.id
          ), '[]'::jsonb),
          'areas', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', pa.id,
              'partner_id', pa.partner_id,
              'service_id', pa.service_id,
              'mode', pa.mode,
              'suburb_id', pa.suburb_id,
              'center_lat', pa.center_lat,
              'center_lng', pa.center_lng,
              'radius_km', pa.radius_km,
              'postcodes', pa.postcodes
            ))
            from public.partner_service_areas pa
            where pa.partner_id = mp.id
          ), '[]'::jsonb),
          'availability', (
            select jsonb_build_object(
              'id', ar.id,
              'partner_id', ar.partner_id,
              'timezone', ar.timezone,
              'weekly_windows', ar.weekly_windows,
              'blackouts', ar.blackouts,
              'capacity_per_slot', ar.capacity_per_slot
            )
            from public.partner_availability_rules ar
            where ar.partner_id = mp.id
            limit 1
          )
        ) as partner_row
        from public.marketplace_partners mp
        where mp.status = 'active'
      ) catalog
    ),
    '[]'::jsonb
  );
$$;

revoke all on function public.load_marketplace_matching_catalog() from public;
grant execute on function public.load_marketplace_matching_catalog() to anon, authenticated, service_role;

create or replace function public.resolve_suburb_by_name(p_name text)
returns table (id uuid, name text, postcode text)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name, s.postcode
  from public.suburbs s
  where lower(s.name) = lower(trim(p_name))
  limit 1;
$$;

revoke all on function public.resolve_suburb_by_name(text) from public;
grant execute on function public.resolve_suburb_by_name(text) to anon, authenticated, service_role;
