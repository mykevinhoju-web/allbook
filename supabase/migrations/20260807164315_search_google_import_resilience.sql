-- Resume tokens + partial_success for search-time Google Places fill.

alter table public.search_area_coverage
  add column if not exists resume_page_token text,
  add column if not exists pages_fetched integer not null default 0;

alter table public.search_google_import_runs
  add column if not exists pages_fetched integer not null default 0,
  add column if not exists remaining_pages integer not null default 0,
  add column if not exists resume_page_token text;

-- Widen status checks to allow partial_success.
alter table public.search_area_coverage
  drop constraint if exists search_area_coverage_last_status_check;

alter table public.search_area_coverage
  add constraint search_area_coverage_last_status_check
  check (
    last_status in (
      'pending',
      'ok',
      'failed',
      'skipped',
      'partial_success'
    )
  );

alter table public.search_google_import_runs
  drop constraint if exists search_google_import_runs_status_check;

alter table public.search_google_import_runs
  add constraint search_google_import_runs_status_check
  check (
    status in ('ok', 'failed', 'partial', 'partial_success', 'skipped')
  );

comment on column public.search_area_coverage.resume_page_token is
  'Places nextPageToken to resume after a transient page failure; null when complete.';
comment on column public.search_area_coverage.pages_fetched is
  'Number of Places Text Search pages successfully imported for this area.';
