-- Service enrichment tracking + search returns service_tags.
-- Applied remotely via MCP; kept here for repo parity.

alter table public.salons
  add column if not exists service_tags_synced_at timestamptz,
  add column if not exists services_enriched_at timestamptz;
