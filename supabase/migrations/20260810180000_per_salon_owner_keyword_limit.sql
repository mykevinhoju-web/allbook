-- Per-salon owner keyword limit (default 5).
-- Super-admin raises this for paying salons only — not a global setting.

alter table public.salons
  add column if not exists owner_keyword_limit integer not null default 5;

alter table public.salons
  drop constraint if exists salons_owner_keyword_limit_check;

alter table public.salons
  add constraint salons_owner_keyword_limit_check
  check (owner_keyword_limit >= 1 and owner_keyword_limit <= 30);

comment on column public.salons.owner_keyword_limit is
  'Max owner_keywords this salon may set. Default 5; platform admin raises for paying salons.';

-- Keep platform default as documentation only (new installs). Per-salon column is source of truth.
insert into public.platform_settings (group_key, setting_key, value, description, updated_at)
values (
  'marketplace',
  'owner_keyword_limit_default',
  '5'::jsonb,
  'Default owner_keyword_limit for new salons. Raising keywords for a paying salon is done per-business in /platform/businesses.',
  now()
)
on conflict (group_key, setting_key) do update
set
  description = excluded.description,
  updated_at = now();
