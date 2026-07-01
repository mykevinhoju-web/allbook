# AllBook

마사지샵 예약 플랫폼. 향후 미용실, 네일샵, 스파 등 웰니스·뷰티 업종으로 확장 가능한 구조로 설계되었습니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| UI | shadcn/ui |
| 백엔드 / DB | Supabase (PostgreSQL) |
| 배포 | Vercel |
| 버전 관리 | GitHub |

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env.local`을 생성하고 Supabase 프로젝트 값을 입력합니다.

```bash
cp .env.example .env.local
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 프로젝트 구조

```
src/
├── app/                  # Next.js App Router 라우트
│   ├── (public)/         # 공개 페이지 (홈, 샵 목록)
│   ├── (auth)/           # 인증 페이지
│   └── (dashboard)/      # 샵 운영자 대시보드
├── components/
│   ├── ui/               # shadcn/ui 컴포넌트
│   └── common/           # 공통 레이아웃 컴포넌트
├── config/               # 사이트·환경 설정
├── features/             # 기능별 모듈 (auth, booking, shops, ...)
├── hooks/                # 공통 React 훅
├── lib/                  # 유틸리티, Supabase 클라이언트
└── types/                # 공유 TypeScript 타입
```

자세한 아키텍처는 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)를 참고하세요.

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |

## 개발 규칙

- **UI 텍스트**: 영어
- **코드·변수명**: 영어
- **문서·설명**: 한국어
- **모듈 구조**: 기능(feature) 단위로 분리
- **확장성**: 업종(category)과 서비스 타입을 enum/타입으로 추상화

## 배포

Vercel에 GitHub 저장소를 연결하여 배포합니다. 환경 변수는 Vercel 프로젝트 설정에서 동일하게 구성하세요.

## 라이선스

Private — AllBook
