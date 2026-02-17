# ROADMAP - Invoice Web MVP

> **문서 버전**: 2.0.0 (재구성)
> **작성일**: 2026-02-16 → 2026-02-18
> **기준 PRD**: docs/PRD.md v1.1.0
> **프로젝트 상태**: 개발 진행 중 (기반 구조 구축 완료, 구현 검증 필요)

---

## 개요 (Overview)

### 프로젝트 목표

Notion 데이터베이스에 작성된 견적서를 웹에서 조회하고 PDF로 다운로드할 수 있는 경량 SaaS MVP를 구축한다. 관리자는 로그인 후 Notion 기반 견적서 목록을 확인하고 클라이언트에게 비로그인 공유 링크를 전달하며, 클라이언트는 해당 링크에서 견적서를 열람하고 PDF를 다운로드한다.

### 핵심 가치 제안

- Notion을 단일 진실 공급원으로 활용 - 별도 CMS 불필요, 항상 최신 데이터 보장
- 클라이언트는 로그인 없이 고유 URL로 견적서 열람 - 마찰 없는 UX
- react-pdf/renderer 기반 서버사이드 PDF 생성 - Vercel 완전 호환
- ShareLink 단일 테이블 아키텍처 - 동기화 복잡도 제거, 유지보수성 향상

### 목표 완료일

- **MVP 목표**: 2026-02-16 기준 약 3주 이내 (2026-03-09 완료 목표)
- **단계별 배포**: 최적화 및 배포 단계 완료 후 프로덕션 배포

### 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.x |
| Styling | TailwindCSS + shadcn/ui | v4 |
| Auth | Supabase Auth | 2.95.x |
| Database | Supabase (PostgreSQL) | - |
| Data Source | Notion API | @notionhq/client v5.9.0 |
| PDF | @react-pdf/renderer | 4.3.2 |
| Forms | React Hook Form + Zod | 7.x / 4.x |
| Deploy | Vercel | - |

### 현재 프로젝트 구현 현황 (2026-02-16 기준)

코드 분석 결과 다음 구성 요소가 이미 구현되어 있습니다:

#### 완료된 구성 요소 (구현 검증 필요)

| 파일 | 구현 상태 | 검증 필요 사항 |
|------|-----------|----------------|
| `src/middleware.ts` | 완료 | Supabase Auth 쿠키 갱신 정상 동작 |
| `src/lib/env.ts` | 완료 | 환경 변수 누락 시 명확한 에러 |
| `src/lib/constants.ts` | 완료 | 없음 |
| `src/types/index.ts` | 완료 | 없음 |
| `src/lib/notion/client.ts` | 완료 | NOTION_API_KEY 바인딩 |
| `src/lib/notion/transform.ts` | 완료 | 필드명 불일치 시 폴백 동작 |
| `src/lib/supabase/client.ts` | 완료 | 없음 |
| `src/lib/supabase/server.ts` | 완료 | Service Role Key 바인딩 |
| `src/lib/supabase/share-links.ts` | 완료 | nanoid 중복 방지, UPSERT 로직 |
| `src/app/login/page.tsx` | 완료 | Supabase signInWithPassword 연동 |
| `src/app/invoice/[shareId]/page.tsx` | 완료 | shareId 조회 및 렌더링 |
| `src/app/api/notion/invoices/route.ts` | 완료 | @notionhq/client v5 API 변경 반영 확인 |
| `src/app/api/notion/invoice/[id]/route.ts` | 완료 | 없음 |
| `src/app/api/invoice/[shareId]/pdf/route.ts` | 완료 | woff2 폰트 vs TTF 변경 필요 |
| `src/components/invoice/invoice-pdf-document.tsx` | 완료 | woff2 폰트 PDF 미지원 문제 |
| `src/app/dashboard/page.tsx` | 미완성 | 견적서 목록 UI 미구현 (TODO 상태) |
| `src/app/dashboard/invoice/[id]/page.tsx` | 미완성 | 링크 복사, PDF 버튼 비활성화 상태 |

#### 미구현 구성 요소 (신규 개발 필요)

- `src/components/invoice/InvoiceViewer.tsx` - 공통 견적서 웹 뷰어 컴포넌트
- `src/components/invoice/InvoiceStatusBadge.tsx` - 상태 배지 컴포넌트
- `src/components/invoice/InvoiceActions.tsx` - PDF/링크 액션 클라이언트 컴포넌트
- `src/components/invoice/InvoiceSkeleton.tsx` - 스켈레톤 로딩 UI
- `src/app/dashboard/components/` - 대시보드 클라이언트 컴포넌트
- `src/app/not-found.tsx` - 전역 404 페이지
- `src/app/error.tsx` - 전역 에러 페이지
- `public/fonts/NotoSansKR-Regular.ttf` - 한글 PDF 폰트 (TTF 필수)

### 성공 기준 요약

| 기준 | 목표값 | 측정 방법 |
|------|--------|-----------|
| 견적서 페이지 로딩 | 2초 이내 | Lighthouse TTFB |
| PDF 생성 시간 | 3초 이내 | 실제 다운로드 소요 시간 |
| 관리자 플로우 완료 | 5분 이내 | 로그인~공유 링크 복사 |
| Notion API 키 노출 | 0건 | 브라우저 소스 검색 |
| Lighthouse Performance | 80 이상 | Lighthouse 측정 |

