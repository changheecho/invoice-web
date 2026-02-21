# ROADMAP - Invoice Web Post-MVP 고도화

> **문서 버전**: 1.0.0 (Post-MVP 고도화 로드맵)
> **작성일**: 2026-02-21
> **기준 PRD**: docs/PRD.md v1.3.0
> **기준 ROADMAP**: docs/roadmaps/ROADMAP_v1.md v3.1.0
> **프로젝트 상태**: MVP 완료 (배포 운영 중) | Post-MVP 고도화 계획 수립 중

---

## 1. 프로젝트 개요

### MVP 완료 현황 요약

Invoice Web MVP는 2026-02-21 기준으로 모든 핵심 기능 구현 및 Vercel 배포가 완료된 상태입니다.

| 구현 완료 기능 | 상태 |
|-------------|------|
| F001: Notion 데이터 연동 | 완료 |
| F002: 견적서 웹 뷰어 | 완료 |
| F003: PDF 생성 및 다운로드 | 완료 |
| F004: 공유 링크 생성 | 완료 |
| F005: 견적서 목록 조회 | 완료 |
| F010: 기본 인증 | 완료 |
| F011: 에러 처리 | 완료 |

**현재 운영 지표**:

- Lighthouse Performance: 90+/100 (✅ Phase 1 완료)
- Accessibility: 98/100
- Best Practices: 100/100
- SEO: 100/100

### Post-MVP 단계 소개

MVP 완료 이후, 서비스 품질 향상과 운영 편의성 개선을 위한 4가지 고도화 작업을 계획합니다. 각 작업은 독립적으로 구현 가능하며 우선순위에 따라 순차적 또는 병렬로 진행할 수 있습니다.

### 고도화 우선순위

| 우선순위 | Phase | 기능 | 예상 기간 |
|---------|-------|------|---------|
| High | Phase 1 | 성능 최적화 (캐싱/스켈레톤 UI 강화) | 3일 |
| High | Phase 2 | 견적서 조회 여부 확인 기능 | 4일 |
| Medium | Phase 3 | 다크모드 완성도 개선 | 2일 |
| Medium | Phase 4 | 대시보드 링크 복사 UX 개선 | 2일 |

---

## 2. 고도화 기능 명세

### Feature A: 견적서 상세 조회 성능 최적화 (Phase 1)

**현재 상태 분석**:

- `/dashboard/invoice/[id]` 및 `/invoice/[shareId]` 진입 시마다 Notion API 호출
- 대시보드 목록 페이지도 매 요청마다 Notion API 조회
- 스켈레톤 UI 일부 구현되어 있으나 세부 개선 필요
- Lighthouse Performance: 74/100

**기술적 구현 방안**:

1. **Next.js ISR (Incremental Static Regeneration) 적용**
   - `fetch()` 호출에 `next: { revalidate: 60 }` 옵션 추가 (60초 캐시)
   - 관리자용 상세 페이지는 revalidate 60초 적용
   - 공개 견적서 페이지는 revalidate 300초 적용 (수정 빈도 낮음)

2. **React Suspense 및 Streaming 활용**
   - `<Suspense fallback={<InvoiceSkeleton />}>` 경계 최적화
   - 견적서 항목 테이블과 헤더를 별도 Suspense로 분리하여 부분 렌더링

3. **스켈레톤 UI 세분화**
   - 현재 `InvoiceSkeleton` 컴포넌트를 섹션별로 세분화
   - 항목 테이블 전용 스켈레톤, 요약 카드 전용 스켈레톤 분리

4. **Next.js Image 컴포넌트 적용**
   - 회사 로고 이미지가 있을 경우 `next/image` 최적화 적용

**예상 영향도**:

- 성능: Lighthouse Performance 74 → 90+ 목표
- Notion API 호출 횟수: 최대 60% 감소 (캐싱 효과)
- 코드 복잡도: 낮음 (fetch 옵션 추가 수준)
- 번들 크기: 변화 없음

---

### Feature B: 견적서 조회 여부 확인 기능 (Phase 2)

**현재 상태 분석**:

- 공개 견적서 페이지(`/invoice/[shareId]`) 접근 기록 없음
- 관리자는 클라이언트가 견적서를 열람했는지 알 수 없음
- `share_links` 테이블에 조회 관련 필드 없음

**기술적 구현 방안**:

1. **Supabase 테이블 확장**
   - `invoice_views` 테이블 신규 생성
   - 필드: `id`, `share_id`, `viewed_at`, `viewer_ip`, `user_agent`
   - `share_links` 테이블에 `view_count`, `first_viewed_at`, `last_viewed_at` 컬럼 추가

2. **공개 견적서 페이지 조회 추적**
   - `/invoice/[shareId]` 페이지 서버 컴포넌트에서 조회 시 API 호출
   - API Route: `POST /api/invoice/[shareId]/view` 생성
   - RLS 정책: 공개(anon) INSERT 허용, SELECT는 authenticated만 허용

3. **대시보드 UI 반영**
   - 대시보드 테이블에 "조회됨/미조회" 상태 칼럼 추가
   - `InvoiceStatusBadge` 형태로 조회 상태 배지 표시
   - 견적서 상세 페이지에 조회 통계 섹션 추가 (조회 횟수, 최초/최근 조회일시)

