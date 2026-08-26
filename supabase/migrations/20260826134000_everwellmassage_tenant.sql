-- Everwell Massage tenant + custom domain (everwellmassage.com.au)
-- Booking attaches on this tenant host at /booking once services/staff are configured.

insert into public.tenants (
  slug,
  name,
  display_name,
  tagline,
  primary_domain,
  timezone,
  currency,
  locale,
  is_active,
  settings
)
values (
  'everwellmassage',
  'Everwell Massage',
  'Everwell Massage',
  'Your escape to total relaxation — massage and day spa in Brisbane.',
  'everwellmassage.com.au',
  'Australia/Brisbane',
  'AUD',
  'en-AU',
  true,
  jsonb_build_object(
    'adminModules', jsonb_build_object(
      'customers', true,
      'gallery', false,
      'settings', false
    )
  )
)
on conflict (slug) do update set
  name = excluded.name,
  display_name = excluded.display_name,
  tagline = excluded.tagline,
  primary_domain = excluded.primary_domain,
  timezone = excluded.timezone,
  settings = coalesce(public.tenants.settings, '{}'::jsonb) || excluded.settings,
  updated_at = now();
