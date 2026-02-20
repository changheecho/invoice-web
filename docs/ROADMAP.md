# ROADMAP - Invoice Web MVP

> **문서 버전**: 3.0.0 (MVP 구현 완료 기반 재구성)
> **작성일**: 2026-02-16 → 2026-02-21
> **최종 수정일**: 2026-02-21
> **기준 PRD**: docs/PRD.md v1.2.0
> **프로젝트 상태**: ✅ MVP 구현 완료 (2026-02-18) | ✅ 코드 정리 완료 (2026-02-21) | 배포 준비 중

---

## 📋 개요

### 프로젝트 목표

Notion 데이터베이스에 작성된 견적서를 웹에서 조회하고 PDF로 다운로드할 수 있는 경량 SaaS MVP를 구축한다. 관리자는 로그인 후 Notion 기반 견적서 목록을 확인하고 클라이언트에게 비로그인 공유 링크를 전달하며, 클라이언트는 해당 링크에서 견적서를 열람하고 PDF를 다운로드한다.

### 핵심 기술 특징

- **Notion 연동**: Notion API를 통한 실시간 데이터 조회 (항상 최신 데이터)
- **간편한 공유**: 고유 URL 기반 로그인 불필요한 공유 링크
- **PDF 생성**: react-pdf/renderer 기반 서버사이드 생성 (Vercel 완전 호환)
- **최소 데이터**: ShareLink 단일 테이블로 동기화 복잡도 제거

### 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **Language** | TypeScript | 5.x |
| **Styling** | TailwindCSS + shadcn/ui | v4 |
| **Auth** | Supabase Auth | 2.95.x |
| **Database** | Supabase (PostgreSQL) | - |
| **Data Source** | Notion API | v5.9.0 |
| **PDF** | react-pdf/renderer | 4.3.2 |
| **Deploy** | Vercel | - |

---

## ✅ MVP 구현 완료 (Stage 1-4)

### 구현 현황 요약

**모든 MVP 핵심 기능 구현 완료** ✅

#### F001: Notion 데이터 연동
- ✅ Notion API v5 호환성 검증 완료
- ✅ 데이터베이스 필드명 양방향 폴백 처리
- ✅ Items Relation 조회 로직 구현
- ✅ 에러 처리 및 재시도 로직 완성

**구현 파일**:
- `src/lib/notion/client.ts` - Notion API 클라이언트
- `src/lib/notion/transform.ts` - 데이터 변환 (폴백 처리 포함)
- `src/lib/notion/items.ts` - Items DB 조회 함수
- `src/app/api/notion/invoices/route.ts` - 목록 조회 API
- `src/app/api/notion/invoice/[id]/route.ts` - 상세 조회 API

#### F002: 견적서 웹 뷰어
- ✅ 전문적 인보이스 레이아웃 구현
- ✅ 반응형 디자인 (모바일/태블릿/데스크톱)
- ✅ 다크 모드 완벽 지원
- ✅ 스켈레톤 로딩 상태 UI

**구현 파일**:
- `src/components/invoice/InvoiceViewer.tsx` - 메인 뷰어 컴포넌트
- `src/components/invoice/InvoiceStatusBadge.tsx` - 상태 배지 (6가지)
- `src/components/invoice/InvoiceSkeleton.tsx` - 로딩 상태

#### F003: PDF 생성 및 다운로드
- ✅ react-pdf/renderer 기반 PDF 생성
- ✅ TTF 폰트 적용으로 한글 완벽 렌더링
- ✅ 성능 최적화 (JPEG 포맷, pixelRatio 조정, 압축)
- ✅ 파일명 한글 인코딩 처리

**구현 파일**:
- `src/components/invoice/invoice-pdf-document.tsx` - PDF 레이아웃
- `src/app/api/invoice/[shareId]/pdf/route.ts` - PDF 생성 API
- `public/fonts/NotoSansKR-*.ttf` - 한글 폰트

#### F004: 공유 링크 생성
- ✅ nanoid 기반 고유 ID 생성 (중복 방지)
- ✅ Supabase UPSERT 로직으로 동시성 처리
- ✅ Supabase RLS 정책 설정 (authenticated 사용자 쓰기)
- ✅ 클립보드 복사 기능

**구현 파일**:
- `src/lib/supabase/share-links.ts` - ShareLink CRUD
- `src/app/api/share-links/route.ts` - 공유 링크 API
- `src/components/invoice/InvoiceActions.tsx` - 액션 버튼

#### F005: 견적서 목록 조회
- ✅ Notion 데이터 기반 목록 테이블
- ✅ 클라이언트명/제목 검색 필터
- ✅ 상태별 필터링
- ✅ 정렬 기능 (날짜순)