---

## 개발 단계 순서 (5단계)

### 왜 이 순서인가?

현대적인 웹 애플리케이션 개발은 **기반(Foundation) → 공통(Common) → 핵심(Core) → 추가(Enhancement) → 최적화(Optimization)**의 순서를 따릅니다. 이 순서는 다음과 같은 이점을 제공합니다:

1. **프로젝트 골격**: 모든 후속 작업이 의존하는 기반을 먼저 안정화
2. **공통 모듈**: 각 기능별로 반복 사용되는 요소들을 조기에 구축
3. **핵심 기능**: 비즈니스 가치가 가장 높은 기능 우선 구현
4. **추가 기능**: 기본 기능 완성 후 부가 기능 추가 (스코프 관리)
5. **최적화 및 배포**: 전체 기능 검증 후 배포 준비

이 접근 방식은 리스크를 조기에 식별하고, 팀의 맥락 전환을 최소화하며, 프로젝트의 진행 상황을 명확하게 추적할 수 있게 해줍니다.

---

## Stage 1: 프로젝트 골격 (구조, 환경 설정)

**기간**: Day 1 ~ Day 2 (2일) | 2026-02-16 ~ 2026-02-17
**담당 도메인**: DevOps + Backend
**선행 조건**: 없음 (최초 Stage)
**현황**: 코드 파일 구현 완료, 실제 환경 검증 필요

### 단계별 목표

모든 기능의 기반이 되는 프로젝트 환경을 안정화한다. 환경 변수 설정, 외부 서비스 인증, 데이터베이스 초기화를 통해 이후 모든 개발 단계에서 신뢰할 수 있는 기반을 구축한다.

### 왜 이 단계가 필요한가?

개발을 진행하기 전에 다음을 확보해야 합니다:
- **외부 서비스 접근**: Notion API, Supabase 인증
- **데이터베이스 준비**: 공유 링크 저장소 초기화
- **빌드 및 실행 환경**: 환경 변수, 타입 검증
- **명확한 에러 처리**: 환경 미설정 시 즉시 감지

### 기술 태스크

#### 1-1. 환경 변수 설정 및 검증 [Complexity: S]

- [ ] `.env.local` 파일 생성 (`.env.local.example` 기반)
  ```
  NOTION_API_KEY=secret_xxxxxxxxxxxxx
  NOTION_DATABASE_ID=xxxxxxxxxxxxx
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```
- [ ] Notion 통합(Integration) 생성 및 데이터베이스 연결 확인
- [ ] `npm run dev` 실행 후 환경 변수 에러 없이 서버 시작 확인
- [ ] `.env.local.example` 파일 작성 완료 확인 (민감 정보 제외)

#### 1-2. @notionhq/client v5 API 호환성 검증 [Complexity: M]

- [ ] `@notionhq/client v5.9.0` 에서 `dataSources.query` 메서드 존재 여부 확인
  - 존재하지 않으면 `databases.query({ database_id })` 방식으로 수정
  - `@notionhq/client` TypeScript 타입 정의에서 메서드 시그니처 확인
- [ ] Notion 데이터베이스 필드명 매핑 검증
  - `transform.ts`에서 영문/한글 필드명 양방향 폴백 처리 확인
  - `Title | 제목`, `Client Name | 클라이언트명`, `Invoice Date | 견적 일자` 등
- [ ] `GET /api/notion/invoices` 실제 호출 테스트
  - 응답 예시: `{ success: true, data: [...InvoiceSummary] }`
  - 오류 시 응답 형식: `{ success: false, error: "...", details: "..." }`

#### 1-3. Supabase 데이터베이스 초기화 [Complexity: S]

- [ ] Supabase 프로젝트 생성 (대시보드에서 수동)
- [ ] `docs/supabase-schema.sql` SQL Editor에서 실행
  - `share_links` 테이블 생성 확인 (`notion_page_id`, `share_id` 컬럼)
  - RLS 정책 확인: 공개 읽기(`public`), 서비스 롤 쓰기(`service_role`)
  - 인덱스 `idx_share_links_share_id` 생성 확인
- [ ] `share_links` 테이블 INSERT/SELECT 수동 테스트 (SQL Editor)
- [ ] Supabase Auth에 관리자 계정 수동 등록 (Authentication > Users)

#### 1-4. Middleware 및 기본 라우팅 검증 [Complexity: S]

- [ ] `src/middleware.ts` 인증 보호 확인
  - 미인증 상태에서 `/dashboard` 직접 접근 → `/login?redirectTo=/dashboard` 리디렉션
  - 쿠키 갱신 정상 동작
- [ ] 공개 페이지(`/`, `/invoice/[shareId]`) 접근 제한 없음 확인

### 의존성

- 외부: Notion API 계정, Notion 데이터베이스 구성, Supabase 프로젝트 생성
- 내부: 없음 (최초 Stage)

### 완료 기준

- [ ] `npm run dev` 실행 시 환경 변수 에러 없음
- [ ] `GET /api/notion/invoices` 호출 시 실제 Notion 데이터 JSON 반환 확인
- [ ] Supabase `share_links` 테이블 INSERT/SELECT 정상 동작
- [ ] 미인증 상태에서 `/dashboard` 접근 시 `/login` 리디렉션 확인

### Testing Tasks

