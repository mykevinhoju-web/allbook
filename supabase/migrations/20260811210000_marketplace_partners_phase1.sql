-- Marketplace Partner Phase 1 (additive).
-- Does NOT alter salons, salon_services, salon_bookings, tenants, or bookings.
-- Partner commercial identity is partner_id; salon_id is an optional link.

-- Shared helpers (idempotent — may already exist on some environments).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'platform_admin')::boolean,
    false
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- marketplace_partners
-- ---------------------------------------------------------------------------

create table if not exists public.marketplace_partners (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references public.salons (id) on delete set null,
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  partner_type text not null
    check (partner_type in ('business_linked', 'independent')),
  status text not null default 'pending'
    check (status in ('invited', 'pending', 'active', 'suspended')),
  display_name text not null,
  bio text,
  phone text,
  email text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_partners_type_salon_chk check (
    (partner_type = 'business_linked' and salon_id is not null)
    or (partner_type = 'independent' and salon_id is null)
  )
);

comment on table public.marketplace_partners is
  'AllBook Marketplace Partner (opt-in). Optional salon_id link to Discovery Business; independent partners allowed.';

comment on column public.marketplace_partners.auth_user_id is
  'Supabase Auth user that owns this Partner account. Partner CRUD is scoped to this user.';

comment on column public.marketplace_partners.salon_id is
  'Nullable FK to salons. Required only for business_linked; null for independent.';

create unique index if not exists marketplace_partners_salon_id_uidx
  on public.marketplace_partners (salon_id)
  where salon_id is not null;

create unique index if not exists marketplace_partners_auth_user_id_uidx
  on public.marketplace_partners (auth_user_id);

create index if not exists marketplace_partners_status_idx
  on public.marketplace_partners (status, partner_type);

create or replace function public.is_marketplace_partner_owner(p_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.marketplace_partners mp
    where mp.id = p_partner_id
      and mp.auth_user_id = auth.uid()
  );
$$;

create or replace function public.marketplace_partners_guard_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if auth.role() is distinct from 'service_role'
       and not public.is_platform_admin() then
      if old.partner_type is distinct from new.partner_type
         or old.salon_id is distinct from new.salon_id
         or old.auth_user_id is distinct from new.auth_user_id then
        raise exception 'Cannot change partner identity fields';
      end if;
      if old.status is distinct from new.status then
        raise exception 'Only platform admin can change partner status';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_partners_set_updated_at on public.marketplace_partners;
create trigger marketplace_partners_set_updated_at
  before update on public.marketplace_partners
  for each row execute function public.set_updated_at();

drop trigger if exists marketplace_partners_guard_identity on public.marketplace_partners;
create trigger marketplace_partners_guard_identity
  before update on public.marketplace_partners
  for each row execute function public.marketplace_partners_guard_identity();

alter table public.marketplace_partners enable row level security;

-- No anon SELECT: email/phone PII must not leak via Data API.
-- Public catalogue reads go through server APIs that return stripped DTOs.

drop policy if exists "Partners read own row" on public.marketplace_partners;
create policy "Partners read own row"
  on public.marketplace_partners
  for select
  to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "Partners insert own row" on public.marketplace_partners;
create policy "Partners insert own row"
  on public.marketplace_partners
  for insert
  to authenticated
  with check (
    auth_user_id = auth.uid()
    and status in ('pending', 'invited')
  );

drop policy if exists "Partners update own row" on public.marketplace_partners;
create policy "Partners update own row"
  on public.marketplace_partners
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

drop policy if exists "Platform admin manage partners" on public.marketplace_partners;
create policy "Platform admin manage partners"
  on public.marketplace_partners
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- partner_services
-- ---------------------------------------------------------------------------

create table if not exists public.partner_services (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.marketplace_partners (id) on delete cascade,
  category_slug text not null,
  name text not null,
  description text,
  pricing_type text not null
    check (pricing_type in ('fixed', 'hourly', 'from', 'quote')),
  price_cents integer
    check (price_cents is null or price_cents >= 0),
  price_max_cents integer
    check (price_max_cents is null or price_max_cents >= 0),
  currency text not null default 'AUD',
  duration_minutes integer
    check (duration_minutes is null or duration_minutes > 0),
  travel_fee_cents integer
    check (travel_fee_cents is null or travel_fee_cents >= 0),
  min_notice_minutes integer
    check (min_notice_minutes is null or min_notice_minutes >= 0),
  attributes jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_services_price_range_chk check (
    price_max_cents is null
    or price_cents is null
    or price_max_cents >= price_cents
  )
);

comment on table public.partner_services is
  'Marketplace offers entered by Partners only. Never populated from Google or AI price guesses.';

