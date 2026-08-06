-- DaySpa: hide unused admin modules (customers, gallery, settings).
-- Other tenants keep defaults (all visible) unless configured in settings jsonb.

update public.tenants
set
  settings = coalesce(settings, '{}'::jsonb) || jsonb_build_object(
    'adminModules', jsonb_build_object(
      'customers', false,
      'gallery', false,
      'settings', false
    )
  ),
  updated_at = now()
where slug = 'dayspa';
