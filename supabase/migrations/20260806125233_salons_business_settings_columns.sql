-- Salon business settings columns (not inside opening_hours jsonb).
-- verified already exists on salons — do not re-add.
-- featured does not exist on salons and is intentionally not added here.

alter table public.salons
  add column if not exists booking_enabled boolean not null default true,
  add column if not exists accept_new_customers boolean not null default true;

-- Backfill from legacy opening_hours.settings blob when present
update public.salons
set
  booking_enabled = coalesce(
    (opening_hours -> 'settings' ->> 'bookingEnabled')::boolean,
    booking_enabled
  ),
  accept_new_customers = coalesce(
    (opening_hours -> 'settings' ->> 'acceptNewCustomers')::boolean,
    accept_new_customers
  )
where opening_hours ? 'settings';

-- Strip settings from opening_hours — hours only
update public.salons
set opening_hours = opening_hours - 'settings'
where opening_hours ? 'settings';

comment on column public.salons.booking_enabled is
  'Owner setting: allow online bookings';
comment on column public.salons.accept_new_customers is
  'Owner setting: accept first-time customers';
