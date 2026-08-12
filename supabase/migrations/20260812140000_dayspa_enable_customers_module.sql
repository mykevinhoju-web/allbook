-- DaySpa: show Customers in admin (keep gallery/settings hidden).

update public.tenants
set
  settings = jsonb_set(
    coalesce(settings, '{}'::jsonb),
    '{adminModules,customers}',
    'true'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'dayspa';
