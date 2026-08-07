# AllBook Marketplace — Project Audit 001

| Field | Value |
|-------|-------|
| **Audit ID** | `project-audit-001` |
| **Date** | 2026-08-07 |
| **Scope** | Full repository (`src/`, `supabase/`, app routes, APIs) |
| **Mode** | Report only — no code changes |
| **Product posture** | Private Preview Mode **ON by default** (`PRIVATE_PREVIEW_MODE` unset → enabled) |

---

## Executive summary

AllBook has two mature product surfaces:

1. **Tenant SaaS (DaySpa-style)** — admin, booking, staff, rooms, Stripe, push — largely **LIVE**.
2. **Marketplace** — search, salon pages, Google import/sync, review queue, registration — largely **LIVE** but **preview-gated**; owner salon ops and marketplace payments are incomplete.

The platform is **not ready for public launch**. Highest risks are **RLS policies that expose booking/customer PII to anon**, an **unauthenticated admin booking mutate API**, and **nav that advertises placeholder features**.

### Priority legend

| Priority | Meaning |
|----------|---------|
| **Critical** | Security or data exposure; fix before any broader exposure |
| **High** | Blocks or misleads launch; fix before public preview ends |
| **Medium** | Debt that will slow shipping or confuse operators |
| **Low** | Cleanup, docs, polish |

---

## Priority findings (cross-cutting)

| Priority | Finding | Category |
|----------|---------|----------|
| **Critical** | `/api/admin/bookings/[id]` PATCH/DELETE uses service role with **tenant resolve only** — no admin/staff session | API / Auth |
| **Critical** | Anon SELECT on dayspa `bookings` (`bookings_realtime_select` `using (true)`) | Auth / DB |
| **Critical** | Anon SELECT on `salon_bookings` (customer name/email/phone readable with anon key) | Auth / DB |
| **Critical** | Open RLS on `push_subscriptions` / `booking_alert_events` (`using (true)`) | Auth / DB |
| **Critical** | Private Preview ON — correct for now; turning it off without fixing SEO/samples/RLS would expose the platform | SEO / Product |
| **High** | Spoofable `x-tenant-slug` on public `/api/booking/*` + service role → cross-tenant risk | Auth / API |
| **High** | Middleware gates **all** `/platform/*` to platform admin — clashes with salon-owner `/platform/salon` | Auth / Routes |
| **High** | `salon_owners` UPDATE policy does not lock `salon_id` / `role` | Auth / DB |
| **High** | Many nav targets are placeholders (platform, salon owner, tenant gallery/settings) | UI / Features |
| **High** | Design samples + apex `/booking` demo remain public under Private Preview | Routes / Mock |
| **High** | Marketplace online payment / deposit gateway not implemented (policy can require; API rejects) | Features |
| **High** | Post-preview sitemap only lists `/` and `/booking` | SEO |
| **Medium** | Staff list falls back to `mock-staff` when API fails | Mock |
| **Medium** | `setup.sql` still contains open ALL policies — unsafe if used as prod source of truth | DB |
| **Medium** | God-file `room-home-content.tsx` (~1500+ lines) | Quality |
| **Low** | Docs shells empty; unused mock modules; deprecated re-exports | Quality / Docs |

---

## 1. Route audit

### 1.1 Inventory (approx.)

- **~79** `page.tsx` app routes
- **~98** `api/**/route.ts` handlers
- Layout groups: `(public)`, `(auth)`, `(landing)`, `(mobile-samples)`, `(dashboard)`, `admin`, `platform`, `room`, `staff`, `docs`

### 1.2 Dead / redirect routes

| Route | Behavior | Priority |
|-------|----------|----------|
| `/search` | `redirect("/")` — search UX lives on home / category | Medium |
| `/salon/[id]` | Redirect to `/{category}/{slug}` | Low |
| `/booking/samples/7` | `redirect("/booking")` | Low |
| `/api/salons` | Deprecated twin of `/api/search/salons` | Medium |

### 1.3 Placeholder pages

| Route | Component | Priority |
|-------|-----------|----------|
| `/shops` | “future release” stub | High (header still links on tenant) |
| `/dashboard` | “future release” stub | Medium |
| `/admin/gallery`, `/admin/settings` | `AdminPlaceholderPage` | High |
| `/platform/subscription`, `/users`, `/reports`, `/settings` | `PlatformPlaceholderPage` | High |
| `/platform/salon/bookings`, `/calendar`, `/gallery`, `/reviews`, `/marketing`, `/analytics` | `SalonDashboardPlaceholder` | High |

### 1.4 Mock / sample routes