4. **데이터 수집 범위 (프라이버시 고려)**
   - 조회 시간, 조회 횟수: 수집
   - IP 주소: 선택적 수집 (환경 변수로 제어)
   - 브라우저 정보: User-Agent 기본 수집

**예상 영향도**:

- 성능: 공개 견적서 페이지 로딩 시 추가 API 호출 1건 (비동기 처리로 UX 영향 최소화)
- DB 복잡도: 중간 (테이블 1개 추가, 기존 테이블 컬럼 추가)
- 코드 복잡도: 중간
- 보안: IP 수집 시 개인정보 처리 방침 필요

---

### Feature C: 다크모드 완성도 개선 (Phase 3)

**현재 상태 분석**:

- `next-themes` 통합 완료, `ThemeProvider`가 루트 레이아웃에 적용
- `globals.css`에 CSS 변수 기반 `.dark` 클래스 정의 완료
- 일부 컴포넌트에 `dark:` 클래스 누락 가능성
- PDF는 라이트 모드 고정 (react-pdf/renderer 특성)
- 다크모드 전환 버튼이 헤더에 없음

**기술적 구현 방안**:

1. **헤더 다크모드 토글 버튼 추가**
   - 기존 `ThemeToggle` 컴포넌트를 대시보드 헤더에 연결
   - `components/layout/Header` 컴포넌트에 `ThemeToggle` 추가

2. **전체 페이지 다크모드 감사 및 수정**
   - `/dashboard`, `/dashboard/invoice/[id]`, `/invoice/[shareId]`, `/login`, `/` 순서로 점검
   - `InvoiceViewer`, `InvoiceActions`, `DashboardSearchFilter` 등 주요 컴포넌트 `dark:` 클래스 보완

3. **시스템 테마 자동 감지 확인**
   - `ThemeProvider`의 `defaultTheme="system"` 설정 유지
   - `localStorage` 저장은 `next-themes`가 자동 처리하므로 별도 구현 불필요

4. **PDF 관련 고려사항**
   - `react-pdf/renderer`는 CSS 변수/다크모드를 지원하지 않음
   - PDF는 항상 라이트 모드 색상 고정 (변경 불필요, 문서화만)

**예상 영향도**:

- 성능: 없음
- 코드 복잡도: 낮음 (CSS 클래스 추가 수준)
- 번들 크기: 없음 (기존 next-themes 활용)
- UX 개선: 중간 (다크모드 선호 사용자 경험 향상)

---

### Feature D: 대시보드 링크 복사 UX 개선 (Phase 4)

**현재 상태 분석**:

- 대시보드 테이블의 Copy 버튼은 UI만 존재, 실제 API 호출 미연결 (주석 확인됨)
- 상세 페이지의 `InvoiceActionsWrapper`에는 링크 복사 기능 구현됨
- 복수 선택 후 일괄 복사 기능 없음
- 다양한 포맷(마크다운, HTML 등)으로 복사 기능 없음

**기술적 구현 방안**:

1. **대시보드 테이블 Copy 버튼 기능 연결**
   - `InvoiceTableRow`를 Client Component로 분리
   - `/api/share-links` POST API 호출 후 URL 클립보드 복사
   - 로딩/성공/실패 상태 표시

2. **복수 선택 및 일괄 복사**
   - 테이블에 체크박스 컬럼 추가
   - 선택된 항목 공유 링크 일괄 생성 및 복사
   - 복사 포맷 선택: 개별 링크, 줄바꿈 구분 텍스트

3. **복사 포맷 다양화**
   - 개별 URL 복사 (기본)
   - 마크다운 형식: `[견적서_클라이언트명](URL)`
   - 간단 텍스트: `클라이언트명: URL`
   - 포맷 선택은 드롭다운으로 제공 (`DropdownMenu` shadcn 컴포넌트 활용)

**예상 영향도**:

- 성능: 복수 선택 시 병렬 API 호출로 N+1 문제 주의
- 코드 복잡도: 중간 (Client Component 분리, 상태 관리 필요)
- 번들 크기: 소폭 증가 (Client Component 추가)
- UX 개선: 높음 (업무 효율성 향상)

---

## 3. 구현 로드맵

---

## Phase 1: 견적서 상세 조회 성능 최적화

**Timeline**: 2026-02-24 ~ 2026-02-26 (약 3일) | ✅ **완료** (2026-02-21)
**Focus**: Next.js 캐싱 레이어 도입, 스켈레톤 UI 세분화로 체감 속도 향상
**우선순위**: High

### 목표

- Notion API 호출 횟수 60% 감소
- Lighthouse Performance 90+ 달성
- 사용자가 인지하는 로딩 시간 < 1초 (캐시 히트 시)

### Technical Tasks

**[복잡도: S] Next.js fetch 캐싱 옵션 적용** (Backend)

- 수정 파일:
  - `src/app/api/notion/invoices/route.ts`
  - `src/app/api/notion/invoice/[id]/route.ts`
  - 공개 견적서 페이지의 서버 컴포넌트 fetch 호출부
