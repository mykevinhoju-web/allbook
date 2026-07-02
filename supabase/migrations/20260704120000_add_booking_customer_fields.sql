-- Extra customer fields on bookings
alter table public.bookings
  add column if not exists customer_postcode text,
  add column if not exists customer_email text;
