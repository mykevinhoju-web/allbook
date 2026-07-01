# Coding Rules — 코딩 규칙

## 1. 목적

본 문서는 AllBook 코드베이스의 **일관성**, **유지보수성**, **확장성**을 보장하기 위한 개발 규칙입니다. 상용 서비스로 수년간 운영할 것을 전제로 합니다.

---

## 2. 언어·로케일 규칙

| 대상 | 언어 |
|------|------|
| 코드 (변수, 함수, 파일명) | **English** |
| 고객 UI 텍스트 | **English** |
| 주석 (비자명 로직) | English 권장 |
| 커밋 메시지 | English |
| PR 설명·개발 문서 | **한국어** |
| Admin/Shop Dashboard UI | English (초기) |

---

## 3. 기술 스택 준수

- **Next.js 15** App Router — Pages Router 사용 금지
- **TypeScript** — `strict: true`, `any` 사용 금지 (불가피 시 주석 근거)
- **Tailwind CSS v4** — utility-first, semantic token 우선
- **shadcn/ui** — UI 기본 컴포넌트
- **Supabase** — DB, Auth; raw SQL은 migrations에만

---

## 4. 프로젝트 구조

### 4.1 디렉터리 책임

| 경로 | 책임 |
|------|------|
| `src/app/` | 라우트, 레이아웃, 페이지 **조합만** |
| `src/features/` | 도메인 로직, Server Actions, 도메인 UI |
| `src/components/ui/` | shadcn 컴포넌트 |
| `src/components/common/` | 앱 전역 공통 UI |
| `src/lib/` | 인프라 (Supabase, utils) |
| `src/types/` | 공유 타입, DB 생성 타입 |
| `src/config/` | 환경·사이트 설정 |
| `supabase/migrations/` | DB 스키마 변경 |

### 4.2 Feature 모듈 규칙

```
features/booking/
├── components/
├── hooks/
├── actions/        # Server Actions
├── types/
└── index.ts        # 유일한 public export
```

- 외부에서는 `@/features/booking`만 import
- `features/booking/components/BookingForm` 직접 import ❌
- Feature 간 순환 의존 ❌

### 4.3 파일 네이밍

| 종류 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase.tsx | `ShopCard.tsx` |
| 훅 | use + PascalCase.ts | `useBookingSlots.ts` |
| 유틸 | camelCase.ts | `formatPrice.ts` |
| Server Action | `actions.ts` 또는 `*.actions.ts` | `booking.actions.ts` |
| 타입 | `types/index.ts` | |
| 테스트 | `*.test.ts` / `*.test.tsx` | |

---

## 5. React·Next.js 규칙

### 5.1 Server vs Client

| 기준 | 선택 |
|------|------|
| 데이터 fetch, SEO | Server Component (기본) |
| useState, useEffect, 이벤트 | `"use client"` |
| Supabase 브라우저 클라이언트 | Client Component only |

- `"use client"`는 **필요한 컴포넌트에만** — leaf에 가깝게
- Server Component에서 secrets·service_role 사용 가능

### 5.2 데이터 변경

- **Server Actions** 우선 (폼, mutation)
- Route Handler: webhook, REST API, 외부 연동
- Client에서 직접 DB mutation ❌ (RLS 우회 위험)

### 5.3 라우트

- Route group: `(public)`, `(auth)`, `(dashboard)`, `(admin)`
- 동적 segment: `[slug]`, `[id]` — slug는 고객 URL, id는 내부 API
- `loading.tsx`, `error.tsx` — 핵심 라우트에 추가

---

## 6. TypeScript 규칙

```typescript
// ✅ Good
export interface Shop {
  id: string;
  name: string;
  category: BusinessCategory;
}

// ❌ Bad
export type Shop = any;
```

- DB 타입: `Database['public']['Tables']['shops']['Row']` 또는 래퍼 타입
- Enum: `src/types/`에 union type 정의, DB enum과 동기화
- `as` 단언 최소화 — Zod 등으로 runtime validation (Phase 1 후반~2)

---

## 7. 스타일 규칙

- Tailwind utility class 사용
- 반복 조합은 `cn()` + `cva` (shadcn 패턴)
- `components/ui/` 외부에서 ui 내부 파일 직접 수정 지양 — shadcn CLI로 업데이트
- 인라인 `style={{}}` — 동적 값 외 사용 금지