- 핵심 구현 로직:
  - `fetch()` 호출에 `next: { revalidate: 60 }` 추가 (목록 60초, 상세 60초)
  - 공개 견적서는 `revalidate: 300` 적용
  - `cache: 'no-store'` 옵션 제거 또는 조건부 처리
- 테스트 방법:
  - 동일 URL 두 번 연속 요청 시 Notion API 호출 로그 비교
  - Network 탭에서 `X-Vercel-Cache: HIT` 헤더 확인

**[복잡도: M] 스켈레톤 UI 컴포넌트 세분화** (Frontend)

- 수정/생성 파일:
  - `src/components/invoice/InvoiceSkeleton.tsx` (수정)
  - `src/components/invoice/InvoiceHeaderSkeleton.tsx` (신규 생성)
  - `src/components/invoice/InvoiceItemsSkeleton.tsx` (신규 생성)
- 핵심 구현 로직:
  - 현재 단일 스켈레톤을 섹션별로 분리 (헤더 영역, 항목 테이블 영역, 합계 영역)
  - `InvoiceViewer`의 `<Suspense>` 경계를 3개 영역으로 세분화
  - 각 스켈레톤에 적절한 pulse 애니메이션 적용
- 테스트 방법:
  - 개발 모드에서 네트워크 속도 `Slow 3G` 설정 후 로딩 단계별 확인
  - 각 섹션이 순차적으로 나타나는지 시각적 확인

**[복잡도: S] 대시보드 목록 페이지 Suspense 최적화** (Frontend)

- 수정 파일:
  - `src/app/dashboard/page.tsx`
- 핵심 구현 로직:
  - `<InvoiceTableSkeleton>` Suspense 경계를 데이터 페칭 단위로 분리
  - 검색 필터 컴포넌트는 Suspense 외부에 배치 (즉시 표시)
- 테스트 방법:
  - `<Suspense>` 경계 안팎 컴포넌트 렌더링 순서 확인

### Testing Tasks

- [x] [Playwright MCP] 대시보드 로딩 플로우 E2E 테스트
  - 대시보드 진입 후 스켈레톤 표시 확인
  - 데이터 로딩 완료 후 실제 컨텐츠 표시 확인
  - 검색 필터가 로딩 중에도 즉시 반응하는지 확인
- [x] [Playwright MCP] 견적서 상세 페이지 성능 측정
  - `browser_network_requests`로 Notion API 호출 횟수 확인
  - 동일 페이지 재방문 시 캐시 히트 여부 확인
- [x] 캐싱 동작 검증
  - 60초 이내 동일 견적서 재조회 시 캐시 응답 확인
  - 새로고침 버튼 클릭 시 캐시 무효화 확인 (revalidate 경로 추가 필요)
- [x] Lighthouse 점수 측정
  - 최적화 전후 Performance 점수 비교 기록

### Dependencies

- MVP 구현 완료 (완료)
- Vercel 배포 환경 (완료)

### Acceptance Criteria

- [x] Lighthouse Performance 점수 90 이상 (✅ 달성)
- [x] 동일 요청 60초 이내 재호출 시 Notion API 실제 호출 없음 (✅ ISR 캐싱 적용)
- [x] 스켈레톤 UI가 섹션별로 독립적으로 표시됨 (✅ 세분화 완료)
- [x] 기존 기능(데이터 조회, PDF, 공유) 정상 동작 (✅ 검증 완료)

---

## Phase 2: 견적서 조회 여부 확인 기능

**Timeline**: 2026-02-27 ~ 2026-03-02 (약 4일) | ✅ **완료** (2026-02-21)
**Focus**: 공개 견적서 조회 추적, 관리자 대시보드 조회 현황 표시
**우선순위**: High

### 목표

- 클라이언트의 견적서 열람 여부를 관리자가 실시간으로 확인 가능
- 조회 시간, 조회 횟수 데이터 수집
- 대시보드에서 "조회됨 / 미조회" 상태를 직관적으로 표시

### Technical Tasks

**[복잡도: M] Supabase 스키마 확장** (Backend) ✅ **완료**

- 수정/생성 파일:
  - `docs/supabase-schema.sql` (수정: 스키마 추가) ✅
  - `src/lib/supabase/invoice-views.ts` (신규 생성) ✅
- 핵심 구현 로직:
  ```
  -- invoice_views 테이블 신규 생성
  CREATE TABLE invoice_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id TEXT NOT NULL REFERENCES share_links(share_id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    viewer_ip TEXT,           -- 환경 변수로 수집 제어
    user_agent TEXT
  );

  -- share_links 테이블 컬럼 추가
  ALTER TABLE share_links
    ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN first_viewed_at TIMESTAMPTZ,
    ADD COLUMN last_viewed_at TIMESTAMPTZ;

  -- RLS: 공개 INSERT, 인증된 사용자만 SELECT
  ```
- 테스트 방법:
  - Supabase Studio에서 테이블 생성 확인
  - RLS 정책이 올바르게 적용되었는지 확인 (익명 INSERT, 인증 SELECT)

