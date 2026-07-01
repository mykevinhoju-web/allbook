# Roadmap — 개발 로드맵

## 1. 개요

AllBook의 단계별 구현 계획입니다. **Admin Console은 초기 개발 범위**에 포함하며, 마사지샵(Massage)을 Phase 1 타깃으로 하고 이후 업종을 확장합니다.

**현재 상태**: 프로젝트 스캐폴딩·배포 완료 (allbook.com.au)  
**다음 단계**: Supabase 스키마 및 인증 구현

---

## 2. Phase 요약

| Phase | 기간 (예상) | 목표 |
|-------|-------------|------|
| **Phase 0** | 완료 | 프로젝트 셋업, 배포, 문서화 |
| **Phase 1** | 8~12주 | MVP — 예약·Dashboard·Admin |
| **Phase 2** | 6~8주 | 결제, 리뷰, 알림, 업종 확장 |
| **Phase 3** | 지속 | 성장, 분석, 모바일·B2B |

---

## 3. Phase 0 — Foundation ✅

| 작업 | 상태 |
|------|------|
| Next.js 15 + TypeScript + Tailwind + shadcn | ✅ |
| Feature 모듈 구조 스캐폴딩 | ✅ |
| Supabase 클라이언트 보일러플레이트 | ✅ |
| GitHub 연동 | ✅ |
| Vercel 배포 | ✅ |
| 도메인 allbook.com.au | ✅ |
| 개발 문서 (docs/) | ✅ |

---

## 4. Phase 1 — MVP (Core Product)

**목표**: 고객이 마사지샵을 검색·예약하고, Shop Owner가 운영하며, Admin이 플랫폼을 관리할 수 있는 최소 상용 버전.

### 4.1 Sprint 1 — Database & Auth (2주)

| # | 작업 | 산출물 |
|---|------|--------|
| 1.1 | Supabase 프로젝트 프로덕션 연동 | env 설정, Vercel secrets |
| 1.2 | DB migration: profiles, enums, business_categories | `supabase/migrations/` |
| 1.3 | DB migration: shops, shop_members, services | RLS policies |
| 1.4 | Auth: 회원가입, 로그인, 로그아웃 | `(auth)/` |
| 1.5 | Profile 자동 생성 트리거 | `profiles` sync |
| 1.6 | Middleware role guard 기초 | route protection |
| 1.7 | `database.ts` 타입 생성 | type sync |

**완료 기준**: Customer 계정 생성·로그인, 프로필 DB 저장

---

### 4.2 Sprint 2 — Admin Foundation (2주)

> Admin을 먼저 구축하여 Shop 승인·카테고리 관리 인프라 확보

| # | 작업 | 산출물 |
|---|------|--------|
| 2.1 | `(admin)` 라우트 그룹, Admin layout | `/admin` shell |
| 2.2 | Admin role guard (middleware + layout) | `assertAdmin()` |
| 2.3 | `audit_logs` migration + 기록 유틸 | audit trail |
| 2.4 | Categories CRUD (Admin) | `/admin/categories` |
| 2.5 | Users 목록·역할 변경 (Admin) | `/admin/users` |
| 2.6 | Admin 대시보드 placeholder stats | `/admin` |

**완료 기준**: Admin이 카테고리 생성, 사용자 role 변경, 감사 로그 기록

---

### 4.3 Sprint 3 — Shops & Services (2주)

| # | 작업 | 산출물 |
|---|------|--------|
| 3.1 | Shop 등록 신청 (Shop Owner) | onboarding flow |
| 3.2 | Shop 승인/거절 (Admin) | `/admin/shops` |
| 3.3 | Shop profile CRUD (Dashboard) | settings |
| 3.4 | Services CRUD (Dashboard) | `/dashboard/services` |
| 3.5 | Shop hours 설정 | `shop_hours` |
| 3.6 | 공개 샵 목록·상세 (Customer, EN) | `/shops`, `/shops/[slug]` |
| 3.7 | massage 카테고리 시드 | seed data |

**완료 기준**: 승인된 샵이 공개 목록에 노출, 서비스 메뉴 표시

---

### 4.4 Sprint 4 — Staff & Scheduling (1.5주)

| # | 작업 | 산출물 |
|---|------|--------|
| 4.1 | Staff CRUD (Dashboard) | `/dashboard/staff` |
| 4.2 | Staff ↔ Service 할당 | `staff_services` |
| 4.3 | Staff schedules (기본) | `staff_schedules` |
| 4.4 | Staff 계정 초대 (선택) | email invite |

**완료 기준**: 직원별 제공 서비스·근무 시간 설정 가능

---

### 4.5 Sprint 5 — Booking Flow (2.5주)

