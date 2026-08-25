-- Hide guests from the admin customer list without deleting bookings.
alter table public.tenant_customer_flags
  add column if not exists hidden boolean not null default false;

comment on column public.tenant_customer_flags.hidden is
  'When true, the guest is removed from the admin customer list. Bookings stay on reports.';
