# AllBook 아키텍처

## 개요

AllBook은 웰니스·뷰티 업종의 예약 플랫폼입니다. 초기 타깃은 마사지샵이며, `BusinessCategory` 타입을 통해 미용실, 네일샵, 스파 등으로 확장할 수 있습니다.

## 설계 원칙

1. **기능 모듈화** — `src/features/` 아래에 도메인별로 코드를 분리합니다.
2. **라우트 그룹** — App Router의 route group으로 공개/인증/대시보드 영역을 구분합니다.
3. **타입 우선** — Supabase 스키마와 동기화되는 `Database` 타입을 유지합니다.
4. **UI 일관성** — shadcn/ui 컴포넌트를 기본 UI 레이어로 사용합니다.

## 디렉터리 구조

### `src/app/`

Next.js App Router 진입점입니다.

| 경로 | 용도 |
|------|------|
| `(public)/` | 비로그인 사용자용 페이지 (홈, 샵 목록) |
| `(auth)/` | 로그인·회원가입 |
| `(dashboard)/` | 샵 운영자 대시보드 |

### `src/features/`

비즈니스 도메인 모듈입니다. 각 모듈은 다음 구조를 따릅니다.

```
features/<domain>/
├── components/   # 도메인 전용 UI (추후 추가)
├── hooks/        # 도메인 전용 훅 (추후 추가)
├── types/        # 도메인 타입
└── index.ts      # 공개 API
```

| 모듈 | 책임 |
|------|------|
| `auth` | 인증, 역할(customer / shop_owner / staff / admin) |
| `shops` | 샵(업체) 정보, 카테고리 |
| `services` | 제공 서비스, 가격, 소요 시간 |
| `staff` | 직원, 스케줄 연동 |
| `booking` | 예약 생성·상태 관리 |

### `src/lib/supabase/`

| 파일 | 용도 |
|------|------|
| `client.ts` | 브라우저용 Supabase 클라이언트 |
| `server.ts` | Server Component / Route Handler용 |
| `middleware.ts` | 세션 갱신 (미들웨어에서 호출) |

### `src/types/`

- `database.ts` — Supabase CLI로 생성되는 DB 타입 (현재 placeholder)
- `index.ts` — 공유 enum 및 유틸 타입

## 데이터 모델 (예정)

```
Shop (업체)
  └── Service (서비스)
  └── StaffMember (직원)
  └── Booking (예약)
        └── Customer (고객, auth 연동)
```

## 인증 흐름 (예정)

1. Supabase Auth로 이메일/소셜 로그인
2. `middleware.ts`에서 세션 갱신
3. 역할 기반 라우트 보호 (대시보드, 관리자)

## Supabase 마이그레이션

`supabase/` 디렉터리에 SQL 마이그레이션 파일을 추가할 예정입니다.

```bash
# Supabase CLI 설치 후
supabase init
supabase db push
```

타입 생성:

```bash
npx supabase gen types typescript --project-id <id> > src/types/database.ts
```

## 배포

- **Vercel**: Next.js 앱 호스팅
- **Supabase**: PostgreSQL, Auth, Storage
- 환경 변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`

## 다음 단계

1. Supabase 프로젝트 생성 및 스키마 설계
2. 인증(로그인/회원가입) 구현
3. 샵 CRUD 및 목록/상세 페이지
4. 예약 플로우 (날짜·시간 선택, 확인)
5. 샵 운영자 대시보드