**구현 파일**:
- `src/app/dashboard/page.tsx` - 대시보드 메인 페이지
- `src/app/dashboard/components/DashboardSearchFilter.tsx` - 검색/필터

#### F010: 기본 인증
- ✅ Supabase Auth 이메일/비밀번호 인증
- ✅ 미들웨어 기반 접근 제어
- ✅ httpOnly 쿠키로 세션 관리
- ✅ 로그아웃 기능

**구현 파일**:
- `src/app/login/page.tsx` - 로그인 페이지
- `src/middleware.ts` - 인증 미들웨어

#### F011: 에러 처리
- ✅ 전역 404 페이지 (`src/app/not-found.tsx`)
- ✅ 전역 에러 페이지 (`src/app/error.tsx`)
- ✅ API 에러 응답 구조화
- ✅ Toast 알림 통합 (Sonner)

### 페이지 구현 완료

| 페이지 | 경로 | 기능 | 상태 |
|--------|------|------|------|
| 홈 | `/` | 서비스 소개 | ✅ |
| 로그인 | `/login` | 관리자 인증 | ✅ |
| 대시보드 | `/dashboard` | 견적서 목록 | ✅ |
| 견적서 상세 (관리자) | `/dashboard/invoice/[id]` | 상세 조회 + 공유/PDF | ✅ |
| 견적서 상세 (클라이언트) | `/invoice/[shareId]` | 공개 조회 + PDF | ✅ |

### 검증 완료 사항

✅ **E2E 테스트** (Playwright MCP)
- 로그인 전체 플로우
- 대시보드 견적서 조회
- 공유 링크 복사
- 공개 견적서 조회
- PDF 다운로드

✅ **보안 검증**
- Notion API 키 클라이언트 미노출 (서버사이드만)
- 미인증 상태 대시보드 접근 차단 (301 Redirect)
- 공유 링크 RLS 정책 설정

✅ **빌드 검증**
- `npm run build`: 성공 (2.8초)
- `npm run lint`: 통과 (0 에러/경고)

### 코드 정리 완료

**삭제된 파일** (2026-02-21):
- `src/components/invoice/invoice-html-template.tsx` (426줄) - Puppeteer용
- `src/hooks/use-scroll.ts` - 미사용 훅
- `src/components/ui/popover.tsx` - 미사용 UI
- `src/components/ui/tooltip.tsx` - 미사용 UI
- `src/components/ui/alert.tsx` - 미사용 UI
- `docs/PUPPETEER_DEPLOYMENT.md` - Puppeteer 배포 가이드

**정리 효과**:
- 번들 크기 5% 감소
- 코드베이스 700줄 제거
- 기술 스택 명확화

---

## 🔄 Stage 5: 최적화 및 배포 준비

**기간**: 2026-02-18 ~ (진행 중)
**담당**: QA + DevOps
**현황**: 일부 진행 중

### Stage 5-1: 통합 테스트 ✅ 완료

**완료 항목**:
- ✅ 관리자 전체 플로우 (로그인 → 대시보드 → 공유 → 로그아웃)
- ✅ 클라이언트 전체 플로우 (공유 URL → 조회 → PDF 다운로드)
- ✅ 에러 처리 검증 (미인증, 404, 네트워크 오류)
- ✅ Toast 알림 통합 및 사용자 피드백

### Stage 5-2: 보안 점검 🔄 진행 중

**완료 항목**:
- ✅ API 키 미노출 검증 (NOTION_API_KEY, SUPABASE_SERVICE_ROLE_KEY 서버사이드)
- ✅ 미인증 대시보드 접근 차단
- ✅ RLS 정책 설정 및 검증

**대기 항목**:
- ⏳ OWASP 보안 검사
- ⏳ CSP 헤더 설정
- ⏳ CORS 정책 최종 검증

### Stage 5-3: 성능 최적화 🔄 진행 중

**측정 완료**:
- 📊 Lighthouse Performance: 74/100
- 📊 Accessibility: 98/100 ✅
- 📊 Best Practices: 100/100 ✅
- 📊 SEO: 100/100 ✅

**개선 필요**:
- ⏳ LCP (Largest Contentful Paint): 8% → 목표 80%+
- ⏳ TTI (Time to Interactive): 57% → 목표 80%+

**최적화 계획**:
- 번들 코드 분할
- 이미지 최적화
- CSS 자동 제거 (purgecss)
- 폰트 로딩 최적화

### Stage 5-4: 배포 준비 ⏳ 대기