| Route | Notes | Priority |
|-------|-------|----------|
| `/landing/samples`, `/1`–`5` | Design samples — **preview-protected** | High (if preview OFF) |
| `/booking/samples`, `/1`–`6`, `/8`–`11` | Booking UI mocks — **OPEN** (not preview-gated) | **High** |
| `/booking` (apex) | `PlatformDemoBooking` — **OPEN** | **High** |
| `/admin/bookings/samples*` | Sample UI — not in sidebar | Medium |

### 1.5 Private Preview gating

**Protected** (non-admin → `/`): `/search`, `/shops`, `/salon/*`, `/register`, `/landing/*`, marketplace category paths.

**Docs** (non-admin → `/platform/login`): `/docs/*`.

**Open:** `/`, `/login`, `/signup`, `/auth/*`, `/admin/*`, `/staff/*`, `/booking/*`, `/room/*`, `/dashboard/*`, `/api/*`, `/platform/*` (platform has its own admin gate), tenant-prefixed SaaS paths.

### 1.6 Duplicate / conflicting routing

| Issue | Priority |
|-------|----------|
| Soft duplicate: `/salon/[id]` vs `/{category}/{slug}` | Low |
| **Architecture conflict:** middleware requires platform admin for `/platform/*`, but salon layout expects salon owners | **High** |

---

## 2. Authentication audit

### 2.1 Role model

| Role | Mechanism | Surface |
|------|-----------|---------|
| Platform admin | Supabase Auth + `profiles.role = 'admin'` | `/platform` (import/sync/review/…) |
| Salon owner | Supabase Auth + `salon_owners.auth_user_id` | Intended `/platform/salon*` (blocked by middleware for non-admins) |
| Tenant admin | Cookie JWT `allbook_admin_session` | `/admin/*` |
| Staff | Cookie JWT + PIN / `staff_accounts` | `/staff/*`, room ops |
| Room tablet | Cookie JWT room claim (+ staff for mutations) | `/room/*` |

### 2.2 `auth.uid()` (SQL)

Used in migrations for:

- `profiles` self-select
- `salon_owners` / owner-managed salon tables
- `favorites`
- Booking policy + business settings owner policies

App ownership helpers: `getOwnerSalon.ts`, `ownerOwnsSalon`, `requireOwnerSalon`.

### 2.3 Service role usage

`createServiceSupabase()` (`src/lib/supabase/service.ts`) is used widely across admin/room/staff/booking/platform/cron routes and **bypasses RLS**. Non-production may fall back to anon key.

**Implication:** every mutating route must enforce session + tenant/ownership in app code. Gaps are full-database risks.

### 2.4 Ownership / cross-tenant risks

| Finding | Priority |
|---------|----------|
| Public `/api/booking/*` resolves tenant via host **or client `x-tenant-slug`**, then service-role writes — spoofable cross-tenant | **High** |
| Admin/staff/room sessions generally check `session.tenantId === tenant.id` | Positive |
| Marketplace salons are global catalog (by design) | Info |
| Room login claims room without password (physical-device trust model) | Medium (by design) |

### 2.5 Missing / weak RLS

| Policy / state | Risk | Priority |
|----------------|------|----------|
| `bookings_realtime_select` `using (true)` | Anon read all dayspa bookings (PII) | **Critical** |
| `salon_bookings` public SELECT (non-deleted) | Anon read marketplace booking PII | **Critical** |
| Push + booking_alert `using (true)` | Anon R/W/D subscriptions & alerts | **Critical** |
| `salon_customers` public INSERT | Spam / fake PII | High |
| `salon_bookings` public INSERT pending/confirmed | Spam bookings | High |
| `salon_owners` UPDATE without locking `salon_id`/`role` | Ownership re-point | **High** |
| CRM tables with RLS and no policies | Locked to service role (OK if only server uses) | Info |
| `staff_accounts.pin` plaintext column | Exposure if RLS reopens / logs | Medium |
| `setup.sql` open ALL policies | Dangerous if applied as prod | **Medium** |

---

## 3. Database audit

### 3.1 Main table groups

- **Tenant ops:** `tenants`, `staff`, `staff_photos`, `staff_accounts`, `admin_accounts`, `rooms`, `bookings`, `booking_staffs`, `booking_extend_requests`, `service_options`, `payments`, `booking_alert_events`, `push_subscriptions`
- **Platform auth:** `profiles`, `platform_owner_profiles`, `tenant_memberships`
- **Marketplace:** `salons`, `salon_owners`, `salon_images`, `salon_staff`, `salon_services`, CRM tables, policies, categories, suburbs, reviews, favorites
- **Settings / Google / review:** `platform_settings`, `salon_settings`, `salon_feature_flags`, `salon_integration_slots`, `google_sync_*`, `marketplace_business_events`

