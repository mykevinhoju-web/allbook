-- Extra customer amount for out-call bookings, per service duration.
alter table public.service_options
  add column if not exists outcall_price_cents int not null default 0
  check (outcall_price_cents >= 0);

comment on column public.service_options.outcall_price_cents is
  'Added to the customer total when the booking is an out call (cents).';