- [ ] [Playwright MCP] `GET /api/notion/invoices` 엔드포인트 응답 구조 검증
  - `browser_network_requests`로 API 응답 JSON 캡처 및 `success: true` 확인
- [ ] curl 또는 브라우저 직접 호출로 Notion API 연동 확인
  ```bash
  curl http://localhost:3000/api/notion/invoices
  ```
- [ ] Notion API Key 잘못 설정 후 에러 메시지 검증 (오류 핸들링)

### 주요 위험요소

| 위험요소 | 확률 | 영향도 | 대응 방안 |
|----------|------|--------|-----------|
| `dataSources.query` 메서드 미존재 | 높음 | 높음 | `databases.query({ database_id })` 방식으로 즉시 수정 |
| 환경 변수 미설정으로 서버 크래시 | 높음 | 높음 | `env.ts` `validateEnv()` 호출 위치 확인 |
| Notion 데이터베이스 필드명 불일치 | 높음 | 높음 | `transform.ts` 옵셔널 체이닝 + 한글/영문 양방향 폴백 |

---

## Stage 2: 공통 모듈 (모든 기능에서 쓰는 것들)

**기간**: Day 2 ~ Day 3 (2일) | 2026-02-17 ~ 2026-02-18
**담당 도메인**: Backend + Frontend
**선행 조건**: Stage 1 완료 (Notion API, Supabase 연동 검증)
**현황**: 대부분 완료, 실제 동작 검증 필요

### 단계별 목표

모든 기능에서 반복적으로 사용되는 공통 요소를 검증하고 완성한다. 견적서 데이터 조회, 공유 링크 생성, 로그인/인증 기능 등 기반이 되는 모듈들을 안정화하여 이후 기능 구현에서 신뢰할 수 있는 토대를 마련한다.

### 왜 이 단계가 필요한가?

개별 기능들이 공통으로 사용할 인프라를 미리 구축하면:
- **중복 코드 제거**: 같은 로직을 여러 곳에서 반복 작성하지 않음
- **일관된 인터페이스**: 모든 기능에서 동일한 데이터 포맷 사용
- **변경 관리 용이**: 공통 로직 수정이 모든 기능에 자동 반영
- **테스트 집중화**: 공통 모듈을 한 번에 검증하고 이후는 신뢰

### 기술 태스크

#### 2-1. Notion 데이터 조회 함수 검증 [Complexity: M]

- [ ] `getInvoices()` 함수 검증
  - 모든 견적서 목록 조회 (필터링 없이)
  - 응답 타입: `InvoiceSummary[]`
- [ ] `getInvoiceById(id)` 함수 검증
  - 개별 견적서 상세 조회
  - Items 필드 JSON 파싱 정상 동작 확인
  - 응답 타입: `Invoice`
- [ ] Notion API Rate Limit 대비 (초당 3회)
  - 수동 새로고침 버튼으로 요청 제어 준비
  - Exponential Backoff 필요 여부 검토

#### 2-2. ShareLink CRUD 동작 검증 [Complexity: S]

- [ ] `getOrCreateShareLink(notionPageId)` 실제 호출 테스트
  - 신규 생성 시 nanoid 12자리 `shareId` 생성 확인
  - 동일 `notionPageId` 재호출 시 기존 레코드 반환 (중복 생성 방지)
- [ ] `getShareLinkByShareId(shareId)` 조회 테스트
  - 유효한 `shareId` → ShareLink 반환
  - 잘못된 `shareId` → `null` 반환 (에러 throw 없음)

#### 2-3. 로그인/인증 기능 검증 [Complexity: M]

- [ ] Supabase Auth 구성 확인
  - 이메일/비밀번호 인증 활성화
  - 관리자 계정이 Supabase에 등록되어 있는지 확인
- [ ] 로그인 페이지(`src/app/login/page.tsx`) 테스트
  - 실제 Supabase Auth 계정으로 로그인 테스트
  - 올바른 자격증명 → `/dashboard` 리디렉션 확인
  - 잘못된 자격증명 → 한국어 에러 메시지 표시 확인
- [ ] 세션 관리 검증
  - 로그인 후 쿠키 설정 확인
  - 미인증 상태에서 `/dashboard` 접근 시 `/login` 리디렉션
  - 로그인 후 `/login` 직접 접근 시 `/dashboard` 리디렉션

### 의존성

- Stage 1: Notion API, Supabase 초기화 완료

### 완료 기준

- [ ] `getInvoices()` 호출 시 실제 Notion 견적서 목록 반환
- [ ] `getInvoiceById(id)` 호출 시 상세 데이터 정상 반환
- [ ] `getOrCreateShareLink()` 호출 시 새로운 shareId 생성, 재호출 시 기존 ID 반환
- [ ] 실제 Supabase 계정으로 로그인 후 `/dashboard` 접근 가능
- [ ] 미인증 상태에서 `/dashboard` 접근 시 `/login`으로 리디렉션

### Testing Tasks

- [ ] [Playwright MCP] 로그인 전체 플로우 E2E 테스트
  - `browser_navigate('/login')` → 폼 입력 → 제출 → `/dashboard` 이동 확인
- [ ] Notion 데이터 조회 함수들의 성능 측정
  - 응답 시간 2초 이내 목표
- [ ] 로그인 폼 유효성 검사 테스트
  - 빈 이메일/비밀번호 제출 시 에러 메시지
  - 잘못된 이메일 형식 시 에러 메시지