### 3.2 Unused / barely used

| Object | Notes | Priority |
|--------|-------|----------|
| `favorites` | Types only in `src` | Medium |
| `business_hours` | App uses `salons.opening_hours` jsonb | Medium |
| `salon_service_staff` | Runtime uses `salon_staff_services` | Medium |

### 3.3 Duplicate / overlapping fields

| Duplication | Priority |
|-------------|----------|
| `salon_services.duration` ↔ `duration_minutes`; `is_active` ↔ `status`/`active` | Medium |
| `salon_customers.full_name` ↔ `first_name`/`last_name` | Low |
| `opening_hours` jsonb ↔ `business_hours` rows | Medium |
| `salon_service_staff` ↔ `salon_staff_services` | Medium |
| Google snapshot photos ↔ owner `salon_images` | Info (intentional) |

### 3.4 Seed / demo / mock data

| Source | Content | Priority |
|--------|---------|----------|
| `supabase/seed.sql` | DaySpa tenant + admin module flags | Info |
| `supabase/setup.sql` | DaySpa rooms + service options (+ stale open RLS) | Medium |
| `features/dashboard/mock-data.ts` | Deprecated; unused by live loaders | Low |
| `features/staff/config/mock-staff.ts` | Fallback in staff UI | **High** |
| `booking-staff-mock.ts` (+ dark) | Samples / demo booking | High |
| Migration example salons (e.g. Glow Hair) | Import/demo rows | Low |

---

## 4. API audit

### 4.1 Cross-cutting

- **No Zod** in API routes — manual validation only
- **No TODO/FIXME** inside `src/app/api/**/route.ts`
- Error handling generally consistent on admin/room/staff; some public routes return raw messages
- Service role after auth is common and acceptable **when** auth is present

### 4.2 Critical / high-risk endpoints

| Path | Methods | Auth | Issue | Priority |
|------|---------|------|-------|----------|
| `/api/admin/bookings/[id]` | PATCH, DELETE | Tenant only | Missing `requireTenantAndAdminActor` | **Critical** |
| `/api/booking/*` | various | Tenant resolve only | Public by design; slug spoof risk | High |
| `/api/salon-booking*` | POST/GET | Public + service role | Marketplace create; spam/PII | High |
| `/api/places/photo` | GET | None | Proxies Google Photos with server key — cost abuse | High |
| `/api/booking/alert` | POST | Tenant only | Unauthenticated alert fire | Medium |
| `/api/maintenance/*` | GET | Cron header **or** token | Cron header spoofable off-Vercel | Medium |
| `/api/room/auth/login` | POST | Tenant + claim | No password (by design) | Medium |
| `/api/stripe/webhook` | POST | Stripe signature | Sound | Positive |
| `/api/cron/google-sync` | POST/GET | `Bearer MAINTENANCE_TOKEN` | Sound if token set | Positive |

### 4.3 Generally well-gated areas

| Area | Auth helper |
|------|-------------|
| Most `/api/admin/*` (except bookings `[id]` mutate) | `requireTenantAndAdminActor` |
| `/api/platform/import|sync|review/*` | `requirePlatformAdmin` |
| `/api/platform/salon/settings*`, booking-policy | `requireOwnerSalon` |
| `/api/room/*` mutations | room + staff session |
| `/api/staff/*` | `requireStaffSession` |

### 4.4 Validation / error handling

| Topic | Assessment | Priority |
|-------|------------|----------|
| Validation | Manual presence/type checks; uneven depth | Medium |
| Schema validation library | Not used on APIs | Medium |
| Typed auth errors | Good on admin/room/staff | Positive |
| Info leak via `error.message` | Occasional on public routes | Low |

---

## 5. Feature status