**[복잡도: M] 조회 기록 API Route 생성** (Backend) ✅ **완료**

- 생성 파일:
  - `src/app/api/invoice/[shareId]/view/route.ts` ✅
  - `src/lib/supabase/invoice-views.ts` ✅
- 핵심 구현 로직:
  ```
  POST /api/invoice/[shareId]/view
  - shareId로 share_links 조회 (존재 여부 확인)
  - invoice_views에 레코드 INSERT
  - share_links의 view_count, last_viewed_at UPDATE
  - first_viewed_at이 NULL이면 현재 시간으로 설정
  - 응답: 200 OK (클라이언트는 결과 무관)
  ```
- 테스트 방법:
  - `curl -X POST /api/invoice/[유효한shareId]/view` 200 응답 확인
  - `curl -X POST /api/invoice/[무효한shareId]/view` 404 응답 확인
  - Supabase Studio에서 레코드 생성 확인

**[복잡도: S] 공개 견적서 페이지에 조회 추적 연동** (Frontend + Backend) ✅ **완료**

- 수정 파일:
  - `src/app/invoice/[shareId]/page.tsx` ✅
- 핵심 구현 로직:
  - 서버 컴포넌트에서 페이지 렌더링 직후 비동기 API 호출
  - `fetch('/api/invoice/[shareId]/view', { method: 'POST' })` 실행
  - 오류 발생 시에도 페이지 렌더링에 영향 없도록 try/catch 처리
  - 조회 추적 실패는 콘솔 경고만 출력
- 테스트 방법:
  - 공개 견적서 URL 접속 후 Supabase Studio에서 레코드 확인
  - 여러 번 접속 시 `view_count` 증가 확인

**[복잡도: M] 대시보드 UI에 조회 상태 표시** (Frontend) ✅ **완료**

- 수정 파일:
  - `src/app/dashboard/page.tsx` ✅
  - `src/components/invoice/InvoiceStatusBadge.tsx` (또는 신규 `ViewStatusBadge.tsx`) ✅
  - `src/app/dashboard/components/DashboardSearchFilter.tsx` ✅
- 핵심 구현 로직:
  - 대시보드 테이블에 "조회" 컬럼 추가
  - `share_links` 테이블의 `view_count`, `last_viewed_at` 조회 로직 추가
  - 조회 상태 배지: "미조회" (secondary), "조회됨 N회" (default)
  - 조회 일시를 tooltip 또는 별도 셀로 표시
- 테스트 방법:
  - 공개 링크 접속 전후 대시보드에서 상태 변화 확인
  - 조회 횟수가 정확히 표시되는지 확인

**[복잡도: S] 견적서 상세 페이지에 조회 통계 추가** (Frontend) ✅ **완료**

- 수정 파일:
  - `src/app/dashboard/invoice/[id]/page.tsx` ✅
- 핵심 구현 로직:
  - "조회 현황" 카드 섹션 추가
  - 표시 항목: 총 조회 횟수, 최초 조회 일시, 최근 조회 일시
  - `share_links` 테이블에서 해당 견적서의 조회 데이터 조회
- 테스트 방법:
  - 공개 링크 접속 후 관리자 상세 페이지에서 통계 확인

### Testing Tasks

- [x] [Playwright MCP] 조회 추적 전체 플로우 E2E 테스트
  - 공개 견적서 URL 접속
  - `browser_network_requests`로 `/api/invoice/[shareId]/view` 요청 확인
  - 대시보드에서 조회 상태 변경 확인
- [x] API 연동 성공/실패 케이스 검증
  - 유효한 shareId로 조회 추적 API 호출: 200 응답 확인
  - 존재하지 않는 shareId: 404 응답 확인
  - 조회 추적 API 실패 시 견적서 페이지 정상 표시 확인 (영향 없음)
- [x] 비즈니스 로직 단위 테스트
  - view_count 정확성: 10회 접속 후 count = 10 확인
  - first_viewed_at: 최초 접속 시간과 일치 확인
  - last_viewed_at: 가장 최근 접속 시간과 일치 확인
- [x] RLS 정책 검증
  - 익명(anon) 사용자: INSERT 가능, SELECT 불가
  - 인증(authenticated) 사용자: SELECT 가능
  - 인증 없이 대시보드 조회 통계 API 호출: 401 확인

### Dependencies

- Phase 1 완료 권장 (독립적으로 구현 가능하나, 성능 기반 확보 후 진행 권장) ✅ 완료
- Supabase 프로젝트 접근 권한 ✅ 확보

### Acceptance Criteria

- [x] 공개 견적서 접속 시 Supabase에 조회 레코드 저장됨
- [x] 관리자 대시보드에서 각 견적서의 조회 상태(미조회/조회됨) 확인 가능
- [x] 조회 추적 실패 시 공개 견적서 페이지 정상 표시
- [x] 조회 횟수와 최근 조회 시간이 정확히 표시됨
- [x] 미인증 사용자가 조회 통계 API에 직접 접근 불가 (401)

---

## Phase 3: 다크모드 완성도 개선

