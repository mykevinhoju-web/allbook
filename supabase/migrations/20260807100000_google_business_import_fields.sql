-- Google Business Import Engine: discovery metadata on salons.
-- Search architecture unchanged — marketplace search still queries salons only.

alter table public.salons
  add column if not exists source text not null default 'manual'
    check (source in ('google', 'manual', 'admin', 'owner')),
  add column if not exists claimed boolean not null default false,
  add column if not exists google_categories text[] not null default '{}',
  add column if not exists google_synced_at timestamptz,
  add column if not exists google_photos jsonb not null default '[]'::jsonb;

comment on column public.salons.source is 'Provenance of the listing row (google import vs manual/owner).';
comment on column public.salons.claimed is 'True after an owner claims this business; Google sync must not overwrite owner fields.';
comment on column public.salons.google_categories is 'Raw Google Places types/categories snapshot.';
comment on column public.salons.google_synced_at is 'Last successful Google Places snapshot sync.';
comment on column public.salons.google_photos is 'Google Places photo resource names (snapshot); not owner gallery.';

-- Backfill: rows created via Places registration
update public.salons
set source = 'google'
where google_place_id is not null
  and source = 'manual';

-- Claimed when an owner link exists
update public.salons s
set claimed = true
where exists (
  select 1 from public.salon_owners so where so.salon_id = s.id
);

-- Enforce one AllBook row per Google place
create unique index if not exists salons_google_place_id_uidx
  on public.salons (google_place_id)
  where google_place_id is not null;

create index if not exists salons_source_claimed_idx
  on public.salons (source, claimed);
