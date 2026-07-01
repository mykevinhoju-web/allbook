# Supabase — AllBook

## 프로젝트 정보

| 항목 | 값 |
|------|-----|
| Project ref | `dbmrcqpvdilmrmgpyhxh` |
| URL | `https://dbmrcqpvdilmrmgpyhxh.supabase.co` |
| Region | `ap-northeast-1` (Tokyo) |

## 초기 설정 (최초 1회)

### 방법 A — SQL Editor (가장 간단, 권장)

1. [Supabase Dashboard](https://supabase.com/dashboard/project/dbmrcqpvdilmrmgpyhxh/sql/new) → **SQL Editor**
2. `supabase/setup.sql` 파일 내용 전체 복사
3. **Run** 클릭
4. 결과에 `dayspa | DaySpa | true` 행이 보이면 성공

### 방법 B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref dbmrcqpvdilmrmgpyhxh
npx supabase db push
npx supabase db execute --file supabase/seed.sql
```

## 로컬 환경 변수

`.env.local` (이미 설정됨):

```env
NEXT_PUBLIC_SUPABASE_URL=https://dbmrcqpvdilmrmgpyhxh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
TENANT_SLUG=dayspa
NEXT_PUBLIC_TENANT_DISPLAY_NAME=DaySpa
```

## 타입 생성 (마이그레이션 후)

```bash
npx supabase gen types typescript --project-id dbmrcqpvdilmrmgpyhxh > src/types/database.ts
```

## 파일 구조

```
supabase/
├── config.toml
├── setup.sql          # migration + seed (SQL Editor용)
├── seed.sql
└── migrations/
    └── 20260701120000_create_tenants.sql
```

## 검증

```bash
curl "https://dbmrcqpvdilmrmgpyhxh.supabase.co/rest/v1/tenants?slug=eq.dayspa&select=slug,display_name" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <anon-key>"
```

성공 시: `[{"slug":"dayspa","display_name":"DaySpa"}]`