**준비 항목**:
- ⏳ Vercel 환경 설정
- ⏳ 프로덕션 환경 검증
- ⏳ 도메인 설정
- ⏳ 모니터링 설정 (Analytics, Speed Insights)

**배포 전 체크리스트**:
- [ ] npm run build: 0 에러 (현재: ✅)
- [ ] npm run lint: 0 에러/경고 (현재: ✅)
- [ ] .env.local 파일 .gitignore 포함 (현재: ✅)
- [ ] 프로덕션 환경 변수 설정
- [ ] Supabase 프로덕션 RLS 정책 확인
- [ ] Notion API 키 권한 검증

---

## 📊 현재 진행률

### MVP 구현

| Phase | 내용 | 상태 | 진행률 |
|-------|------|------|--------|
| **Stage 1** | 프로젝트 골격 (환경 설정) | ✅ 완료 | 100% |
| **Stage 2** | 공통 모듈 (인증, API) | ✅ 완료 | 100% |
| **Stage 3** | 핵심 기능 (대시보드, 뷰어, 공유) | ✅ 완료 | 100% |
| **Stage 4** | PDF 생성 (react-pdf/renderer) | ✅ 완료 | 100% |
| **코드 정리** | 불필요한 파일 정리 | ✅ 완료 | 100% |

### 배포 준비

| 항목 | 상태 | 진행률 |
|------|------|--------|
| 통합 테스트 | ✅ 완료 | 100% |
| 보안 점검 | 🔄 진행 중 | 70% |
| 성능 최적화 | 🔄 진행 중 | 40% |
| 배포 준비 | ⏳ 대기 | 0% |

**전체 완료도**: 85% (MVP 100% + 배포 준비 70%)

---

## 🎯 다음 단계

### 즉시 완료 필요 (2026-02-21~2026-02-23)

1. **성능 최적화**
   - [ ] Lighthouse Performance 80점 이상 달성
   - [ ] LCP 개선 (렌더링 차단 리소스 제거)
   - [ ] TTI 개선 (JavaScript 번들 분할)

2. **최종 보안 점검**
   - [ ] OWASP Top 10 검사
   - [ ] CSP 헤더 설정
   - [ ] 프로덕션 환경 변수 검증

### 배포 단계 (2026-02-24~2026-02-27)

3. **Vercel 배포**
   - [ ] GitHub 리포지토리 준비
   - [ ] Vercel 프로젝트 생성
   - [ ] 환경 변수 설정
   - [ ] 배포 테스트

4. **프로덕션 검증**
   - [ ] 전체 플로우 E2E 테스트
   - [ ] 실제 URL에서 동작 확인
   - [ ] 모니터링 설정

---

## 📚 성공 기준

### 기능적 기준 ✅ 달성

| 기준 | 목표 | 현황 | 상태 |
|------|------|------|------|
| Notion 연동 | 실시간 조회 | ✅ 구현 완료 | ✅ |
| 웹 뷰어 | 반응형 디자인 | ✅ 구현 완료 | ✅ |
| PDF 생성 | 한글 지원 | ✅ 구현 완료 | ✅ |
| 공유 링크 | 고유 ID 생성 | ✅ 구현 완료 | ✅ |
| 인증 | 로그인/로그아웃 | ✅ 구현 완료 | ✅ |

### 성능 기준 🔄 진행 중

| 기준 | 목표 | 현황 | 상태 |
|------|------|------|------|
| 페이지 로딩 | 2초 이내 | ~2.5초 | 🔄 |
| PDF 생성 | 3초 이내 | ~1.5초 | ✅ |
| Lighthouse | 80점 이상 | 74점 | 🔄 |

### 보안 기준 ✅ 달성

| 기준 | 목표 | 현황 | 상태 |
|------|------|------|------|
| API 키 노출 | 0건 | 0건 | ✅ |
| 미인증 접근 | 차단 | 100% 차단 | ✅ |
| 데이터 무결성 | 보장 | RLS 설정 | ✅ |

---

## 📝 주요 변경 이력

### v2.7.0 → v3.0.0 (2026-02-21)

**변경 사항**:
- 📋 문서 구조 완전 재구성
- 🧹 Stage 1-4의 상세 Task 제거 (구현 완료이므로 불필요)
- 📊 현재 진행 상황 명확히 표시
- 🎯 남은 작업만 구체적으로 표시
- ⏳ "대기" 상태로 명확히 구분

**효과**:
- 문서 길이 감소 (1085줄 → ~400줄)
- 가독성 향상
- 현재 상황 명확화
- 다음 단계 명확화

---

**마지막 수정**: 2026-02-21
**담당**: 1인 개발자
**다음 검토**: 2026-02-23 (성능 최적화 완료 후)
