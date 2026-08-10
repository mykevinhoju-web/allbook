-- Owner-managed search keywords (editable in salon business profile).
-- Separate from auto-enriched search_keywords so enrichment never overwrites owner choices.

alter table public.salons
  add column if not exists owner_keywords text[] not null default '{}';

comment on column public.salons.owner_keywords is
  'Keywords set by the salon owner for marketplace search. Count capped by platform_settings marketplace.owner_keyword_limit.';

create index if not exists salons_owner_keywords_gin
  on public.salons using gin (owner_keywords);

-- Super-admin controllable limit (default 5).
insert into public.platform_settings (group_key, setting_key, value, description, updated_at)
values (
  'marketplace',
  'owner_keyword_limit',
  '5'::jsonb,
  'Max owner-managed search keywords per salon. Platform admin can raise this later.',
  now()
)
on conflict (group_key, setting_key) do nothing;