| Feature | Status | Notes |
|---------|--------|-------|
| Marketplace search/browse | **LIVE** (gated) | Preview-protected; `/search` redirects home |
| Category marketplace | **LIVE** | hair, nails, spa, barber, massage, facial, waxing |
| Salon pages | **LIVE** | `/{category}/{slug}` |
| Salon registration | **LIVE** | `/register` + `/api/register/salon` |
| Google import | **LIVE** | `/platform/import` |
| Google sync | **LIVE** | `/platform/sync` + cron |
| Marketplace review queue | **LIVE** | `/platform/review` |
| Booking & payment policy engine | **PARTIAL** | DB/UI live; marketplace online payment not wired |
| Business settings engine | **PARTIAL** | Shell + policy groups; many flags are prefs only |
| Private preview | **LIVE** | Default ON |
| Platform admin (core) | **PARTIAL** | Live: dashboard, tenants, import, sync, review; placeholders: users, subscription, reports, settings |
| Platform salon owner portal | **PARTIAL** | Live: services, staff, customers, business, settings; placeholders: bookings, calendar, gallery, reviews, marketing, analytics |
| Tenant SaaS admin | **LIVE** | Gaps: gallery, settings placeholders |
| Tenant booking | **LIVE** | |
| Staff portal | **LIVE** | |
| Room portal | **LIVE** | |
| Stripe (tenant checkout) | **PARTIAL** | Live for tenant SaaS; marketplace capture missing |
| Push notifications | **LIVE** | |
| Platform auth / signup | **LIVE** | |
| Documentation | **PLACEHOLDER** | Locale shells only |
| Landing samples | **MOCK** | |
| Booking samples / apex demo | **MOCK** | |
| `/shops` | **NOT IMPLEMENTED** | Stub page |
| Featured salon flag | **PLACEHOLDER** | UI only |
| Review replies | **NOT IMPLEMENTED** | “coming soon” |
| Google Calendar / GBP integrations | **NOT IMPLEMENTED** | Settings slots only |

---

## 6. Mock audit

### 6.1 Remaining MOCK / SAMPLE / DEMO / PLACEHOLDER surfaces

| Area | Paths | Priority |
|------|-------|----------|
| Landing samples | `src/app/(landing)/landing/samples/**`, `landing-sample-*.tsx` | High |
| Booking samples | `src/app/(mobile-samples)/booking/samples/**`, `booking/components/samples/**` | High |
| Platform demo booking | `platform-demo-*.tsx`, apex `/booking` | High |
| Staff mock fallback | `mock-staff.ts` + `staff-list-content.tsx` | High |
| Dead mock modules | `dashboard/mock-data.ts`, unused platform `dashboard.ts` mocks | Medium |
| Placeholder page triad | Admin / Platform / SalonDashboard placeholders | High |
| Salon booking mock context | `salon-booking/mock-context.ts` (deprecated stub) | Low |
| Unused `MapPlaceholder.tsx` | Export only | Low |

### 6.2 TODO / FIXME / FAKE

- Product `TODO`/`FIXME`/`FAKE` markers: **essentially none** in API routes and sparse in app code.
- Many `placeholder=` hits are HTML input attributes — **ignore**.
- “Coming soon” / “future release” copy on stub pages — see §1.3 / §5.

---

## 7. Google integration audit

### 7.1 In use (real)

| API | Where | Env |
|-----|-------|-----|
| Places API (New) — text search + details | `google-import/places-client.ts`, sync engine | `GOOGLE_PLACES_API_KEY` → `GOOGLE_MAPS_API_KEY` → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Places Photo media (proxied) | `/api/places/photo` | Same server keys |
| Geocoding | `places-client.ts`, `search/geocode.ts` | Maps keys |
| Maps JS + Places Autocomplete | Registration / map components | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Google OAuth login | `/api/platform/auth/oauth` via Supabase | Supabase Auth provider |

### 7.2 Planned / stub

| Item | Status | Priority |
|------|--------|----------|
| `google_calendar` / `google_business` integration slots | Registry only — no live API | Medium |
| Search-time Google | Explicitly not used (AllBook DB only) | Info |

### 7.3 Fake vs real data

| Path | Real Google? |
|------|--------------|
| Platform Import → upsert salon | **Yes** |
| Google Sync → Google-managed columns only | **Yes** |
| Registration “Continue with Google” | **Yes** (Autocomplete) then owner edits |
| Catalog / search / booking | AllBook DB (may contain imported rows) |
| Booking/landing samples | **Fake** UI |

---

## 8. UI audit

### 8.1 Broken / misleading navigation

| Issue | Priority |
|-------|----------|
| Platform nav links to placeholder pages (users, subscription, reports, settings) | High |
| Salon owner nav links to 6 placeholder modules | High |
| Tenant admin Gallery / Settings placeholders in sidebar | High |
| Tenant header → `/shops` stub | High |
| `/search` any remaining links never show search (redirect) | Medium |

### 8.2 404 vs soft-dead

- Placeholder pages return **200** with “Coming soon” — not hard 404s.
- Docs locale routes exist as **shells** (no real doc bodies).

### 8.3 Empty / dead UX

| Surface | Notes | Priority |
|---------|-------|----------|
| Docs `/docs/en|ko|zh` | Manual content not written | Low |
| Empty staff list → mock staff (silent) | Can show fake data | High |
| Sample galleries | Intentionally non-product | High if public |