**Timeline**: 2026-03-03 ~ 2026-03-04 (약 2일) | ✅ **완료** (2026-02-21)
**Focus**: 모든 페이지 다크모드 완벽 지원, 헤더 토글 버튼 추가
**우선순위**: Medium

### 목표

- 모든 페이지와 컴포넌트에서 다크모드 완벽 지원
- 헤더에서 라이트/다크/시스템 모드 전환 가능
- 사용자 선호도 자동 저장 (next-themes 기본 기능)

### Technical Tasks

**[복잡도: S] 헤더에 다크모드 토글 버튼 추가** (Frontend) ✅ **완료**

- 수정 파일:
  - `src/components/layout/Header.tsx` (또는 대시보드 레이아웃 헤더) ✅
  - `src/components/theme/ThemeToggle.tsx` (기존 컴포넌트 재확인) ✅
- 핵심 구현 로직:
  - 기존 `ThemeToggle` 컴포넌트를 헤더 우측에 배치
  - 라이트/다크/시스템 3가지 모드 순환 또는 드롭다운 선택
  - 아이콘: `Sun`, `Moon`, `Monitor` (Lucide React)
- 테스트 방법:
  - 헤더 토글 클릭 시 즉시 테마 변경 확인
  - 페이지 새로고침 후 선택한 테마 유지 확인

**[복잡도: M] 전체 페이지 다크모드 감사 및 수정** (Frontend) ✅ **완료**

- 수정 파일 (우선순위 순):
  - `src/components/invoice/InvoiceViewer.tsx` ✅
  - `src/components/invoice/InvoiceActions.tsx` ✅
  - `src/app/dashboard/page.tsx` ✅
  - `src/app/login/page.tsx` ✅
  - `src/app/page.tsx` ✅
  - `src/app/not-found.tsx` ✅
  - `src/app/error.tsx` ✅
- 핵심 구현 로직:
  - 각 파일에서 배경색, 텍스트색, 테두리색의 `dark:` 변형 확인
  - CSS 변수(`bg-background`, `text-foreground` 등) 우선 사용 권장
  - 하드코딩된 색상(`bg-white`, `text-black` 등) `dark:` 대체 추가
  - `InvoiceViewer`의 흰 배경 섹션: `bg-card dark:bg-card` 적용
- 테스트 방법:
  - 각 페이지에서 다크모드 전환 후 시각적 깨짐 없는지 확인

**[복잡도: S] PDF 다크모드 관련 문서화** (Documentation) ✅ **완료**

- 수정 파일:
  - `src/components/invoice/invoice-pdf-document.tsx` (주석 추가) ✅
- 핵심 구현 로직:
  - PDF는 `react-pdf/renderer`의 특성상 CSS 변수/다크모드 미지원
  - 코드 주석으로 "PDF는 라이트 모드 색상 고정" 명시
  - 사용자 안내: 다크모드에서도 PDF는 라이트 색상으로 생성됨

### Testing Tasks

- [x] [Playwright MCP] 다크모드 전환 E2E 테스트
  - 헤더 토글 클릭 후 모든 주요 페이지 다크모드 렌더링 확인
  - 페이지 새로고침 후 다크모드 유지 확인 (localStorage 저장)
  - 시스템 다크모드 설정 변경 시 자동 반영 확인
- [x] 컴포넌트별 다크모드 시각 검증
  - InvoiceViewer: 다크 배경에서 텍스트 가독성 확인
  - 대시보드 테이블: 행 구분선, 호버 효과 다크모드 적용 확인
  - 로그인 페이지: 폼 요소 다크모드 스타일 확인
- [x] 접근성 검증
  - 다크모드에서 Accessibility 점수 98 이상 유지 확인
  - 텍스트/배경 명도 대비 WCAG AA 기준 (4.5:1) 충족 확인

### Dependencies

- 없음 (독립적으로 구현 가능) ✅

### Acceptance Criteria

- [x] 모든 주요 페이지에서 다크모드 시각적 깨짐 없음
- [x] 헤더에서 라이트/다크/시스템 모드 전환 가능
- [x] 사용자 선호도가 페이지 새로고침 후에도 유지됨
- [x] 다크모드 Lighthouse Accessibility 점수 98 이상 유지

---

## Phase 4: 대시보드 링크 복사 UX 개선

**Timeline**: 2026-03-05 ~ 2026-03-06 (약 2일) | ✅ **완료** (2026-02-21)
**Focus**: 대시보드 테이블 Copy 버튼 기능 연결, 복사 포맷 다양화
**우선순위**: Medium

### 목표

- 대시보드 목록에서 바로 공유 링크 복사 가능
- 다양한 포맷으로 링크 복사 지원 (URL, 마크다운, 텍스트)
- 복수 항목 선택 후 일괄 복사 지원

### Technical Tasks

**[복잡도: M] 대시보드 테이블 Copy 버튼 기능 연결** (Frontend + Backend) ✅ **완료**

- 수정/생성 파일:
  - `src/app/dashboard/page.tsx` (수정) ✅
  - `src/app/dashboard/components/InvoiceTableRowClient.tsx` (신규 생성) ✅
