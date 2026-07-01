-- Seed data for local/staging environments.
-- DaySpa is the first tenant — data only, never hardcode in application code.

insert into public.tenants (
  slug,
  name,
  display_name,
  tagline,
  primary_domain,
  timezone,
  currency,
  locale,
  is_active
)
values (
  'dayspa',
  'DaySpa',
  'DaySpa',
  'Premium day spa and massage bookings in Sydney.',
  'dayspa.allbook.com.au',
  'Australia/Sydney',
  'AUD',
  'en-AU',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  display_name = excluded.display_name,
  tagline = excluded.tagline,
  primary_domain = excluded.primary_domain,
  updated_at = now();