### 8.4 Buttons / CTAs

| Surface | Notes | Priority |
|---------|-------|----------|
| Private Preview “Request Early Access” | `mailto:hello@allbook.com.au` | Low (verify inbox) |
| Landing sample CTAs | Mix of `/platform`, `/signup`, external dayspa booking, `#` anchors | Medium |
| Admin sample pages | Thin links back to bookings | Low |

---

## 9. SEO audit

| Asset | Preview ON | Preview OFF | Priority |
|-------|------------|-------------|----------|
| `robots.ts` | `Disallow: /` | Allow `/`; disallow admin/platform/staff/room/api | Positive while preview |
| `sitemap.ts` | `[]` | Only `/` + `/booking` | **High** for launch |
| Root / public metadata | `noindex, nofollow` | Indexable platform SEO | Positive while preview |
| Docs / admin / platform / staff / room | noindex | noindex | Positive |
| Landing & booking **samples** | Rely on global preview robots | May become indexable | **High** |
| Apex `/booking` | Demo UI | Would be indexable | Medium |

**Verdict:** SEO lockdown for Private Preview is **strong**. Public-launch SEO is **not ready** (thin sitemap; samples; demo booking).

---

## 10. Code quality

### 10.1 Large files (>500 lines)

| ~Lines | Path | Priority |
|--------|------|----------|
| 2468 | `src/types/database.ts` (generated) | Low |
| 1513 | `features/room-portal/components/room-home-content.tsx` | High |
| 783 | `landing-sample-vista.tsx` | Medium (sample) |
| 702 | `staff/components/staff-form.tsx` | Medium |
| 689 | `booking-checkout-flow.tsx` | Medium |
| 682 | `booking/lib/schedule-utils.ts` | Medium |
| 674 | `components/ui/sidebar.tsx` (shadcn) | Low |
| 621 | `landing-sample-pulse.tsx` | Medium (sample) |
| 615 | `booking-form-sheet.tsx` | Medium |
| 607 | `staff-shift-calendar.tsx` | Medium |
| 549 | `staff-guide-timeline.tsx` | Medium |
| 526 | `admin-review-queue-panel.tsx` | Medium |

### 10.2 Dead / unused / deprecated

| Item | Priority |
|------|----------|
| `dashboard/mock-data.ts` unused | Medium |
| Platform `dashboard.ts` mocks / unused recent-tenants table | Medium |
| `MapPlaceholder.tsx` unused | Low |
| Deprecated: `/api/salons`, `admin-theme`, `siteConfig`, various compat aliases | Low–Medium |
| Dual staff trees: `components/staff/*` vs `features/staff/*` | Medium |

### 10.3 Duplicate patterns

| Pattern | Priority |
|---------|----------|
| Search UI: `HeroSearch` / `SearchBar` / `SearchToolbar` | Medium |
| Three placeholder page components | Low |
| Three parallel fake-booking surfaces (landing samples, booking samples, platform demo) | High (product noise) |

---

## Recommended remediation order (report only — not executed)

1. **Critical security:** lock RLS on bookings / salon_bookings / push / alerts; add auth to `/api/admin/bookings/[id]`; constrain `salon_owners` UPDATE; harden tenant resolution on public booking APIs.
2. **High product honesty:** hide or gate sample/demo routes; replace or remove placeholder nav items; resolve `/platform` admin vs owner conflict.
3. **High launch readiness:** marketplace payments decision; sitemap + sample `noindex`; remove staff mock fallback.
4. **Medium cleanup:** deprecate duplicate tables/fields; split `room-home-content`; remove dead mocks; treat `setup.sql` as non-prod.

---

## Appendix A — Auth surfaces quick map

```
Platform admin  → Supabase Auth + profiles.role=admin → /platform
Salon owner     → Supabase Auth + salon_owners        → /platform/salon* (middleware conflict)
Tenant admin    → admin_accounts cookie              → /admin/*
Staff           → staff_accounts / PIN cookie        → /staff/*
Room            → room claim JWT (+ staff)           → /room/*
Public market   → anon / preview gate                → /, categories, register (gated)
```

## Appendix B — Audit method

- Route/API inventory under `src/app`
- Grep for MOCK/TODO/PLACEHOLDER/SAMPLE/DEMO/FAKE, `auth.uid()`, service role, RLS `using (true)`
- Migration + `setup.sql` / `seed.sql` review
- Feature classification from live pages + API wiring
- File size scan for >500-line modules
- No runtime penetration testing; no production data inspection
- **No code modified** for this audit

---

*End of project-audit-001*
