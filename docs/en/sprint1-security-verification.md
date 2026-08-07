# Sprint 1 — Production Security & Launch Readiness

| Field | Value |
|-------|-------|
| **Date** | 2026-08-07 |
| **Scope** | Critical + High from project-audit-001 only |
| **Mode** | Fixes applied; Medium/Low reported only |

---

## 1. Critical issues fixed

| # | Issue | Status |
|---|-------|--------|
| 1 | `/api/admin/bookings/[id]` PATCH/DELETE without admin session | **Fixed** (prior + verified) — `requireTenantAndAdminActor` before service-role mutate |
| 2 | Anon read of booking PII on `bookings` / `salon_bookings` | **Fixed** — column grants exclude PII/status/payment; public SELECT dropped on `salon_bookings`; INSERT kept |
| 3 | Open RLS on `push_subscriptions` / `booking_alert_events` | **Fixed** (prior) — no anon/authenticated policies |
| 4 | service_role mutate without auth | **Fixed** — admin booking mutate, push subscribe session gate, register salon `authUserId` binding; remaining intentional public flows documented |

---

## 2. High issues fixed

| # | Issue | Status |
|---|-------|--------|
| 5 | Tenant spoofing via `x-tenant-slug` | **Fixed** — API resolve uses hostname + **signed** tenant cookie only; middleware strips client header |
| 6 | `/platform/*` forced platform-admin blocked salon owners | **Fixed** — `/platform/salon/*` requires authenticated user; layout enforces ownership; other `/platform/*` still admin-only |
| 7 | `salon_owners` UPDATE could change `salon_id` / `role` / `auth_user_id` | **Fixed** — immutable identity trigger + tightened UPDATE policy |
| 8 | Demo/sample routes open in Preview | **Fixed** — apex `/booking`, `/booking/*`, `/landing/*`, `/dashboard` gated like marketplace |
| 9 | Silent mock staff fallback | **Fixed** — empty/error state instead of fake staff |
| 10 | Placeholder nav items exposed | **Fixed** — removed from admin / platform / salon menus; removed Shops stub from header |
| 11 | SEO Preview Mode | **Verified** — `Disallow: /`, empty sitemap, `noindex` while preview ON |

---

## 3. Files changed

- `src/middleware.ts`
- `src/lib/admin/tenant-context.ts`
- `src/features/tenants/utils/tenant-slug-token.ts` *(new)*
- `src/features/private-preview/paths.ts`
- `src/features/admin/config/navigation.ts`
- `src/features/platform/config/navigation.ts`
- `src/features/platform/config/index.ts`
- `src/features/dashboard/navigation.ts`
- `src/features/staff/components/staff-list-content.tsx`
- `src/features/staff/config/index.ts`
- `src/features/salon-booking/index.ts`
- `src/components/common/site-header.tsx`
- `src/app/api/admin/bookings/[id]/route.ts` *(prior sprint)*
- `src/app/api/push/subscribe/route.ts` *(prior)*
- `src/app/api/register/salon/route.ts` *(prior)*
- `supabase/migrations/20260807134303_harden_critical_rls_pii.sql` *(prior)*
- `supabase/migrations/20260807140523_sprint1_security_launch.sql` *(new)*
- `docs/en/sprint1-security-verification.md` *(this report)*

---

## 4. Database policies changed

| Object | Change |
|--------|--------|
| `bookings` | Anon/auth SELECT limited to schedule columns only (no customer PII, notes, status, payment fields) |
| `salon_bookings` | Public SELECT removed; public INSERT (`pending`/`confirmed`) kept; owner SELECT kept |
| `push_subscriptions` | All `USING (true)` policies removed — service role only |
| `booking_alert_events` | All open policies removed — service role only |
| `salon_owners` | UPDATE still own-row only; trigger blocks changes to `salon_id`, `role`, `auth_user_id` |

---

## 5. Routes protected (Private Preview, apex)

Non-admin → `/`:

- Marketplace: `/search`, `/shops`, `/salon/*`, `/register`, `/{category}…`
- Samples/demo: `/landing/*`, `/booking`, `/booking/*`, `/dashboard`
- Docs: `/docs/*` → `/platform/login`

Still open (by design): `/`, `/login`, `/signup`, `/auth/*`, `/platform/*` (own gates), `/api/*`, tenant `/{slug}/admin|booking|staff|room`, subdomain tenant SaaS.

---

## 6. Remaining Medium issues

- `/api/booking/alert` remains public (customer “request staff”) — spam risk without rate limit
- `salon_customers` public INSERT still open
- Public marketplace booking spam (no captcha)
- `/api/places/photo` unauthenticated Google photo proxy (cost abuse)
- Maintenance cron header trust off-Vercel
- Dead mock modules still in repo (`mock-staff.ts`, `dashboard/mock-data.ts`, `recentTenantsMock`) — unused but not deleted this sprint
- Placeholder **pages** still exist at URLs if navigated directly (hidden from menus only)
- Dual staff component trees / large `room-home-content.tsx`
- Path-based apex SaaS depends on signed tenant cookie after first verified navigation

---

## 7. Remaining Low issues

- Docs locale shells empty
- Unused `MapPlaceholder`
- Deprecated re-exports / `/api/salons`
- Featured flag UI placeholder
- Review replies “coming soon”
- HTML input `placeholder=` noise in greps

---

## 8. Anything still preventing production launch

**Yes — keep Private Preview ON.** Not launch-ready as a public Marketplace:

1. Marketplace online payment / deposit gateway incomplete  
2. Owner salon modules (bookings/calendar/gallery/reviews/marketing/analytics) incomplete (routes exist, hidden from nav)  
3. Platform admin subscription/users/reports/settings incomplete  
4. SEO sitemap incomplete for post-preview public launch  
5. Sample/demo code still in repo (gated, not removed)  
6. Cross-cutting product polish (Medium items above)

Security Critical/High from audit-001 for this sprint are addressed; product completeness is not.