### 주요 위험요소

| 위험요소 | 확률 | 영향도 | 대응 방안 |
|----------|------|--------|-----------|
| Supabase Auth 쿠키 갱신 이슈 | 중간 | 높음 | 공식 `@supabase/ssr` 미들웨어 패턴 준수 |
| Notion API Rate Limit | 중간 | 중간 | 수동 새로고침으로 요청 제어 |
| Items 필드 JSON 파싱 실패 | 낮음 | 중간 | `transform.ts`의 try-catch 폴백 |

---

## Stage 3: 핵심 기능 (가장 중요한 기능)

**기간**: Day 4 ~ Day 10 (7일) | 2026-02-19 ~ 2026-02-25
**담당 도메인**: Frontend + Backend
**선행 조건**: Stage 1, 2 완료
**현황**: 일부 완료, 통합 및 UI 구현 필요

### 단계별 목표

사용자에게 직접 보여지는 핵심 기능들을 완성한다. 관리자 대시보드, 견적서 웹 뷰어, 공유 링크 생성 기능을 통합하여 MVP의 주요 비즈니스 가치를 실현한다.

### 왜 이 단계가 중요한가?

이 단계에서 구현되는 기능들이 MVP의 핵심입니다:
- **관리자 대시보드**: 관리자가 견적서를 관리하는 중심지
- **견적서 뷰어**: 관리자/클라이언트가 보는 실제 콘텐츠
- **공유 링크**: 클라이언트가 접근하는 유일한 방법

이 단계를 완료하면 최소한의 기능을 갖춘 MVP가 완성됩니다.

### 기술 태스크

#### Phase 2: 관리자 대시보드 UI 구현 [Complexity: L]

**기간**: Day 4 ~ Day 6 (3일)

- [ ] 대시보드 목록 페이지(`src/app/dashboard/page.tsx`) 구현
  - Notion API 직접 호출 및 데이터 표시
  - 테이블 컬럼: 제목, 클라이언트명, 총 금액, 견적 일자, 상태, 액션
  - Suspense + 스켈레톤 로딩 상태 처리
- [ ] 검색/필터링 컴포넌트 구현
  - 클라이언트명 또는 제목으로 필터링
  - URL SearchParams 기반 상태 관리
- [ ] Toast 알림 시스템 통합
  - shadcn/ui `Sonner` 컴포넌트 설치
  - 복사 완료/실패 알림
- [ ] 로그아웃 기능 구현
  - 헤더의 로그아웃 버튼 활성화

#### Phase 3: 견적서 웹 뷰어 컴포넌트 [Complexity: M]

**기간**: Day 7 ~ Day 8 (2일)

- [ ] `src/components/invoice/InvoiceViewer.tsx` 서버 컴포넌트 구현
  - 전문적인 인보이스 레이아웃
  - 응답형: 모바일/태블릿/데스크톱 지원
  - 다크 모드 지원
- [ ] 상태 배지 컴포넌트(`InvoiceStatusBadge.tsx`) 구현
- [ ] 액션 버튼 컴포넌트(`InvoiceActions.tsx`) 구현
  - PDF 다운로드 (아직 연결 안 함)
  - 공유 링크 복사 (관리자만 표시)
- [ ] 404/에러 페이지 구현
  - `src/app/not-found.tsx` - 전역 404
  - `src/app/invoice/not-found.tsx` - 견적서 404

#### Phase 2-3 통합: 공유 링크 생성 및 복사 [Complexity: M]

**기간**: Day 6 ~ Day 7 (2일)

- [ ] `/api/share-links` POST 엔드포인트 구현
  - 서버사이드 인증 검증
  - `getOrCreateShareLink(notionPageId)` 호출
- [ ] 대시보드 및 상세 페이지에서 "공유 링크 복사" 버튼 활성화
  - 클릭 시 API 호출 → 클립보드 복사 → Toast 표시

#### Phase 2-3 페이지 리팩토링 [Complexity: M]

**기간**: Day 9 ~ Day 10 (2일)

- [ ] 관리자 상세 페이지(`/dashboard/invoice/[id]`) 완성
  - `InvoiceViewer` 컴포넌트 사용
  - `InvoiceActions` 컴포넌트 (공유 링크 복사만 활성화)
- [ ] 공개 견적서 페이지(`/invoice/[shareId]`) 리팩토링
  - `InvoiceViewer` 컴포넌트로 교체
  - `InvoiceActions` 컴포넌트 (PDF 버튼만 활성화, 아직 연결 안 함)
- [ ] 홈 페이지 업데이트
  - "관리자 로그인" CTA 버튼 추가

### 의존성

- Stage 1, 2: 모든 기반 기능 완료
- Supabase `share_links` 테이블 및 인증

### 완료 기준

- [ ] 관리자 로그인 후 대시보드에서 Notion 견적서 목록 확인
- [ ] 견적서 검색/필터링 동작
- [ ] 공유 링크 복사 버튼 클릭 시 클립보드에 URL 복사
- [ ] `/invoice/[shareId]`에서 공개 견적서 열람 가능
- [ ] 유효하지 않은 `shareId` 접근 시 404 페이지 표시
- [ ] 모바일(390px) / 태블릿(768px) / 데스크톱(1280px) 레이아웃 정상
- [ ] 다크 모드에서 가독성 유지

### Testing Tasks

