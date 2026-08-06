-- =============================================================================
-- Hair Booking Platform — MVP database foundation
-- =============================================================================
-- Spec tables → physical tables (tenant collision avoidance):
--   business_categories → public.business_categories
--   suburbs             → public.suburbs
--   salons              → public.salons
--   staff               → public.salon_staff      (public.staff is dayspa tenant)
--   services            → public.salon_services
--   business_hours      → public.business_hours   (NEW; replaces jsonb-only hours)
--   customers           → public.salon_customers  (no public.customers)
--   bookings            → public.salon_bookings   (public.bookings is dayspa tenant)
--
-- Guarantees: PKs, FKs, indexes, created_at/updated_at, soft delete, RLS.
-- Idempotent: safe to re-run with IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

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
  );
$$;

-- ---------------------------------------------------------------------------
-- 1. business_categories
-- ---------------------------------------------------------------------------

create table if not exists public.business_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.business_categories
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

-- Unique slug among live rows
create unique index if not exists business_categories_slug_live_uidx
  on public.business_categories (slug)
  where deleted_at is null;

create index if not exists business_categories_deleted_at_idx
  on public.business_categories (deleted_at);

drop trigger if exists business_categories_set_updated_at on public.business_categories;
create trigger business_categories_set_updated_at
  before update on public.business_categories
  for each row execute function public.set_updated_at();

alter table public.business_categories enable row level security;

drop policy if exists "Public can read business categories" on public.business_categories;
create policy "Public can read live business categories"
  on public.business_categories
  for select
  to anon, authenticated
  using (deleted_at is null);

drop policy if exists "Platform admin manage business categories" on public.business_categories;
create policy "Platform admin manage business categories"
  on public.business_categories
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 2. suburbs
-- ---------------------------------------------------------------------------

create table if not exists public.suburbs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  postcode text,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.suburbs
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

create index if not exists suburbs_name_idx on public.suburbs (name);
create index if not exists suburbs_postcode_idx on public.suburbs (postcode);
create index if not exists suburbs_geo_idx on public.suburbs (latitude, longitude);
create index if not exists suburbs_deleted_at_idx on public.suburbs (deleted_at);

drop trigger if exists suburbs_set_updated_at on public.suburbs;
create trigger suburbs_set_updated_at
  before update on public.suburbs
  for each row execute function public.set_updated_at();

alter table public.suburbs enable row level security;

drop policy if exists "Public can read suburbs" on public.suburbs;
create policy "Public can read live suburbs"
  on public.suburbs
  for select
  to anon, authenticated
  using (deleted_at is null);

drop policy if exists "Platform admin manage suburbs" on public.suburbs;
create policy "Platform admin manage suburbs"
  on public.suburbs
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 3. salons
-- ---------------------------------------------------------------------------

create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.business_categories (id),
  name text not null,
  slug text not null,
  description text,
  phone text,
  email text,
  website text,
  address text,
  suburb_id uuid references public.suburbs (id),
  latitude double precision not null default 0,
  longitude double precision not null default 0,
  cover_image text,
  logo text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.salons
  add column if not exists category_id uuid references public.business_categories (id),
  add column if not exists suburb_id uuid references public.suburbs (id),
  add column if not exists status text,
  add column if not exists verified boolean not null default false,
  add column if not exists opening_hours jsonb not null default '{}'::jsonb,
  add column if not exists deleted_at timestamptz;

-- Backfill status before constraint
update public.salons
set status = coalesce(
  nullif(status, ''),
  case when verified then 'active' else 'pending' end
)
where status is null or status = '';

alter table public.salons
  alter column status set default 'active';

alter table public.salons
  alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'salons_status_check'
  ) then
    alter table public.salons
      add constraint salons_status_check
      check (status in ('draft', 'pending', 'active', 'suspended', 'archived'));
  end if;
end $$;

create unique index if not exists salons_slug_live_uidx
  on public.salons (slug)
  where deleted_at is null;

create index if not exists salons_category_id_idx on public.salons (category_id);
create index if not exists salons_suburb_id_idx on public.salons (suburb_id);
create index if not exists salons_status_idx on public.salons (status)
  where deleted_at is null;
create index if not exists salons_geo_idx on public.salons (latitude, longitude);
create index if not exists salons_deleted_at_idx on public.salons (deleted_at);

drop trigger if exists salons_set_updated_at on public.salons;
create trigger salons_set_updated_at
  before update on public.salons
  for each row execute function public.set_updated_at();

alter table public.salons enable row level security;