| # | 작업 | 산출물 |
|---|------|--------|
| 5.1 | Slot 계산 로직 (server) | `features/booking` |
| 5.2 | 예약 생성 Server Action | 동시성 처리 |
| 5.3 | Customer 예약 UI (EN) | service → date → confirm |
| 5.4 | Booking confirmation 페이지 | `/bookings/[id]` |
| 5.5 | Customer 내 예약 목록 | `/account/bookings` |
| 5.6 | 예약 취소 | status → cancelled |
| 5.7 | Shop Owner 예약 캘린더 | `/dashboard/bookings` |
| 5.8 | 예약 상태 변경 (confirm, complete) | Dashboard |

**완료 기준**: E2E 예약 플로우 (검색 → 예약 → Dashboard 확인)

---

### 4.6 Sprint 6 — Polish & Launch (2주)

| # | 작업 | 산출물 |
|---|------|--------|
| 6.1 | 에러·로딩·empty state | UI Guide 준수 |
| 6.2 | SEO (metadata, sitemap) | |
| 6.3 | 이미지 업로드 (Shop cover) | Supabase Storage |
| 6.4 | E2E 테스트 (Playwright) | 핵심 플로우 |
| 6.5 | Sentry 연동 | error tracking |
| 6.6 | 성능·보안 점검 | Lighthouse, RLS audit |
| 6.7 | 프로덕션 Supabase env 최종화 | placeholder 제거 |

**완료 기준**: Phase 1 MVP 릴리스 (allbook.com.au)

---

## 5. Phase 1 MVP 체크리스트

### Customer (English UI)

- [ ] Browse massage shops
- [ ] View shop detail & services
- [ ] Book appointment (date/time)
- [ ] View & cancel my bookings
- [ ] Sign up / Sign in

### Shop Owner

- [ ] Register shop (pending approval)
- [ ] Manage shop profile & hours
- [ ] Manage services & staff
- [ ] View & manage bookings calendar

### Admin

- [ ] Admin console at `/admin`
- [ ] Approve / reject / suspend shops
- [ ] Manage users & roles
- [ ] Manage business categories
- [ ] Audit log for admin actions

### Platform

- [ ] RLS on all tables
- [ ] Production deployment stable
- [ ] Documentation up to date

---

## 6. Phase 2 — Growth

| 영역 | 기능 |
|------|------|
| **Payment** | Stripe — 예약 시 결제, 환불 정책 |
| **Reviews** | 고객 리뷰·평점 |
| **Notifications** | 이메일 (Resend), 예약 리마인더 |
| **Categories** | beauty, nail, spa 활성화 |
| **Search** | 지역·거리 기반 검색 개선 |
| **Shop closures** | 임시 휴무 관리 |
| **Analytics** | Shop Owner 기본 통계 |

**예상 기간**: 6~8주

---

## 7. Phase 3 — Scale

| 영역 | 기능 |
|------|------|
| **i18n** | 고객 UI 다국어 (필요 시) |
| **Mobile** | PWA 또는 네이티브 검토 |
| **Promotions** | 쿠폰, 프로모션 |
| **Payouts** | 업체 정산 |
| **Franchise** | 멀티샵·프랜차이즈 지원 |
| **API** | Public API for partners |
| **Advanced Admin** | 수수료, 신고, 콘텐츠 관리 |

---

## 8. 우선순위 매트릭스

```
         Impact
           ▲
    High   │  Booking    Admin       Payment
           │  Flow       Approval
           │
    Medium │  Staff      Reviews     Search
           │  Schedules
           │
    Low    │  PWA        i18n        Franchise
           └──────────────────────────────► Effort
              Low        Medium       High
```

---

## 9. 리스크 및 완화

| 리스크 | 영향 | 완화 |
|--------|------|------|
| 동시 예약 충돌 | 높음 | DB constraint, 트랜잭션 |
| RLS 설정 오류 | 높음 | migration 리뷰, 통합 테스트 |
| Admin 권한 오남용 | 높음 | audit log, 이중 검증 |
| Supabase 비용 증가 | 중간 | 쿼리 최적화, 캐싱 |
| 호주 규제 (Privacy) | 중간 | PII 최소화, 법무 검토 |

---

## 10. 마일스톤 타임라인 (예상)

```
2026 Q3  ████████████ Phase 1 MVP Launch
2026 Q4  ████████     Phase 2 Payment & Reviews
2027 H1  ████████     Phase 3 Scale features
```

---

## 11. 문서·코드 동기화

각 Sprint 완료 시:

1. `docs/Database.md` — 스키마 변경 반영
2. `docs/PRD.md` — 범위 변경 시 업데이트
3. `docs/Roadmap.md` — 체크리스트 상태 갱신

---

## 12. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2026-07 | 초안 작성 |
