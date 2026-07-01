# Multi-Tenant Architecture

## 개요

**AllBook**은 Multi-Tenant 예약 플랫폼입니다.  
**DaySpa**는 첫 번째 Tenant(고객사)이며, 향후 여러 Tenant가 동일 플랫폼에서 운영됩니다.

| 개념 | 설명 |
|------|------|
| **Platform** | AllBook — 인프라·코드베이스·슈퍼관리 |
| **Tenant** | DaySpa 등 — 독립 브랜드·데이터 경계 |
| **Shop** | Tenant 소속 개별 매장 |

## 핵심 원칙

1. **코드에 Tenant 이름을 하드코딩하지 않는다** — DaySpa는 DB seed·환경 변수로만 존재
2. **모든 비즈니스 데이터는 `tenant_id`로 스코핑**한다
3. **UI는 현재 Tenant 브랜딩을 표시**한다 (`useTenant()`, `getTenant()`)
4. **플랫폼 브랜드(AllBook)**는 footer 등 보조 위치에만 표시

## Tenant 해석 (Resolution)

미들웨어가 요청마다 Tenant slug를 결정합니다.

```
우선순위:
1. 플랫폼 호스트(allbook.com.au, localhost) → 테넌트 없음
2. x-tenant-slug 헤더 (미들웨어 설정)
3. tenant_slug 쿠키
4. 서브도메인 ({slug}.allbook.com.au 또는 {slug}.localhost)
```

### 로컬 개발

```env
TENANT_SLUG=dayspa
NEXT_PUBLIC_TENANT_DISPLAY_NAME=DaySpa
NEXT_PUBLIC_TENANT_TAGLINE=Premium day spa and massage bookings in Sydney.
```

| Host | 역할 |
|------|------|
| `localhost:3000` | AllBook 플랫폼 랜딩 |
| `dayspa.localhost:3000` | DaySpa 테넌트 (고객 + `/admin`) |

Windows: `hosts` 파일에 `127.0.0.1 dayspa.localhost` 추가. 자세한 내용은 [LOCAL_DEV.md](./LOCAL_DEV.md).

### 프로덕션

| Host | 역할 |
|------|------|
| `allbook.com.au` | 플랫폼 랜딩 (리다이렉트 없음) |
| `dayspa.allbook.com.au` | DaySpa 테넌트 |
| `allbook.com.au/platform` | Super Admin |

- 서브도메인 `{slug}.allbook.com.au`에서 slug 자동 해석
- 루트 도메인은 테넌트 컨텍스트 없음 (플랫폼 모드)

## 코드 구조

```
src/features/tenants/
├── types/           # Tenant, TenantBranding
├── constants.ts     # 헤더·쿠키·env 키
├── utils/           # slug 해석
├── server/          # getTenant(), resolveTenantBySlug()
├── context/         # TenantProvider, useTenant()
└── index.ts
```

## 사용법

### Server Component

```tsx
import { getTenant } from "@/features/tenants";

export default async function Page() {
  const tenant = await getTenant();
  return <h1>{tenant.branding.displayName}</h1>;
}
```

### Client Component

```tsx
"use client";
import { useTenant } from "@/features/tenants";

export function Logo() {
  const tenant = useTenant();
  return <span>{tenant.branding.displayName}</span>;
}
```

## 데이터베이스

모든 비즈니스 테이블에 `tenant_id uuid not null references tenants(id)` 추가.

```
tenants
  └── shops (tenant_id)
        └── services, staff, bookings ...
```

RLS 정책은 `tenant_id` 기준으로 격리합니다.

## UI 브랜딩

| 위치 | 표시 |
|------|------|
| Header / Logo | `tenant.branding.displayName` |
| Hero / Tagline | `tenant.branding.tagline` |
| Admin Console | Tenant 이름 + "Admin Console" |
| Footer | Tenant © + "Powered by AllBook" |

## 금지 사항

```tsx
// ❌ Bad
const name = "DaySpa";

// ✅ Good
const tenant = await getTenant();
const name = tenant.branding.displayName;
```

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| 1.0 | 2026-07 | Multi-Tenant 기반 구조 도입, DaySpa 첫 Tenant |