- [ ] [Playwright MCP] 관리자 로그인 → 대시보드 플로우 E2E 테스트
- [ ] [Playwright MCP] 공유 링크 생성 플로우 테스트
- [ ] [Playwright MCP] 공개 견적서 페이지 렌더링 검증
- [ ] [Playwright MCP] 반응형 레이아웃 테스트 (여러 화면 크기)
- [ ] 다크 모드 토글 후 전체 UI 검증

### 주요 위험요소

| 위험요소 | 확률 | 영향도 | 대응 방안 |
|----------|------|--------|-----------|
| 대시보드 초기 로딩 지연 | 높음 | 중간 | Suspense + Skeleton으로 로딩 상태 표시 |
| 모바일 테이블 레이아웃 깨짐 | 중간 | 중간 | `overflow-x-auto` + 모바일 카드 뷰 전환 |
| Items 필드 JSON 파싱 실패 | 낮음 | 높음 | try-catch 폴백으로 빈 배열 처리 |

---

## Stage 4: 추가 기능 (부가적인 기능)

**기간**: Day 11 ~ Day 12 (2일) | 2026-02-26 ~ 2026-02-27
**담당 도메인**: Backend + Frontend
**선행 조건**: Stage 3 완료 (핵심 기능 완성)
**현황**: 코드 완료, 폰트 수정 필수

### 단계별 목표

PDF 생성 및 다운로드 기능을 완성하여 사용자가 견적서를 오프라인에서도 활용할 수 있도록 한다. 이 기능은 핵심은 아니지만 MVP의 사용성을 크게 향상시킨다.

### 왜 이 단계가 필요한가?

PDF 기능은 중요하지만 선택적입니다:
- **핵심**: 관리자가 링크를 복사하고 클라이언트가 웹에서 보는 것
- **부가**: PDF로 다운로드해서 오프라인 사용

PDF를 나중에 구현하면:
- 핵심 기능을 먼저 검증할 수 있음
- PDF 구현 중 문제가 생겨도 핵심 기능은 영향 없음
- 폰트 수정 등 예상치 못한 문제에 대응할 시간 확보

### 기술 태스크

#### Phase 4: PDF 생성 및 다운로드 [Complexity: M]

**기간**: Day 11 ~ Day 12 (2일)

#### 4-1. 한글 폰트 TTF 파일 준비 [Complexity: M]