create index if not exists partner_services_partner_active_idx
  on public.partner_services (partner_id, is_active);

create index if not exists partner_services_category_idx
  on public.partner_services (category_slug)
  where is_active = true;

drop trigger if exists partner_services_set_updated_at on public.partner_services;
create trigger partner_services_set_updated_at
  before update on public.partner_services
  for each row execute function public.set_updated_at();

alter table public.partner_services enable row level security;

-- Active services of active partners are catalogue-safe (no partner PII).
drop policy if exists "Public read active partner services" on public.partner_services;
create policy "Public read active partner services"
  on public.partner_services
  for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.marketplace_partners mp
      where mp.id = partner_services.partner_id
        and mp.status = 'active'
    )
  );

drop policy if exists "Partners manage own services" on public.partner_services;
create policy "Partners manage own services"
  on public.partner_services
  for all
  to authenticated
  using (public.is_marketplace_partner_owner(partner_id))
  with check (public.is_marketplace_partner_owner(partner_id));

drop policy if exists "Platform admin manage partner services" on public.partner_services;
create policy "Platform admin manage partner services"
  on public.partner_services
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- partner_service_areas
-- ---------------------------------------------------------------------------

create table if not exists public.partner_service_areas (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.marketplace_partners (id) on delete cascade,
  service_id uuid references public.partner_services (id) on delete cascade,
  mode text not null
    check (mode in ('suburb', 'radius', 'postcodes')),
  suburb_id uuid references public.suburbs (id) on delete set null,
  center_lat double precision,
  center_lng double precision,
  radius_km double precision
    check (radius_km is null or radius_km > 0),
  postcodes text[],
  created_at timestamptz not null default now(),
  constraint partner_service_areas_mode_chk check (
    (mode = 'suburb' and suburb_id is not null)
    or (
      mode = 'radius'
      and center_lat is not null
      and center_lng is not null
      and radius_km is not null
    )
    or (
      mode = 'postcodes'
      and postcodes is not null
      and cardinality(postcodes) > 0
    )
  )
);

comment on table public.partner_service_areas is
  'Partner coverage: suburb, radius, or postcode list. Optional per-service scope.';

create index if not exists partner_service_areas_partner_idx
  on public.partner_service_areas (partner_id);

create index if not exists partner_service_areas_service_idx
  on public.partner_service_areas (service_id)
  where service_id is not null;

alter table public.partner_service_areas enable row level security;

drop policy if exists "Public read active partner areas" on public.partner_service_areas;
create policy "Public read active partner areas"
  on public.partner_service_areas
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.marketplace_partners mp
      where mp.id = partner_service_areas.partner_id
        and mp.status = 'active'
    )
  );

drop policy if exists "Partners manage own areas" on public.partner_service_areas;
create policy "Partners manage own areas"
  on public.partner_service_areas
  for all
  to authenticated
  using (public.is_marketplace_partner_owner(partner_id))
  with check (public.is_marketplace_partner_owner(partner_id));

drop policy if exists "Platform admin manage partner areas" on public.partner_service_areas;
create policy "Platform admin manage partner areas"
  on public.partner_service_areas
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- partner_availability_rules
-- ---------------------------------------------------------------------------

create table if not exists public.partner_availability_rules (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.marketplace_partners (id) on delete cascade,
  timezone text not null default 'Australia/Brisbane',
  weekly_windows jsonb not null default '[]'::jsonb,
  blackouts jsonb not null default '[]'::jsonb,
  capacity_per_slot integer not null default 1
    check (capacity_per_slot > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.partner_availability_rules is
  'Simple Partner availability storage for Phase 1. Not a booking engine.';

create unique index if not exists partner_availability_rules_partner_uidx
  on public.partner_availability_rules (partner_id);

drop trigger if exists partner_availability_rules_set_updated_at
  on public.partner_availability_rules;
create trigger partner_availability_rules_set_updated_at
  before update on public.partner_availability_rules
  for each row execute function public.set_updated_at();

alter table public.partner_availability_rules enable row level security;

drop policy if exists "Public read active partner availability" on public.partner_availability_rules;
create policy "Public read active partner availability"
  on public.partner_availability_rules
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.marketplace_partners mp
      where mp.id = partner_availability_rules.partner_id
        and mp.status = 'active'
    )
  );

drop policy if exists "Partners manage own availability" on public.partner_availability_rules;
create policy "Partners manage own availability"
  on public.partner_availability_rules
  for all
  to authenticated
  using (public.is_marketplace_partner_owner(partner_id))
  with check (public.is_marketplace_partner_owner(partner_id));

drop policy if exists "Platform admin manage partner availability"
  on public.partner_availability_rules;
create policy "Platform admin manage partner availability"
  on public.partner_availability_rules
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