---

## 8. Supabase·보안

### 8.1 클라이언트

- `NEXT_PUBLIC_*` — anon key만
- `service_role` — **서버 전용**, env에만

### 8.2 RLS

- 모든 테이블 RLS ON
- 새 테이블 추가 시 migration에 policy 포함
- "나중에 RLS" ❌

### 8.3 권한 검증

```typescript
// Server Action 패턴 (개념)
async function approveShop(shopId: string) {
  const user = await getAuthenticatedUser();
  assertRole(user, "admin");
  // ... mutation + audit log
}
```

- UI 가드만으로 권한 처리 ❌ — 서버에서 반드시 재검증

### 8.4 Admin

- `/admin` 라우트 + Server Action 이중 검증
- Admin mutation마다 `audit_logs` INSERT

---

## 9. 에러 처리

- Server Action: `{ success: true, data } | { success: false, error: string }` 패턴 권장
- 사용자 메시지: 영어, 내부 상세는 로그만
- `console.log` 프로덕션 코드 ❌ — 구조화 로깅 (향후)
- try/catch: 복구 가능한 경계에서만

---

## 10. 환경 변수

- `.env.example` — 모든 필수 변수 문서화
- `src/config/env.ts` — 서버 필수 변수 검증
- 클라이언트 노출 변수는 `NEXT_PUBLIC_` prefix
- 비밀 값 커밋 ❌

---

## 11. Git·PR 규칙

### 11.1 브랜치

| 패턴 | 용도 |
|------|------|
| `master` | 프로덕션 |
| `feature/<name>` | 기능 개발 |
| `fix/<name>` | 버그 수정 |
| `docs/<name>` | 문서 |

### 11.2 커밋 메시지

```
<type>: <short description>

feat: add shop approval admin action
fix: prevent double booking on concurrent requests
docs: update database schema for staff schedules
refactor: extract booking slot calculator
```

Type: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### 11.3 PR

- 단일 목적 — 큰 PR 분할
- 스키마 변경 시 `docs/Database.md` + migration 동시 업데이트
- UI 변경 시 스크린샷 첨부 (고객 UI 영어 확인)
- 셀프 리뷰 체크리스트:
  - [ ] TypeScript 에러 없음
  - [ ] ESLint 통과
  - [ ] RLS / 서버 권한 검증
  - [ ] 고객 UI 영어

---

## 12. 테스트 (도입 계획)

| 레벨 | 대상 | 도구 |
|------|------|------|
| Unit | 슬롯 계산, 가격 포맷 | Vitest |
| Integration | Server Actions + DB | Vitest + Supabase local |
| E2E | 예약 플로우, Admin 승인 | Playwright |

- 핵심 비즈니스 로직(booking, auth) 우선 테스트
- PR CI에서 `lint` + `build` 필수 (Phase 1)

---

## 13. 성능

- 이미지: `next/image`, WebP, 적절한 `sizes`
- 무거운 Client Component: `dynamic import`
- N+1 쿼리 방지 — join 또는 batch fetch
- 불필요한 `"use client"` 제거

---

## 14. 의존성

- 새 패키지 추가 시 팀 합의 — 경량화 유지
- `npm audit` 주기적 확인
- shadcn 컴포넌트는 필요 시에만 추가 (`npx shadcn@latest add`)

---

## 15. 금지 목록

| 금지 | 이유 |
|------|------|
| `any` 남용 | 타입 안전성 |
| Feature 간 내부 import | 결합도 |
| Client에서 service_role | 보안 |
| 하드코딩 비밀 값 | 보안 |
| 고객 UI 한국어 | 제품 요구사항 |
| Tenant 이름 코드 하드코딩 (`"DaySpa"` 등) | Multi-Tenant 원칙 — env/DB 사용 |
| tenant 없는 비즈니스 쿼리 | 데이터 격리 |
| migration 없는 스키마 변경 | 재현성 |
| `app/`에 비즈니스 로직 100줄+ | 유지보수 |

---

## 16. 코드 리뷰 기준

1. **Correctness** — 요구사항·엣지 케이스
2. **Security** — RLS, role check, input validation
3. **Structure** — feature 경계, 적절한 레이어
4. **Readability** — 네이밍, 불필요한 추상화 없음
5. **Docs** — 스키마·API 변경 시 문서 동반

---

## 17. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2026-07 | 초안 작성 |
