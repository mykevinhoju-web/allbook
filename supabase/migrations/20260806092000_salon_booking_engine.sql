-- Marketplace salon booking engine (separate from tenant `bookings`).

create table if not exists public.salon_customers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists salon_customers_salon_id_idx
  on public.salon_customers (salon_id);

create index if not exists salon_customers_email_idx
  on public.salon_customers (salon_id, email)
  where email is not null;

alter table public.salon_customers enable row level security;

create table if not exists public.salon_bookings (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  staff_id uuid not null references public.salon_staff (id) on delete restrict,
  customer_id uuid references public.salon_customers (id) on delete set null,
  service_id uuid not null references public.salon_services (id) on delete restrict,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  duration integer not null check (duration > 0),
  buffer_minutes integer not null default 0 check (buffer_minutes >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  customer_name text,
  customer_email text,
  customer_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists salon_bookings_salon_date_idx
  on public.salon_bookings (salon_id, booking_date);

create index if not exists salon_bookings_staff_date_idx
  on public.salon_bookings (staff_id, booking_date, status);

create index if not exists salon_bookings_service_id_idx
  on public.salon_bookings (service_id);

alter table public.salon_bookings enable row level security;

-- Public can create pending bookings; owners manage via service role later.
drop policy if exists "Public can insert salon bookings" on public.salon_bookings;
create policy "Public can insert salon bookings"
  on public.salon_bookings for insert to anon, authenticated
  with check (status in ('pending', 'confirmed'));

drop policy if exists "Public can read own salon booking by id" on public.salon_bookings;
create policy "Public can read salon bookings"
  on public.salon_bookings for select to anon, authenticated
  using (true);

drop policy if exists "Public can insert salon customers" on public.salon_customers;
create policy "Public can insert salon customers"
  on public.salon_customers for insert to anon, authenticated
  with check (true);

drop policy if exists "Public can read salon customers" on public.salon_customers;
-- No public read of customer PII by default.