drop policy if exists "Public can read salons" on public.salons;
create policy "Public can read live active salons"
  on public.salons
  for select
  to anon, authenticated
  using (deleted_at is null and status = 'active');

drop policy if exists "Authenticated can read own pending salons" on public.salons;
-- Owners / admins manage writes via service role; platform admin read-all:
drop policy if exists "Platform admin read all salons" on public.salons;
create policy "Platform admin read all salons"
  on public.salons
  for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists "Platform admin manage salons" on public.salons;
create policy "Platform admin manage salons"
  on public.salons
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 4. staff → salon_staff
-- ---------------------------------------------------------------------------

create table if not exists public.salon_staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  name text not null,
  role text not null default 'Stylist',
  photo text,
  phone text,
  email text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.salon_staff
  add column if not exists role text,
  add column if not exists photo text,
  add column if not exists photo_url text,
  add column if not exists position text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists status text,
  add column if not exists is_active boolean not null default true,
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Align photo / role / status with existing columns
update public.salon_staff
set
  photo = coalesce(nullif(photo, ''), photo_url),
  role = coalesce(nullif(role, ''), nullif(position, ''), 'Stylist'),
  status = coalesce(
    nullif(status, ''),
    case when coalesce(is_active, true) then 'active' else 'inactive' end
  )
where true;

alter table public.salon_staff
  alter column role set default 'Stylist',
  alter column status set default 'active';

update public.salon_staff set role = 'Stylist' where role is null;
update public.salon_staff set status = 'active' where status is null;

alter table public.salon_staff
  alter column role set not null,
  alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'salon_staff_status_check'
  ) then
    alter table public.salon_staff
      add constraint salon_staff_status_check
      check (status in ('active', 'inactive', 'archived'));
  end if;
exception
  when duplicate_object then null;
end $$;

create index if not exists salon_staff_salon_id_idx
  on public.salon_staff (salon_id)
  where deleted_at is null;
create index if not exists salon_staff_salon_status_live_idx
  on public.salon_staff (salon_id, status)
  where deleted_at is null;
create index if not exists salon_staff_deleted_at_idx
  on public.salon_staff (deleted_at);

drop trigger if exists salon_staff_set_updated_at on public.salon_staff;
create trigger salon_staff_set_updated_at
  before update on public.salon_staff
  for each row execute function public.set_updated_at();

alter table public.salon_staff enable row level security;

drop policy if exists "Public can read salon staff" on public.salon_staff;
create policy "Public can read live active salon staff"
  on public.salon_staff
  for select
  to anon, authenticated
  using (
    deleted_at is null
    and status = 'active'
    and exists (
      select 1 from public.salons s
      where s.id = salon_id
        and s.deleted_at is null
        and s.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- 5. services → salon_services
-- ---------------------------------------------------------------------------

create table if not exists public.salon_services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  name text not null,
  duration integer not null default 60,
  price integer not null default 0,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.salon_services
  add column if not exists duration integer,
  add column if not exists duration_minutes integer,
  add column if not exists active boolean,
  add column if not exists is_active boolean not null default true,
  add column if not exists status text not null default 'active',
  add column if not exists deleted_at timestamptz;

-- Sync MVP columns from legacy names
update public.salon_services
set
  duration = coalesce(duration, duration_minutes, 60),
  active = coalesce(
    active,
    is_active,
    case when status = 'active' then true else false end,
    true
  ),
  price = coalesce(price, 0)
where true;

alter table public.salon_services
  alter column duration set default 60,
  alter column active set default true;

update public.salon_services set duration = 60 where duration is null;
update public.salon_services set active = true where active is null;

alter table public.salon_services
  alter column duration set not null,
  alter column active set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'salon_services_duration_check'
  ) then
    alter table public.salon_services
      add constraint salon_services_duration_check check (duration > 0);
  end if;
exception when duplicate_object then null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'salon_services_price_check'
  ) then
    alter table public.salon_services
      add constraint salon_services_price_check check (price >= 0);
  end if;
exception when duplicate_object then null;
end $$;

create index if not exists salon_services_salon_live_idx
  on public.salon_services (salon_id, active)
  where deleted_at is null;
create index if not exists salon_services_deleted_at_idx
  on public.salon_services (deleted_at);

drop trigger if exists salon_services_set_updated_at on public.salon_services;
create trigger salon_services_set_updated_at
  before update on public.salon_services
  for each row execute function public.set_updated_at();

alter table public.salon_services enable row level security;

