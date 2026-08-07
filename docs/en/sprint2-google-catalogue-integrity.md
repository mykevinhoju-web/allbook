# Sprint 2 — Google Business Data Integrity

| Field | Value |
|-------|-------|
| **Date** | 2026-08-08 |
| **Scope** | Google catalogue integrity (no booking redesign) |

---

## 1. Google APIs currently used

| API | Status | Where |
|-----|--------|--------|
| **Places API (New) — Text Search** | **LIVE** | `google-import/places-client.ts` → `searchTextPlaces` (admin discovery / import only) |
| **Places API (New) — Place Details** | **LIVE** | `getPlaceDetails` — import commit + Google Sync Engine |
| **Geocoding API** | **LIVE** | Import geo bias (`geocodeImportCenter`); Marketplace search location resolve (`search/geocode.ts`) — **not** for business listing |
| **Places Photo media** | **LIVE** | Proxied via `/api/places/photo` (keys never stored in DB URLs) |
| **Maps JS + Places Autocomplete** | **LIVE** | Salon registration wizard (`GoogleRegistration`, Maps components) |
| **Google OAuth** | **LIVE** | Platform auth login (Supabase provider) — unrelated to catalogue |
| **Reviews API / review text sync** | **NOT USED** | Only aggregate `rating` + `userRatingCount` stored; individual Google reviews not imported |
| **Google Business Profile / Calendar** | **STUB** | Integration slots in Business Settings only |

### Fields already captured on import/sync

Place ID, name, address parts, lat/lng, phone, website, rating, review count, opening hours, categories/types, photo **references**, business status (Details + now Text Search), permanently closed flag.

---

## 2. Missing Google data

| Gap | Notes |
|-----|-------|
| Individual Google **reviews** (author/text) | Only aggregates |
| Editorial / editorialSummary | Not in field mask |
| Price level from Google | Not stored (local `price_tier` / `starting_price` prepared for owner enrichment) |
| Current opening hours / special hours | Regular hours only |
| Nationwide automated crawl schedule | Cron exists per city; Australia-wide orchestration not wired |
| Zero live Google-linked rows in prod today | See §3 |

---

## 3. Seed / demo data found (not deleted)

**Production snapshot (at audit):** `115` salons total — **`0` with `google_place_id`**, **`115` `source=manual`**.

| Pattern / name examples | Origin |
|-------------------------|--------|
| Glow Hair Studio (+ Glow Colour Bar / Cut & Colour / … variants) | Migrations `20260806070247_create_marketplace_salons.sql`, `20260806072537_salon_detail_tables.sql`, slug helpers |
| Luxe Beauty, Bella Nails, Pure Spa | `salon_detail_tables` seed amenities/services/reviews/images |
| Atelier / Aura / Bloom / Coastal / Crown / Frame … × suburbs | Bulk synthetic catalogue (manual, no Place ID) |
| Unsplash gallery URLs | Seed images in `salon_detail_tables` |
| Demo reviews (“marketplace demo authors”) | Same migration |
| UI samples (`/landing/samples`, `/booking/samples`, platform demo booking) | App routes — not `salons` rows |

**Action this sprint:** marked `is_synthetic = true` for all rows with `google_place_id IS NULL` and `source <> 'google'`. **No deletes.**

---

## 4. Import pipeline status

| Capability | Status |
|------------|--------|
| Admin Text Search discovery by geo + category | **LIVE** (`/platform/import`) |
| Upsert by **`google_place_id`** (unique partial index) | **LIVE** — no duplicate Place IDs |
| Store required catalogue fields + photo refs | **LIVE** (business status now written on import) |
| Claimed salons: Google fields only on re-import | **LIVE** |
| Owner registration “Continue with Google” | **LIVE** (Autocomplete → register API) |
| Australia-scale batch import ops | **PARTIAL** — geo cells exist; quota/ops runbook still needed |

Identity rule: **`google_place_id` is the unique Google identity** (`salons_google_place_id_uidx`).

---

## 5. Synchronisation status

| Capability | Status |
|------------|--------|
| Admin Sync UI (`/platform/sync`) | **LIVE** |
| Cron `/api/cron/google-sync` (Bearer `MAINTENANCE_TOKEN`) | **LIVE** |
| Refresh rating, review count, hours, status, photos (refs), address/phone/website | **LIVE** via Place Details |
| Snapshot hash → skip unchanged | **LIVE** |
| Never create duplicate salon rows | **LIVE** (update by salon id / place id) |
| Never overwrite owner-managed catalog fields | **LIVE** |
| Photo gallery rows (`salon_images`) on sync | Sync updates `google_photos` jsonb; gallery wipe/rebuild is import-time for unclaimed |

---

## 6. Marketplace search

- **Catalogue search = local DB only** (`searchSalons` → Supabase RPC / `salons`).
- Google is **not** queried for businesses at search time.
- Geocoding may resolve the **user’s typed location** only.

---

## 7. Search readiness (data model only — no UI)

Added (GIN-indexed where useful):

| Column | Purpose |
|--------|---------|
| `search_keywords` | Free-text tokens |
| `search_styles` | Styles filter |
| `search_brands` | Brands filter |
| `search_techniques` | Techniques filter |
| `search_features` | Extra feature tags |
| `amenities` (existing) | Amenities filter |
| `starting_price` / `price_min` / `price_max` / `price_tier` | Price filters |
| `search_availability_mode` | Future availability hint (not live inventory) |
| `is_synthetic` | Flag demo/seed rows |

---

## 8. Remaining blockers before importing all Australian businesses

1. **Ops:** Run city/category Google import jobs until synthetic share → 0 (or hide synthetics from marketplace).  
2. **Quota / cost:** Places Text Search + Details + Photos at national scale; need budget + rate limits.  
3. **Coverage plan:** Prioritise metros → states → long-tail suburbs; cron coverage matrix.  
4. **Review queue:** Imported rows enter `review_status=pending` — capacity for approve/hide.  
5. **Synthetic cleanup decision:** Soft-hide (`marketplace_visible=false`) vs delete vs Google-match merge — **not deleted this sprint**.  
6. **Enrichment:** Keywords/styles/brands/techniques/price_tier remain empty until owner or enrichment pipeline.  
7. **Keep Private Preview ON** until a real Google-backed subset is visible and reviewed.

---

## Files changed this sprint

- `supabase/migrations/20260807142938_sprint2_google_catalogue_integrity.sql`
- `src/features/google-import/places-client.ts` — `businessStatus` on Text Search
- `src/features/google-import/types.ts` / `map-place.ts` / `upsert-google-salon.ts` — persist status + clear synthetic on Google upsert
- `src/features/search/searchSalons.ts` — document local-only catalogue search
- `src/types/database.ts` — new salon columns
- `docs/en/sprint2-google-catalogue-integrity.md` — this report