- [ ] Noto Sans KR TTF 파일 다운로드
  - [Google Fonts - Noto Sans KR](https://fonts.google.com/noto/specimen/Noto+Sans+KR)
  - Regular(400)와 Bold(700) weight 다운로드
- [ ] TTF 파일 프로젝트에 배치
  - `public/fonts/NotoSansKR-Regular.ttf`
  - `public/fonts/NotoSansKR-Bold.ttf`
- [ ] `src/components/invoice/invoice-pdf-document.tsx` 폰트 소스 수정
  - 현재 woff2 CDN URL → TTF 파일 경로로 교체
  ```typescript
  // 수정 전 (woff2 - 미지원)
  src: 'https://fonts.gstatic.com/...woff2'
  // 수정 후 (TTF - 지원)
  src: `${process.env.NEXT_PUBLIC_APP_URL}/fonts/NotoSansKR-Regular.ttf`
  ```

#### 4-2. PDF 문서 컴포넌트 완성 [Complexity: M]

- [ ] `src/components/invoice/invoice-pdf-document.tsx` 레이아웃 완성
  - TTF 폰트 등록 후 한글 렌더링 테스트
  - A4 페이지 크기, 상하좌우 40pt 여백
  - 항목 수가 많은 경우 페이지 자동 넘김

#### 4-3. PDF 생성 API 검증 및 완성 [Complexity: M]

- [ ] `src/app/api/invoice/[shareId]/pdf/route.ts` 검증
  - Node.js Runtime 명시: `export const runtime = 'nodejs'`
  - `GET /api/invoice/[shareId]/pdf` → `application/pdf` 응답 확인
  - PDF 파일명: `견적서_[클라이언트명]_[날짜].pdf` 형식
- [ ] PDF 생성 시간 측정
  - 목표: 3초 이내

#### 4-4. PDF 다운로드 클라이언트 컴포넌트 [Complexity: S]

- [ ] `src/components/invoice/InvoiceActions.tsx` PDF 다운로드 로직 구현
  - `<a href={pdfUrl} download>` 방식 또는 fetch → Blob 방식
  - 로딩 상태 표시 (Lucide `Loader2` 스피너)
  - 완료/실패 Toast 알림
- [ ] 관리자 상세 페이지에서 PDF 버튼 활성화

### 의존성

- Stage 3: `InvoiceViewer` 레이아웃 (PDF와 웹 일관성)
- Stage 1: Supabase `share_links` 조회

### 완료 기준

- [ ] 공개 견적서 페이지에서 PDF 다운로드 버튼 클릭 시 3초 이내 파일 다운로드
- [ ] 다운로드된 PDF에서 한글 정상 표시 (깨짐 없음)
- [ ] PDF 파일명 한글 인코딩 정상
- [ ] PDF 레이아웃이 웹 뷰어와 동일

### Testing Tasks

- [ ] [Playwright MCP] PDF 다운로드 네트워크 요청 검증
  - `browser_network_requests`로 `GET /api/invoice/[shareId]/pdf` 확인
  - 응답 상태 200, `Content-Type: application/pdf`
- [ ] 실제 PDF 파일 다운로드 후 확인
  - 한글 항목명, 클라이언트명 정상 표시
  - 페이지 레이아웃 정상
- [ ] 항목 수 많은 견적서 (10개 이상) PDF 생성 테스트
- [ ] PDF 생성 시간 측정 (목표: 3초 이내)

### 주요 위험요소

| 위험요소 | 확률 | 영향도 | 대응 방안 |
|----------|------|--------|-----------|
| **woff2 폰트 미지원** | 매우 높음 | 매우 높음 | TTF 파일 즉시 준비 (이 단계 시작 전) |
| PDF 한글 폰트 깨짐 | 높음 | 높음 | TTF 파일 존재 검증 후 빌드 |
| PDF 생성 시간 초과 | 중간 | 높음 | `renderToBuffer` 사용, 복잡한 레이아웃 제거 |

---

## Stage 5: 최적화 및 배포

**기간**: Day 13 ~ Day 14+ (2일 + 버퍼) | 2026-02-28 ~ 2026-03-09
**담당 도메인**: QA + DevOps + 문서화
**선행 조건**: Stage 1~4 모두 완료

### 단계별 목표

전체 기능을 통합하여 테스트하고, 프로덕션 환경에 배포하기 위한 최종 점검과 문서화를 완료한다.

### 왜 이 단계가 필요한가?

배포 전 최종 검증이 필수입니다:
- **통합 테스트**: 개별 기능들이 함께 동작하는지 확인
- **보안 점검**: API 키 노출, 인증 우회 등 검증
- **성능 확인**: Lighthouse 점수, 로딩 시간 등
- **문서화**: 사용자 가이드, 운영 매뉴얼 작성

### 기술 태스크

#### Phase 5: 통합 테스트 및 에러 처리 [Complexity: M]

**기간**: Day 13 (1일)

##### 5-1. 전체 플로우 E2E 테스트

**관리자 플로우**:
- 홈 페이지 → 로그인 버튼 → 로그인 페이지
- 올바른 자격증명 입력 → 대시보드 진입
- 견적서 목록 확인 → 상세 페이지 이동
- 공유 링크 복사 → 클립보드 확인
- PDF 다운로드 → 파일 확인
- 로그아웃 → 로그인 페이지

**클라이언트 플로우**:
- 공유된 URL 직접 접속
- 견적서 내용 확인
- PDF 다운로드
- Incognito 창에서 재테스트

##### 5-2. 에러 처리 강화

- [ ] `src/app/error.tsx` 전역 에러 페이지 구현
- [ ] `src/app/not-found.tsx` 전역 404 페이지 구현
- [ ] API 오류 시나리오별 에러 메시지 검증
  - Rate Limit, 페이지 없음, 네트워크 오류, 인증 오류

##### 5-3. 보안 점검

- [ ] `NOTION_API_KEY` 클라이언트 번들 미노출
  - 브라우저 소스 검색: 0건
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 미노출
- [ ] 관리자 API Route 인증 검증
  - 미인증 상태 호출 시 401 또는 리디렉션
- [ ] `.env.local` `.gitignore` 포함 확인

##### 5-4. 성능 점검

- [ ] Lighthouse Performance 점수 (목표: 80 이상)
- [ ] 견적서 상세 페이지 TTFB (목표: 1초 이내)
- [ ] `npm run build` 빌드 오류 0건
- [ ] `npm run lint` 경고/에러 0건

#### Phase 6: 배포 및 문서화 [Complexity: M]

**기간**: Day 14+ (1일 + 버퍼)

##### 6-1. Vercel 배포 준비

- [ ] GitHub 리포지토리 생성 및 코드 푸시
  - `.env.local` `.gitignore` 포함 확인
  - 민감 정보 하드코딩 여부 최종 확인
- [ ] Vercel 프로젝트 생성 (GitHub 연동)
- [ ] Vercel 환경 변수 설정 (Production)
  ```
  NOTION_API_KEY
  NOTION_DATABASE_ID
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  NEXT_PUBLIC_APP_URL  # 실제 배포 도메인
  ```
- [ ] `git push` → Vercel 자동 빌드/배포

##### 6-2. 프로덕션 검증

- [ ] 배포된 URL에서 전체 플로우 재테스트
- [ ] 공유 링크 도메인이 실제 배포 URL인지 확인
- [ ] Supabase RLS 정책이 프로덕션에서 정상 동작
- [ ] TTF 폰트 파일이 배포에 포함되어 있는지 확인

##### 6-3. 사용자 가이드 문서 작성

- [ ] `docs/USER_GUIDE.md` 작성
  - Notion 계정 및 데이터베이스 설정
  - Notion 통합 생성 및 API 키 발급
  - 서비스 사용 방법 (로그인, 공유, 다운로드)

##### 6-4. 운영 모니터링 설정

- [ ] Vercel Analytics 활성화
- [ ] Vercel Speed Insights 활성화
- [ ] Supabase 모니터링 설정

### 배포 최종 체크리스트

프로덕션 배포 전 반드시 확인:

- [ ] `npm run build` 로컬에서 오류 없이 완료
- [ ] `npm run lint` 경고/에러 없음
- [ ] `.env.local` `.gitignore` 포함
- [ ] `NOTION_API_KEY` 등 민감 정보 하드코딩 없음
- [ ] Vercel 환경 변수 모두 입력
- [ ] Supabase `share_links` 테이블 및 RLS 정책 생성 완료
- [ ] Notion 데이터베이스에 Integration 연결 완료
- [ ] 공유 링크 URL이 실제 배포 도메인 사용
- [ ] `public/fonts/NotoSansKR-*.ttf` 배포 포함

### 완료 기준

- [ ] 관리자 전체 플로우 오류 없이 완료
- [ ] 클라이언트 전체 플로우 오류 없이 완료
- [ ] Notion API Key 클라이언트 미노출
- [ ] `npm run build` 빌드 오류 0건
- [ ] `npm run lint` 경고/에러 0건
- [ ] Vercel 프로덕션 URL에서 모든 기능 정상 작동
- [ ] `docs/USER_GUIDE.md` 작성 완료

### Testing Tasks

- [ ] [Playwright MCP] 관리자 전체 플로우 E2E 자동화
  - 로그인 → 대시보드 → 공유 링크 복사 → PDF 다운로드 → 로그아웃
- [ ] [Playwright MCP] 클라이언트 전체 플로우 E2E 자동화
  - 공유 URL 접속 → 견적서 확인 → PDF 다운로드
- [ ] [Playwright MCP] 에러 케이스 시나리오
  - 유효하지 않은 shareId 접속 → 404
  - 잘못된 로그인 자격증명 → 에러 메시지
- [ ] API 보안 테스트
  - 미인증 상태에서 관리자 API 호출 차단 확인
- [ ] 다크 모드 전체 플로우 확인
- [ ] 모바일 기기에서 UX 확인

### 주요 위험요소

| 위험요소 | 확률 | 영향도 | 대응 방안 |
|----------|------|--------|-----------|
| 빌드 오류 | 중간 | 높음 | 로컬 `npm run build` 선행 |
| 예상치 못한 통합 이슈 | 낮음 | 높음 | 버퍼 기간 5-6일 확보 |
| NEXT_PUBLIC_APP_URL 미설정 | 중간 | 높음 | 배포 전 체크리스트 확인 |

---

## MVP 범위 정의

### MVP에 포함되는 기능

| 기능 ID | 기능명 | Stage | 현재 상태 |
|---------|--------|-------|-----------|
| F001 | Notion 데이터 연동 | 1 | 코드 완료, 검증 필요 |
| F002 | 견적서 웹 뷰어 | 3 | 부분 완료, 통합 필요 |
| F003 | PDF 생성 및 다운로드 | 4 | 코드 완료, 폰트 수정 필요 |
| F004 | 공유 링크 생성 | 3 | 백엔드 완료, UI 미구현 |
| F005 | 견적서 목록 조회 | 3 | 미완성 |
| F010 | 기본 인증 (로그인/로그아웃) | 2 | 거의 완료, 검증 필요 |
| F011 | 에러 처리 | 5 | 미착수 |

### MVP 출시 목표일

**2026-03-09** (2026-02-16 기준 약 3주)

### MVP 이후 기능 (Post-MVP)

다음 기능은 MVP 출시 이후 우선순위에 따라 순차 개발:

1. **견적서 템플릿 커스터마이징** - 로고 업로드, 회사 정보 설정
2. **이메일 자동 발송** - 공유 링크 생성 시 자동 발송
3. **견적서 승인/거절 워크플로우** - 클라이언트 피드백 수집
4. **견적서 통계 대시보드** - 매출 추이, 클라이언트별 합계
5. **Notion 캐싱 레이어** - Vercel KV로 Rate Limit 대응
6. **견적서 만료일 알림** - 유효 기간 임박 시 알림
7. **다국어 지원** - 영어 인터페이스
8. **결제 연동** - PG사 연동으로 견적서 수락 후 결제

---

## 알려진 위험요소 및 대응 전략

### 기술적 위험요소

| 위험요소 | 확률 | 영향도 | 대응 전략 |
|----------|------|--------|-----------|
| **woff2 폰트 PDF 미지원** | 매우 높음 | 매우 높음 | Stage 4 시작 전 Noto Sans KR TTF 파일 준비 필수 |
| **@notionhq/client v5 API 변경** | 높음 | 높음 | Stage 1에서 실제 메서드 존재 여부 즉시 검증 |
| **PDF 한글 폰트 깨짐** | 높음 | 높음 | TTF 파일 직접 번들링, 빌드 전 파일 존재 검증 |
| **Notion 데이터베이스 필드명 불일치** | 높음 | 높음 | `transform.ts` 양방향 폴백 처리 |
| **PDF 생성 타임아웃** | 중간 | 높음 | `renderToBuffer()` 사용, Node.js Runtime 명시 |
| **Notion API Rate Limit** | 중간 | 중간 | 수동 새로고침, Exponential Backoff |
| **Supabase Auth 쿠키 갱신 실패** | 낮음 | 높음 | `@supabase/ssr` 공식 패턴 준수 |

### 운영적 위험요소

| 위험요소 | 확률 | 영향도 | 대응 전략 |
|----------|------|--------|-----------|
| **Notion API Key 유출** | 낮음 | 매우 높음 | 서버사이드 전용, `.gitignore` 최종 확인 |
| **NEXT_PUBLIC_APP_URL 미설정** | 중간 | 높음 | 배포 전 체크리스트 확인 |
| **Supabase 무료 플랜 한도 초과** | 낮음 | 중간 | 최소한의 데이터만 저장 |
| **Vercel 빌드 실패** | 낮음 | 높음 | `npm run build` 로컬 사전 검증 |

---

## 성공 지표 (Success Metrics)

### 기능적 성공 지표

| 지표 | 측정 방법 | 목표값 |
|------|-----------|--------|
| 페이지 로딩 시간 | Lighthouse Performance | 80 이상 |
| PDF 생성 시간 | 실제 다운로드 소요 시간 | 3초 이내 |
| 공유 링크 접근 성공률 | 유효한 shareId로 접근 | 100% |
| 관리자 플로우 완료 시간 | 로그인~공유 링크 복사 | 5분 이내 |

### 보안 성공 지표

| 지표 | 측정 방법 | 목표값 |
|------|-----------|--------|
| API 키 클라이언트 노출 | 브라우저 소스 검색 | 0건 |
| 미인증 대시보드 접근 | `/dashboard` 직접 접근 | 100% 차단 |
| 공유 링크 충돌 | 동일 `shareId` 중복 생성 | 0건 |

### 사용성 성공 지표

| 지표 | 측정 방법 | 목표값 |
|------|-----------|--------|
| 모바일 레이아웃 | 390px 화면 | 깨짐 없음 |
| 다크 모드 지원 | WCAG AA 대비 | 기준 통과 |
| PDF 한글 표시 | 한글 견적서 PDF | 깨짐 0건 |

---

## 개발 일정 타임라인

```
Week 1 (Feb 16 - Feb 22)
├── Day 1-2  (Feb 16-17): Stage 1 - 프로젝트 골격 (환경 설정, DB 초기화)
│   └── 핵심: Notion API v5 호환성 검증, Supabase 초기화
├── Day 2-3  (Feb 17-18): Stage 2 - 공통 모듈 (API 함수, 인증)
│   └── 핵심: Notion/Supabase 동작 검증, 로그인 테스트
├── Day 4-8  (Feb 19-23): Stage 3 - 핵심 기능 (대시보드, 웹 뷰어, 공유 링크)
│   └── 핵심: 관리자 대시보드 UI, 공유 링크 생성/복사

Week 2 (Feb 24 - Mar 1)
├── Day 9-10 (Feb 24-25): Stage 3 계속 (페이지 리팩토링)
├── Day 11-12 (Feb 26-27): Stage 4 - 추가 기능 (PDF 생성)
│   └── 핵심: TTF 폰트 적용, PDF 렌더링 검증
└── Day 13-14 (Feb 28-Mar 1): Stage 5 - 최적화 및 배포
    └── 핵심: E2E 테스트, 보안 점검, Vercel 배포

Week 3 (Mar 2 - Mar 9)
└── Buffer (Mar 2-9): 버퍼 기간 (5-7일)
    └── 예상치 못한 이슈 대응, 최종 검증
```

### Stage별 진행 상황

| Stage | 기간 | 현재 상태 | 주요 리스크 |
|-------|------|-----------|-------------|
| Stage 1: 프로젝트 골격 | Day 1-2 | 코드 완료, 환경 검증 필요 | API v5 변경 |
| Stage 2: 공통 모듈 | Day 2-3 | 거의 완료, 동작 검증 필요 | 없음 |
| Stage 3: 핵심 기능 | Day 4-10 | 일부 완료, 통합 필요 | 없음 |
| Stage 4: 추가 기능 | Day 11-12 | 폰트 수정 필요 | 폰트 TTF 전환 |
| Stage 5: 최적화/배포 | Day 13-14+ | 미착수 | Notion Rate Limit |
| **총 개발 기간** | **14일 + 버퍼** | **목표: 2026-03-09** | - |

---

## 참고 자료

- [Notion API 공식 문서](https://developers.notion.com/)
- [Next.js 16 App Router 문서](https://nextjs.org/docs)
- [Supabase Auth Server-Side 가이드](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [react-pdf/renderer 공식 문서](https://react-pdf.org/)
- [shadcn/ui 컴포넌트](https://ui.shadcn.com/)
- [Vercel 배포 가이드](https://vercel.com/docs/deployments/overview)
- [Noto Sans KR 폰트 다운로드 (TTF)](https://fonts.google.com/noto/specimen/Noto+Sans+KR)
- [@notionhq/client v5 변경사항](https://github.com/makenotion/notion-sdk-js/blob/main/CHANGELOG.md)

---

**문서 버전**: 2.0.0 (개발 순서 기반 재구성)
**최종 수정일**: 2026-02-18
**작성 기준 PRD**: docs/PRD.md v1.1.0

**주요 변경 사항 (v1.1.0 → v2.0.0)**:
- Phase 기반 구조 → Stage 기반 구조 (개발 순서 재정렬)
- 기능 위주 → 개발 프로세스 위주
  - Stage 1: 프로젝트 골격 (환경, 기반)
  - Stage 2: 공통 모듈 (공유되는 요소)
  - Stage 3: 핵심 기능 (비즈니스 가치)
  - Stage 4: 추가 기능 (선택적)
  - Stage 5: 최적화 및 배포
- 각 단계별 "왜 이 단계가 필요한가?" 설명 추가
- 단계별 의존성 명시화
- 버퍼 기간 용도 명확화
