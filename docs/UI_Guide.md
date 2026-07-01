# UI Guide — UI/UX 가이드

## 1. 개요

본 문서는 AllBook의 화면 설계·UI 구현 기준을 정의합니다.

| 영역 | UI 언어 | 비고 |
|------|---------|------|
| **고객 (Customer)** | **English** | 공개 사이트, 계정 |
| **Shop Dashboard** | English | 운영자·직원 |
| **Admin Console** | English (초기) | 플랫폼 관리 |
| **개발 문서** | 한국어 | 본 문서 |

---

## 2. 디자인 원칙

| 원칙 | 설명 |
|------|------|
| **Clarity** | 예약 플로우는 3~4단계 이내, 각 단계 목적 명확 |
| **Trust** | 상용 서비스 수준의 시각적 완성도, 일관된 브랜딩 |
| **Mobile-first** | 고객의 대부분은 모바일 — 터치 타깃 44px 이상 |
| **Accessibility** | WCAG 2.1 AA 목표, 충분한 대비·포커스 링 |
| **Consistency** | shadcn/ui 기반 공통 컴포넌트 재사용 |

---

## 3. 브랜드·비주얼

### 톤앤매너

- **Professional & Calm** — 웰니스·뷰티에 맞는 차분하고 신뢰감 있는 톤
- 과도한 장식 지양, 여백과 타이포그래피로 위계 표현

### 컬러 (shadcn CSS Variables)

- `globals.css`의 semantic token 사용 (`primary`, `muted`, `destructive` 등)
- 하드코딩 hex 지양 — 테마·다크모드 일관성 유지
- 상태 색상:
  - Confirmed: primary
  - Pending: muted / amber
  - Cancelled: destructive
  - Completed: secondary

### 타이포그래피

- **Font**: Geist Sans (기본), Geist Mono (코드·시간)
- **Heading**: `font-semibold`, `tracking-tight`
- **Body**: `text-base`, 보조 텍스트 `text-muted-foreground`

### 간격·레이아웃

- 최대 콘텐츠 너비: `max-w-6xl` (마케팅), `max-w-4xl` (폼)
- 섹션 간격: `gap-8` ~ `gap-16`
- 카드: `rounded-xl border bg-card`

---

## 4. 컴포넌트 계층

```
components/ui/          # shadcn/ui — 수정 최소화, 프로젝트 전역
components/common/      # SiteHeader, SiteFooter, PageShell
features/*/components/  # 도메인 전용 (BookingCalendar, ShopCard)
```

### shadcn/ui 사용 컴포넌트 (권장)

| 용도 | 컴포넌트 |
|------|----------|
| 버튼·링크 | Button |
| 폼 | Input, Label, Select, Textarea, Checkbox |
| 피드백 | Alert, Toast (Sonner) |
| 레이아웃 | Card, Separator, Sheet, Dialog |
| 데이터 | Table, Badge, Avatar |
| 날짜 | Calendar (예약 플로우) |
| Admin | Table, DropdownMenu, Tabs |

---

## 5. 화면 영역별 가이드

### 5.1 고객 — Public (English)

#### 공통 레이아웃

- **Header**: Logo (AllBook), Shops, Sign in / Account
- **Footer**: © Year AllBook, tagline, Terms, Privacy (Phase 2)

#### 홈 (`/`)

| 요소 | 영어 카피 예시 |
|------|----------------|
| Hero | "Book your next visit with AllBook" |
| Sub | "Discover massage shops, salons, nail studios, and spas." |
| CTA | "Browse shops" / "Sign in" |
| Category cards | Massage, Beauty, Spa & Nail |

#### 샵 목록 (`/shops`)

- 검색: "Search by name or suburb"
- 필터: Category, Suburb, Sort (Nearest, Rating — Phase 2)
- 카드: Shop name, category badge, suburb, "View shop"

#### 샵 상세 (`/shops/[slug]`)

- Hero: cover image, name, address, hours
- Services list: name, duration, price (e.g. "$85 · 60 min")
- CTA: "Book now"
- Reviews section (Phase 2)

#### 예약 플로우

| Step | Title (EN) |
|------|------------|
| 1 | Select service |
| 2 | Choose date & time |
| 3 | Confirm booking |
| 4 | Booking confirmed |

- 진행 표시: Step indicator (1/2/3)
- 가격·시간·타임존 명시 (AEST/AEDT)
- 에러: "This time slot is no longer available. Please choose another."

#### 계정 (`/account`)

- My bookings, Profile, Sign out
- 예약 상태 Badge: Pending, Confirmed, Cancelled, Completed

---

### 5.2 Shop Dashboard (English)

#### 레이아웃