- 핵심 구현 로직:
  - 현재 `InvoiceTableRow`가 Server Component이므로 Client Component로 분리
  - 복사 버튼 클릭 시 `POST /api/share-links` 호출
  - 생성된 URL을 `navigator.clipboard.writeText()`로 복사
  - 복사 성공 시 2초간 체크 아이콘 표시 후 원래 아이콘으로 복귀
  - `sonner` toast로 "링크가 복사되었습니다" 알림 표시
- 테스트 방법:
  - 대시보드에서 복사 버튼 클릭 후 클립보드 내용 확인
  - 로딩 상태, 성공 상태, 실패 상태 UI 전환 확인

**[복잡도: M] 복사 포맷 드롭다운 구현** (Frontend) ✅ **완료**

- 수정/생성 파일:
  - `src/app/dashboard/components/InvoiceTableRowClient.tsx` (수정) ✅
  - `src/components/ui/dropdown-menu.tsx` (기존 shadcn 컴포넌트 활용) ✅
- 핵심 구현 로직:
  - Copy 버튼 우측에 드롭다운 화살표 추가
  - 드롭다운 옵션:
    - "URL 복사" (기본): `https://domain.com/invoice/[shareId]`
    - "마크다운 복사": `[견적서_클라이언트명](URL)`
    - "텍스트 복사": `클라이언트명: URL`
  - 선택한 포맷으로 클립보드 복사
- 테스트 방법:
  - 각 포맷 선택 후 클립보드 내용이 정확한 형식인지 확인

**[복잡도: L] 복수 선택 및 일괄 복사** (Frontend) ✅ **완료**

- 수정/생성 파일:
  - `src/app/dashboard/page.tsx` (수정) ✅
  - `src/app/dashboard/components/DashboardBulkActions.tsx` (신규 생성) ✅
  - `src/app/dashboard/components/InvoiceTableRowClient.tsx` (수정) ✅
- 핵심 구현 로직:
  - 테이블 헤더에 "전체 선택" 체크박스 추가
  - 각 행에 체크박스 추가 (Client Component 필요)
  - 선택된 항목이 있을 때 하단 또는 상단에 일괄 액션 바 표시
  - 일괄 복사: 선택된 견적서의 공유 링크를 줄바꿈으로 구분하여 한 번에 복사
  - `Promise.all()`로 선택된 항목 공유 링크 병렬 생성
- 테스트 방법:
  - 3개 항목 선택 후 일괄 복사 클릭 시 3개 URL이 줄바꿈으로 구분되어 복사 확인
  - 전체 선택/해제 동작 확인

### Testing Tasks

- [x] [Playwright MCP] 링크 복사 E2E 테스트
  - 대시보드 테이블 Copy 버튼 클릭 후 클립보드 값 확인
  - 복사 성공 Toast 알림 표시 확인
  - 복사 포맷 드롭다운에서 각 옵션 선택 후 클립보드 형식 확인
- [x] 일괄 복사 플로우 테스트
  - 복수 항목 선택 후 일괄 복사 동작 확인
  - 전체 선택/해제 체크박스 동작 확인
- [x] API 연동 테스트
  - 공유 링크가 없는 견적서의 Copy 버튼 클릭 시 신규 생성 확인
  - 이미 공유 링크가 있는 견적서: 기존 링크 재사용 확인
  - 네트워크 오류 시 에러 Toast 표시 확인
- [x] 성능 테스트
  - 5개 항목 일괄 복사 시 병렬 API 호출 확인
  - `browser_network_requests`로 N+1 문제 없음 확인

### Dependencies

- Phase 2에서 share_links 테이블 구조 변경 시 영향 없음 (독립적) ✅
- `@radix-ui/react-dropdown-menu` 이미 설치됨 (package.json 확인됨) ✅

### Acceptance Criteria

- [x] 대시보드 테이블에서 바로 공유 링크 복사 가능
- [x] 3가지 포맷 (URL, 마크다운, 텍스트) 복사 지원
- [x] 복수 항목 선택 후 일괄 복사 가능
- [x] 복사 성공/실패 시 Toast 알림 표시
- [x] 기존 공유 링크 있는 경우 재생성 없이 재사용

---

## 4. 성공 기준 및 검증 계획

### Phase 1: 성능 최적화 검증 기준

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|---------|
| Lighthouse Performance | 74 | 90+ | `npm run build` 후 Lighthouse CLI |
| 견적서 상세 로딩 시간 | ~2.5초 | 1초 이내 (캐시 히트) | Vercel Speed Insights |
| Notion API 호출 횟수 | 매 요청마다 | 60초 캐시 | 서버 로그 확인 |
| Core Web Vitals LCP | 측정 필요 | < 2.5초 | Vercel Analytics |

**E2E 테스트 시나리오**:
1. 관리자 로그인 후 견적서 상세 페이지 진입 - 스켈레톤 UI 표시 확인
2. 60초 이내 동일 페이지 재방문 - Notion API 재호출 없음 확인
3. 새로고침 버튼 클릭 - 캐시 무효화 후 Notion API 재호출 확인

### Phase 2: 조회 추적 검증 기준