drop policy if exists "Public can read salon services" on public.salon_services;
create policy "Public can read live active salon services"
  on public.salon_services
  for select
  to anon, authenticated
  using (
    deleted_at is null
    and active = true
    and exists (
      select 1 from public.salons s
      where s.id = salon_id
        and s.deleted_at is null
        and s.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- 6. business_hours (NEW normalized table)
-- ---------------------------------------------------------------------------

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Sun … 6=Sat
  open_time time,
  close_time time,
  closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (salon_id, day_of_week),
  check (
    closed = true
    or (open_time is not null and close_time is not null and close_time > open_time)
  )
);

create index if not exists business_hours_salon_id_idx
  on public.business_hours (salon_id)
  where deleted_at is null;

drop trigger if exists business_hours_set_updated_at on public.business_hours;
create trigger business_hours_set_updated_at
  before update on public.business_hours
  for each row execute function public.set_updated_at();

alter table public.business_hours enable row level security;

drop policy if exists "Public can read business hours" on public.business_hours;
create policy "Public can read live business hours"
  on public.business_hours
  for select
  to anon, authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.salons s
      where s.id = salon_id
        and s.deleted_at is null
        and s.status = 'active'
    )
  );

-- Backfill from opening_hours jsonb when empty (Mon=1 … Sun=0)
insert into public.business_hours (salon_id, day_of_week, open_time, close_time, closed)
select
  s.id,
  v.dow,
  case when coalesce((s.opening_hours -> v.key ->> 'closed')::boolean, false)
    then null
    else nullif(s.opening_hours -> v.key ->> 'open', '')::time
  end,
  case when coalesce((s.opening_hours -> v.key ->> 'closed')::boolean, false)
    then null
    else nullif(s.opening_hours -> v.key ->> 'close', '')::time
  end,
  coalesce((s.opening_hours -> v.key ->> 'closed')::boolean, false)
from public.salons s
cross join (
  values
    (0, 'sun'),
    (1, 'mon'),
    (2, 'tue'),
    (3, 'wed'),
    (4, 'thu'),
    (5, 'fri'),
    (6, 'sat')
) as v(dow, key)
where s.opening_hours is not null
  and s.opening_hours ? v.key
  and not exists (
    select 1 from public.business_hours bh
    where bh.salon_id = s.id and bh.day_of_week = v.dow
  );

-- Default Mon–Sat 09–18 if still missing
insert into public.business_hours (salon_id, day_of_week, open_time, close_time, closed)
select s.id, d.dow,
  case when d.dow = 0 then null else time '09:00' end,
  case when d.dow = 0 then null else time '18:00' end,
  d.dow = 0
from public.salons s
cross join generate_series(0, 6) as d(dow)
where not exists (
  select 1 from public.business_hours bh
  where bh.salon_id = s.id and bh.day_of_week = d.dow
);

-- ---------------------------------------------------------------------------
-- 7. customers → salon_customers
-- ---------------------------------------------------------------------------

create table if not exists public.salon_customers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  full_name text,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.salon_customers
  add column if not exists full_name text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

update public.salon_customers
set
  first_name = coalesce(
    nullif(first_name, ''),
    split_part(coalesce(full_name, ''), ' ', 1),
    ''
  ),
  last_name = coalesce(
    nullif(last_name, ''),
    nullif(trim(both from substr(coalesce(full_name, ''), length(split_part(coalesce(full_name, ''), ' ', 1)) + 1)), ''),
    ''
  )
where first_name is null or last_name is null;

alter table public.salon_customers
  alter column first_name set default '',
  alter column last_name set default '';

update public.salon_customers set first_name = '' where first_name is null;
update public.salon_customers set last_name = '' where last_name is null;

alter table public.salon_customers
  alter column first_name set not null,
  alter column last_name set not null;

create index if not exists salon_customers_salon_id_idx
  on public.salon_customers (salon_id)
  where deleted_at is null;
create index if not exists salon_customers_phone_live_idx
  on public.salon_customers (salon_id, phone)
  where deleted_at is null and phone is not null;
create index if not exists salon_customers_email_live_idx
  on public.salon_customers (salon_id, email)
  where deleted_at is null and email is not null;
create index if not exists salon_customers_deleted_at_idx
  on public.salon_customers (deleted_at);

drop trigger if exists salon_customers_set_updated_at on public.salon_customers;
create trigger salon_customers_set_updated_at
  before update on public.salon_customers
  for each row execute function public.set_updated_at();

alter table public.salon_customers enable row level security;

-- No public SELECT of PII. Insert for booking flow only.
drop policy if exists "Public can insert salon customers" on public.salon_customers;
create policy "Public can insert salon customers"
  on public.salon_customers
  for insert
  to anon, authenticated
  with check (deleted_at is null);

