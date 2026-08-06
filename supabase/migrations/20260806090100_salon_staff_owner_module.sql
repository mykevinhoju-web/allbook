-- Salon owner staff module: booking-ready schedule, breaks, leave, service assignment.
-- Extends marketplace salon_staff (tenant `staff` table is separate).

alter table public.salon_staff
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists display_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists role text not null default 'Stylist',
  add column if not exists bio text,
  add column if not exists instagram text,
  add column if not exists certificates text[] not null default '{}',
  add column if not exists portfolio_images text[] not null default '{}',
  add column if not exists rating numeric(3,2) not null default 0,
  add column if not exists booking_enabled boolean not null default true,
  add column if not exists max_daily_bookings integer,
  add column if not exists max_weekly_bookings integer,
  add column if not exists buffer_minutes integer not null default 0
    check (buffer_minutes >= 0),
  add column if not exists status text not null default 'active'
    check (status in ('active', 'inactive', 'archived'));

update public.salon_staff
set
  display_name = coalesce(nullif(display_name, ''), name),
  first_name = coalesce(
    nullif(first_name, ''),
    split_part(name, ' ', 1)
  ),
  last_name = coalesce(
    nullif(last_name, ''),
    nullif(trim(both from substr(name, length(split_part(name, ' ', 1)) + 1)), ''),
    ''
  ),
  role = coalesce(nullif(role, ''), nullif(position, ''), 'Stylist'),
  status = case when is_active then 'active' else 'inactive' end
where true;

create index if not exists salon_staff_salon_status_idx
  on public.salon_staff (salon_id, status, sort_order);

create table if not exists public.salon_staff_services (
  staff_id uuid not null references public.salon_staff (id) on delete cascade,
  service_id uuid not null references public.salon_services (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (staff_id, service_id)
);

create index if not exists salon_staff_services_service_id_idx
  on public.salon_staff_services (service_id);

alter table public.salon_staff_services enable row level security;

drop policy if exists "Public can read salon staff services" on public.salon_staff_services;
create policy "Public can read salon staff services"
  on public.salon_staff_services for select to anon, authenticated
  using (true);

create table if not exists public.salon_staff_working_hours (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.salon_staff (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_day_off boolean not null default false,
  created_at timestamptz not null default now(),
  unique (staff_id, day_of_week),
  check (is_day_off or end_time > start_time)
);

create index if not exists salon_staff_working_hours_staff_id_idx
  on public.salon_staff_working_hours (staff_id, day_of_week);

alter table public.salon_staff_working_hours enable row level security;

drop policy if exists "Public can read salon staff working hours" on public.salon_staff_working_hours;
create policy "Public can read salon staff working hours"
  on public.salon_staff_working_hours for select to anon, authenticated
  using (true);

create table if not exists public.salon_staff_breaks (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.salon_staff (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  break_type text not null default 'custom'
    check (break_type in ('lunch', 'coffee', 'custom')),
  label text,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists salon_staff_breaks_staff_day_idx
  on public.salon_staff_breaks (staff_id, day_of_week);

alter table public.salon_staff_breaks enable row level security;

drop policy if exists "Public can read salon staff breaks" on public.salon_staff_breaks;
create policy "Public can read salon staff breaks"
  on public.salon_staff_breaks for select to anon, authenticated
  using (true);

create table if not exists public.salon_staff_leaves (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.salon_staff (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  leave_type text not null default 'custom'
    check (leave_type in ('annual', 'sick', 'holiday', 'custom')),
  reason text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists salon_staff_leaves_staff_dates_idx
  on public.salon_staff_leaves (staff_id, start_date, end_date);

alter table public.salon_staff_leaves enable row level security;

-- Leaves are owner-only by default (no public select policy).