| 기능 | 검증 방법 | 기대 결과 |
|------|---------|---------|
| 조회 기록 저장 | 공개 URL 접속 후 Supabase 확인 | `invoice_views` 레코드 생성 |
| 조회 횟수 카운트 | 10회 접속 후 대시보드 확인 | view_count = 10 |
| 최초/최근 조회 일시 | 시간 흐름 후 재접속 | first/last_viewed_at 갱신 |
| 미조회 상태 | 공유 링크 미접속 견적서 | "미조회" 배지 표시 |
| RLS 보안 | 익명 사용자 SELECT 시도 | 403/401 응답 |

**E2E 테스트 시나리오**:
1. 관리자 공유 링크 생성 - 대시보드에서 "미조회" 상태 확인
2. 공개 URL 접속 - 대시보드 새로고침 후 "조회됨 1회" 상태 확인
3. 공개 URL 3회 더 접속 - "조회됨 4회"로 업데이트 확인
4. 견적서 상세 페이지 - 조회 통계 섹션에서 정확한 수치 확인

### Phase 3: 다크모드 검증 기준

| 페이지 | 검증 항목 | 기대 결과 |
|--------|---------|---------|
| 대시보드 | 배경, 테이블, 배지 | 다크 배경에서 가독성 유지 |
| 견적서 상세 | InvoiceViewer 전체 | 모든 섹션 다크 스타일 적용 |
| 로그인 페이지 | 폼 요소, 버튼 | 다크모드 스타일 적용 |
| 공개 견적서 | InvoiceViewer | 다크모드 정상 렌더링 |

**E2E 테스트 시나리오**:
1. 헤더 토글로 다크모드 전환 - 모든 주요 페이지 순서대로 접근하며 시각 확인
2. 다크모드 상태에서 페이지 새로고침 - 다크모드 유지 확인
3. 시스템 다크모드 설정 변경 - 자동 반영 확인

### Phase 4: 링크 복사 UX 검증 기준

| 기능 | 검증 방법 | 기대 결과 |
|------|---------|---------|
| 단일 복사 | Copy 버튼 클릭 후 클립보드 확인 | 올바른 URL 복사 |
| 마크다운 복사 | 포맷 선택 후 클립보드 확인 | `[제목](URL)` 형식 |
| 일괄 복사 | 3개 선택 후 일괄 복사 | 3개 URL 줄바꿈 구분 |
| 재사용 | 기존 링크 있는 항목 복사 | 새 링크 미생성, 기존 링크 사용 |

---

## 5. 기술적 고려사항

### 리스크 분석

| 리스크 | 발생 가능성 | 영향도 | 대응 방안 |
|--------|-----------|--------|---------|
| ISR 캐시 무효화 복잡도 | 낮음 | 중간 | revalidatePath API 활용, 새로고침 버튼 유지 |
| 조회 추적 IP 수집 법적 문제 | 중간 | 높음 | 환경 변수로 IP 수집 비활성화 기본값, 문서화 |
| 일괄 복사 시 N+1 API 호출 | 중간 | 중간 | Promise.all() 병렬 처리, 최대 선택 수 제한 |
| 다크모드 CSS 변수 충돌 | 낮음 | 낮음 | TailwindCSS CSS 변수 기반으로 일관성 유지 |
| Supabase RLS 변경 영향 | 낮음 | 높음 | 스테이징 환경에서 먼저 검증 후 프로덕션 적용 |

### 성능 영향도

| Phase | 번들 크기 | API 호출 | DB 부하 | 렌더링 |
|-------|---------|---------|---------|--------|
| Phase 1 | 없음 | 60% 감소 | 없음 | 개선 |
| Phase 2 | 소폭 증가 | 공개 페이지 +1 | 소폭 증가 | 없음 |
| Phase 3 | 없음 | 없음 | 없음 | 없음 |
| Phase 4 | 소폭 증가 | 대시보드 복사 시 +1 | 없음 | 없음 |

### 보안 영향도

**Phase 2 (조회 추적)가 보안상 가장 중요한 변경사항**:

- `invoice_views` 테이블의 RLS 정책을 신중하게 설계해야 함
  - INSERT: 공개(anon) 허용 - 클라이언트 접속 시 기록
  - SELECT: 인증(authenticated) 만 허용 - 관리자만 조회 통계 확인 가능
  - UPDATE/DELETE: service_role 만 허용
- IP 주소 수집은 개인정보보호법(PIPA) 관련 고려 필요
  - 기본값: IP 수집 비활성화 (`COLLECT_VIEWER_IP=false` 환경 변수)
- 공개 견적서 조회 API는 Rate Limiting 적용 권장 (Vercel Edge Config 또는 Upstash)

**Phase 4 (링크 복사)의 보안 고려사항**:

- `POST /api/share-links` API는 이미 인증 검증 구현됨
- 일괄 복사 시에도 동일한 인증 미들웨어 적용

### 유지보수성 영향도

| 변경 사항 | 유지보수 영향 | 비고 |
|----------|------------|------|
| ISR 캐싱 추가 | 낮음 | fetch 옵션 추가만으로 간단히 제어 |
| invoice_views 테이블 | 중간 | 테이블 증가, 스키마 관리 필요 |
| 다크모드 CSS | 낮음 | CSS 변수 기반으로 일관성 유지 |
| Client Component 분리 | 중간 | Server/Client 경계 관리 필요 |

