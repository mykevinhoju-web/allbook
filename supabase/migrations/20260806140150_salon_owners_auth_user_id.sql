-- Permanent salon owner auth link: auth.users ↔ salon_owners ↔ salons
-- Path: auth.uid() → salon_owners.auth_user_id → salon_owners.salon_id → salons.id

alter table public.salon_owners
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null;

create unique index if not exists salon_owners_auth_user_id_uidx
  on public.salon_owners (auth_user_id)
  where auth_user_id is not null;

create index if not exists salon_owners_salon_id_auth_idx
  on public.salon_owners (salon_id, auth_user_id);

comment on column public.salon_owners.auth_user_id is
  'Supabase Auth user for the salon owner. auth.uid() → salon_owners → salons.';

-- Owner can read their own ownership row
drop policy if exists "Salon owners read own row" on public.salon_owners;
create policy "Salon owners read own row"
  on public.salon_owners
  for select
  to authenticated
  using (auth_user_id = auth.uid());

-- Owner can update their own row (profile fields; not used for privilege escalation)
drop policy if exists "Salon owners update own row" on public.salon_owners;
create policy "Salon owners update own row"
  on public.salon_owners
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Owners can read their salon (even if not publicly "active")
drop policy if exists "Salon owners read own salon" on public.salons;
create policy "Salon owners read own salon"
  on public.salons
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.salon_owners so
      where so.salon_id = salons.id
        and so.auth_user_id = auth.uid()
    )
  );

-- Owners can update their salon
drop policy if exists "Salon owners update own salon" on public.salons;
create policy "Salon owners update own salon"
  on public.salons
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.salon_owners so
      where so.salon_id = salons.id
        and so.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.salon_owners so
      where so.salon_id = salons.id
        and so.auth_user_id = auth.uid()
    )
  );

-- Dashboard reads: bookings / customers / staff / services / reviews for owned salon
drop policy if exists "Salon owners read own bookings" on public.salon_bookings;
create policy "Salon owners read own bookings"
  on public.salon_bookings
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.salon_owners so
      where so.salon_id = salon_bookings.salon_id
        and so.auth_user_id = auth.uid()
    )
  );

drop policy if exists "Salon owners read own customers" on public.salon_customers;
create policy "Salon owners read own customers"
  on public.salon_customers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.salon_owners so
      where so.salon_id = salon_customers.salon_id
        and so.auth_user_id = auth.uid()
    )
  );

drop policy if exists "Salon owners read own staff" on public.salon_staff;
create policy "Salon owners read own staff"
  on public.salon_staff
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.salon_owners so
      where so.salon_id = salon_staff.salon_id
        and so.auth_user_id = auth.uid()
    )
  );

drop policy if exists "Salon owners read own services" on public.salon_services;
create policy "Salon owners read own services"
  on public.salon_services
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.salon_owners so
      where so.salon_id = salon_services.salon_id
        and so.auth_user_id = auth.uid()
    )
  );

drop policy if exists "Salon owners read own reviews" on public.reviews;
create policy "Salon owners read own reviews"
  on public.reviews
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.salon_owners so
      where so.salon_id = reviews.salon_id
        and so.auth_user_id = auth.uid()
    )
  );
