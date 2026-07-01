# AllBook 문서

AllBook 프로젝트의 공식 개발 문서입니다. 상용 서비스로 수년간 운영·확장할 것을 전제로 작성되었습니다.

## 문서 목록

| 문서 | 설명 |
|------|------|
| [Multi-Tenant.md](./Multi-Tenant.md) | Multi-Tenant 아키텍처 — Tenant, DaySpa, 데이터 격리 |
| [PRD.md](./PRD.md) | 제품 요구사항 정의서 — 목표, 사용자, 기능 범위 |
| [Architecture.md](./Architecture.md) | 시스템 아키텍처 — 구조, 모듈, 인증, 배포 |
| [Database.md](./Database.md) | 데이터베이스 설계 — 스키마, RLS, 마이그레이션 |
| [UI_Guide.md](./UI_Guide.md) | UI/UX 가이드 — 고객(영어) / 관리자 화면 규칙 |
| [CodingRules.md](./CodingRules.md) | 코딩 규칙 — 네이밍, 모듈, PR, 품질 기준 |
| [Roadmap.md](./Roadmap.md) | 개발 로드맵 — 단계별 구현 계획 |

## 프로젝트 한 줄 요약

**AllBook**은 Multi-Tenant 웰니스·뷰티 예약 플랫폼입니다. **DaySpa**가 첫 번째 Tenant이며, 미용실·네일샵·스파 등 다른 업종·Tenant로 확장할 수 있도록 설계합니다.

## 핵심 원칙

1. **상용 서비스 품질** — 보안, 성능, 관측 가능성을 초기부터 고려합니다.
2. **확장성** — 업종(Business Category)과 역할(Role)을 추상화하여 새 도메인 추가 비용을 최소화합니다.
3. **유지보수성** — 기능별 모듈 구조, 명확한 경계, 문서화된 의사결정을 유지합니다.
4. **UI 언어 분리** — 고객 화면은 **영어**, 개발 문서·내부 설명은 **한국어**, 코드·변수명은 **영어**입니다.
5. **Admin 우선 포함** — 플랫폼 관리자(Admin) 기능은 후순위가 아닌 **초기 개발 범위**에 포함합니다.
6. **Multi-Tenant** — 모든 데이터는 `tenant_id`로 관리하며, Tenant 이름은 코드에 하드코딩하지 않습니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| UI | shadcn/ui |
| 백엔드 / DB | Supabase (PostgreSQL, Auth, Storage) |
| 배포 | Vercel |
| 도메인 | allbook.com.au |
| 버전 관리 | GitHub |

## 사용자 역할

| 역할 | 설명 | 주요 화면 |
|------|------|-----------|
| **Customer** | 서비스를 예약하는 일반 고객 | 공개 사이트 (영어 UI) |
| **Shop Owner** | 업체 운영자 | Shop Dashboard |
| **Staff** | 업체 소속 직원 | Staff 뷰 (예약 확인·스케줄) |
| **Admin** | 플랫폼 운영자 | Admin Console |

## 문서 읽는 순서 (권장)

신규 참여자는 아래 순서로 읽는 것을 권장합니다.

1. [PRD.md](./PRD.md) — 무엇을 만드는지
2. [Architecture.md](./Architecture.md) — 어떻게 구성하는지
3. [Database.md](./Database.md) — 데이터를 어떻게 모델링하는지
4. [UI_Guide.md](./UI_Guide.md) — 화면을 어떻게 만드는지
5. [CodingRules.md](./CodingRules.md) — 코드를 어떻게 작성하는지
6. [Roadmap.md](./Roadmap.md) — 언제 무엇을 구현하는지

## 문서 변경 규칙

- 기능 범위·아키텍처·DB 스키마가 바뀌면 **해당 문서를 먼저 수정**한 뒤 코드를 변경합니다.
- 문서와 코드가 불일치하면 문서를 기준으로 맞춥니다 (의도적 변경이 아닌 한).
- 주요 의사결정은 PRD 또는 Architecture에 근거를 남깁니다.

## 관련 링크

- 프로덕션: [https://allbook.com.au](https://allbook.com.au)
- GitHub: [mykevinhoju-web/allbook](https://github.com/mykevinhoju-web/allbook)
- Vercel: [allbook 프로젝트](https://vercel.com)