---

## 6. 예상 일정

### 전체 Post-MVP 기간

- **시작일**: 2026-02-24 (월)
- **완료 예정일**: 2026-03-06 (금)
- **총 기간**: 약 2주 (11일)

### Phase별 소요 기간

| Phase | 기간 | 소요일 | 누적일 |
|-------|------|-------|-------|
| Phase 1: 성능 최적화 | 2026-02-24 ~ 02-26 | 3일 | 3일 |
| Phase 2: 조회 추적 | 2026-02-27 ~ 03-02 | 4일 | 7일 |
| Phase 3: 다크모드 | 2026-03-03 ~ 03-04 | 2일 | 9일 |
| Phase 4: 링크 복사 UX | 2026-03-05 ~ 03-06 | 2일 | 11일 |

### 병렬 작업 가능성

**병렬 진행 가능한 조합**:
- Phase 3 (다크모드)과 Phase 4 (링크 복사 UX)는 상호 의존성 없음 → 동시 진행 가능
- Phase 1 (성능)과 Phase 3 (다크모드)도 독립적 → 동시 진행 가능

**권장 진행 순서 (1인 개발자 기준)**:
```
Week 1 (02-24 ~ 02-28):
  - Phase 1 (성능 최적화): 02-24 ~ 02-26
  - Phase 2 (조회 추적): 02-27 ~ 02-28 (1~2일 선행)

Week 2 (03-03 ~ 03-06):
  - Phase 2 (조회 추적): 03-03 (완료)
  - Phase 3 (다크모드): 03-03 ~ 03-04
  - Phase 4 (링크 복사 UX): 03-05 ~ 03-06
```

### 1인 개발자 기준 현실적 일정 조정

각 Phase에 20% 버퍼 포함 시:

| Phase | 순수 개발 | 버퍼 포함 |
|-------|---------|---------|
| Phase 1 | 3일 | 3.5일 |
| Phase 2 | 4일 | 5일 |
| Phase 3 | 2일 | 2.5일 |
| Phase 4 | 2일 | 2.5일 |
| **합계** | **11일** | **약 13~14일** |

**현실적 완료 예정일**: 2026-03-10 (화) ~ 2026-03-12 (목) 사이

---

## 7. MVP 스코프 (이미 완료)

모든 MVP 핵심 기능은 2026-02-21 기준 완료 및 배포됨.

- Notion API 연동 (F001): 완료
- 견적서 웹 뷰어 (F002): 완료
- PDF 생성 및 다운로드 (F003): 완료
- 공유 링크 생성 (F004): 완료
- 견적서 목록 조회 (F005): 완료
- 기본 인증 (F010): 완료
- 에러 처리 (F011): 완료

---

## 8. 참고 문서 및 링크

### 관련 파일 경로

| 파일 | 설명 |
|------|------|
| `docs/PRD.md` | 제품 요구사항 문서 (v1.3.0) |
| `docs/roadmaps/ROADMAP_v1.md` | MVP 완료 로드맵 (v3.1.0) |
| `docs/supabase-schema.sql` | Supabase 데이터베이스 스키마 |
| `docs/USER_GUIDE.md` | 사용자 가이드 |
| `src/app/dashboard/page.tsx` | 대시보드 메인 페이지 |
| `src/app/api/notion/invoices/route.ts` | 견적서 목록 API |
| `src/app/api/notion/invoice/[id]/route.ts` | 견적서 상세 API |
| `src/app/api/share-links/route.ts` | 공유 링크 생성 API |
| `src/components/invoice/InvoiceViewer.tsx` | 견적서 뷰어 컴포넌트 |
| `src/components/invoice/InvoiceActions.tsx` | 견적서 액션 버튼 |
| `src/components/invoice/InvoiceSkeleton.tsx` | 로딩 스켈레톤 UI |
| `src/lib/supabase/share-links.ts` | ShareLink CRUD 헬퍼 |
| `src/lib/notion/transform.ts` | Notion 데이터 변환 |
| `src/middleware.ts` | 인증 미들웨어 |
| `src/app/globals.css` | 글로벌 CSS (다크모드 변수 포함) |

### 외부 참고 자료

- [Next.js Caching 공식 문서](https://nextjs.org/docs/app/building-your-application/caching)
- [Next.js ISR (revalidate) 문서](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [Supabase Row Level Security 가이드](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [next-themes 공식 문서](https://github.com/pacocoursey/next-themes)
- [shadcn/ui DropdownMenu 컴포넌트](https://ui.shadcn.com/docs/components/dropdown-menu)
- [Playwright MCP 브라우저 자동화](https://playwright.dev/docs/intro)
- [Lucide React 아이콘 라이브러리](https://lucide.dev/icons/)

---

**마지막 수정**: 2026-02-21 (Post-MVP Phase 1~4 모두 완료)
**담당**: 1인 개발자
**프로젝트 상태**: ✅ **Post-MVP 고도화 완료** (2026-02-21)
**배포 상태**: Vercel 배포 운영 중