- **Sidebar**: Dashboard, Bookings, Services, Staff, Settings
- **Top bar**: Shop name, notifications (Phase 2)

#### 주요 화면

| 화면 | 핵심 UI |
|------|---------|
| Dashboard | Today's bookings, upcoming count |
| Bookings | Calendar (day/week), status filters |
| Services | Table + Add service dialog |
| Staff | List, assign services |
| Settings | Shop profile, business hours |

#### 카피 예시

- "Add service", "Business hours", "No bookings for this day"

---

### 5.3 Admin Console (English)

Admin은 **별도 Shell** — 고객 사이트 Header와 분리.

#### 레이아웃

- **Sidebar (dark 또는 구분된 테마)**:
  - Dashboard
  - Shops (Approvals)
  - Users
  - Categories
  - Audit log
- **Breadcrumb** + page title

#### 시각적 구분

- Admin URL: `/admin/*`
- 고객 사이트와 명확히 다른 nav·배경으로 **오조작 방지**
- Destructive actions: 확인 Dialog 필수 ("Suspend shop", "Revoke admin")

#### 주요 화면

| 화면 | 설명 |
|------|------|
| `/admin` | Platform stats cards |
| `/admin/shops` | Pending / Active / Suspended tabs |
| `/admin/shops/[id]` | Approve, Reject, Suspend |
| `/admin/users` | Role assignment |
| `/admin/categories` | Business category CRUD |
| `/admin/audit` | Filterable audit log table |

#### Admin 카피 예시

- "Approve shop", "Reject application", "Platform overview"
- Empty state: "No pending applications"

---

## 6. 반응형 브레이크포인트

Tailwind 기본 breakpoint 사용:

| Prefix | Width | 용도 |
|--------|-------|------|
| (default) | < 640px | 모바일 — 단일 컬럼, bottom CTA |
| `sm` | 640px+ | |
| `md` | 768px+ | 태블릿 — 2컬럼 그리드 |
| `lg` | 1024px+ | Dashboard sidebar 표시 |
| `xl` | 1280px+ | Admin wide tables |

---

## 7. 상태·피드백

### Loading

- 페이지: Skeleton 또는 spinner (layout shift 최소화)
- 버튼: disabled + "Loading..." 또는 spinner icon

### Empty state

- 일러스트 또는 아이콘 + 설명 + CTA
- 예: "No shops found. Try a different search."

### Error

- 인라인 폼 에러: 필드 아래 `text-destructive`
- 페이지 에러: Alert + retry action
- 404: "Page not found" + link home

### Success

- Toast: "Booking confirmed", "Shop updated"
- 예약 완료: 전용 confirmation 페이지

---

## 8. 폼·입력

| 규칙 | 설명 |
|------|------|
| Label | 모든 input에 연결된 Label |
| Placeholder | 예시만, Label 대체 금지 |
| Validation | 클라이언트 UX + 서버 최종 검증 |
| Phone | 호주 형식 힌트 (+61) |
| Date/Time | 샵 timezone 기준 표시, ISO 저장 |
| Price | UI: `$85.00`, DB: `8500` cents |

---

## 9. 접근성 체크리스트

- [ ] 모든 이미지에 `alt` (장식은 `alt=""`)
- [ ] 버튼·링크 구분 명확 (div onClick 금지)
- [ ] Focus visible (`focus-visible:ring`)
- [ ] 색상만으로 상태 전달하지 않음 (아이콘·텍스트 병행)
- [ ] Dialog: focus trap, Esc 닫기
- [ ] 테이블: Admin에서 semantic `<table>` 또는 적절한 ARIA

---

## 10. 다크 모드

- `prefers-color-scheme` + `.dark` class 지원 (shadcn 기본)
- Phase 1: 시스템 설정 따름
- 고객·Dashboard 동일 토큰 사용

---

## 11. 아이콘

- **Lucide React** (shadcn 기본)
- 의미 중복 없이 라벨과 함께 사용

---

## 12. 금지 사항

- 고객 UI에 한국어 노출 ❌
- 인라인 스타일 남용 ❌
- 도메인 로직을 UI 컴포넌트에 직접 작성 ❌
- Admin 기능을 고객 라우트에 혼합 ❌
- 확인 없는 destructive action ❌

---

## 13. UI 문구 관리 (향후)

Phase 2에서 고객 UI 문자열을 `src/i18n/en.json` 등으로 분리 검토.  
Phase 1에서는 컴포넌트 내 영어 문자열 허용하되, **재사용 카피는 constants로 추출**.

```typescript
// 예: src/config/copy.ts (향후)
export const customerCopy = {
  booking: {
    confirmTitle: "Confirm your booking",
    successTitle: "Booking confirmed",
  },
} as const;
```

---

## 14. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2026-07 | 초안 작성 |