drop policy if exists "Public can read salon customers" on public.salon_customers;

-- ---------------------------------------------------------------------------
-- 8. bookings → salon_bookings
-- ---------------------------------------------------------------------------

create table if not exists public.salon_bookings (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  customer_id uuid references public.salon_customers (id) on delete set null,
  staff_id uuid not null references public.salon_staff (id) on delete restrict,
  service_id uuid not null references public.salon_services (id) on delete restrict,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (end_time > start_time)
);

alter table public.salon_bookings
  add column if not exists deleted_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'salon_bookings_status_check'
  ) then
    alter table public.salon_bookings
      add constraint salon_bookings_status_check
      check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));
  end if;
exception when duplicate_object then null;
end $$;

create index if not exists salon_bookings_salon_date_live_idx
  on public.salon_bookings (salon_id, booking_date)
  where deleted_at is null;
create index if not exists salon_bookings_staff_date_live_idx
  on public.salon_bookings (staff_id, booking_date, status)
  where deleted_at is null;
create index if not exists salon_bookings_customer_id_idx
  on public.salon_bookings (customer_id)
  where deleted_at is null;
create index if not exists salon_bookings_service_id_idx
  on public.salon_bookings (service_id)
  where deleted_at is null;
create index if not exists salon_bookings_status_idx
  on public.salon_bookings (status)
  where deleted_at is null;
create index if not exists salon_bookings_deleted_at_idx
  on public.salon_bookings (deleted_at);

drop trigger if exists salon_bookings_set_updated_at on public.salon_bookings;
create trigger salon_bookings_set_updated_at
  before update on public.salon_bookings
  for each row execute function public.set_updated_at();

alter table public.salon_bookings enable row level security;

drop policy if exists "Public can insert salon bookings" on public.salon_bookings;
create policy "Public can insert salon bookings"
  on public.salon_bookings
  for insert
  to anon, authenticated
  with check (
    deleted_at is null
    and status in ('pending', 'confirmed')
  );

-- Tighten public read: allow select of own booking by id is app-layer;
-- keep select for confirmation pages but exclude soft-deleted.
drop policy if exists "Public can read salon bookings" on public.salon_bookings;
drop policy if exists "Public can read own salon booking by id" on public.salon_bookings;
create policy "Public can read live salon bookings"
  on public.salon_bookings
  for select
  to anon, authenticated
  using (deleted_at is null);

-- ---------------------------------------------------------------------------
-- Keep legacy column mirrors in sync (duration_minutes / is_active / photo_url)
-- ---------------------------------------------------------------------------

create or replace function public.sync_salon_services_mvp_columns()
returns trigger
language plpgsql
as $$
begin
  if new.duration is not null then
    new.duration_minutes := new.duration;
  elsif new.duration_minutes is not null then
    new.duration := new.duration_minutes;
  end if;

  if new.active is not null then
    new.is_active := new.active;
  elsif new.is_active is not null then
    new.active := new.is_active;
  end if;

  return new;
end;
$$;

drop trigger if exists salon_services_sync_mvp on public.salon_services;
create trigger salon_services_sync_mvp
  before insert or update on public.salon_services
  for each row execute function public.sync_salon_services_mvp_columns();

create or replace function public.sync_salon_staff_mvp_columns()
returns trigger
language plpgsql
as $$
begin
  if new.photo is not null then
    new.photo_url := new.photo;
  elsif new.photo_url is not null then
    new.photo := new.photo_url;
  end if;

  if new.role is not null and (new.position is null or new.position = '') then
    new.position := new.role;
  end if;

  return new;
end;
$$;

drop trigger if exists salon_staff_sync_mvp on public.salon_staff;
create trigger salon_staff_sync_mvp
  before insert or update on public.salon_staff
  for each row execute function public.sync_salon_staff_mvp_columns();

-- ---------------------------------------------------------------------------
-- Comments (documentation in catalog)
-- ---------------------------------------------------------------------------

comment on table public.business_categories is 'MVP: business_categories';
comment on table public.suburbs is 'MVP: suburbs';
comment on table public.salons is 'MVP: salons';
comment on table public.salon_staff is 'MVP: staff (named salon_staff; public.staff is tenant)';
comment on table public.salon_services is 'MVP: services';
comment on table public.business_hours is 'MVP: business_hours';
comment on table public.salon_customers is 'MVP: customers';
comment on table public.salon_bookings is 'MVP: bookings (named salon_bookings; public.bookings is tenant)';
