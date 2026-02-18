---
allowed-tools: Read, Edit, Glob, Grep
description: ROADMAP.md의 완료된 태스크를 체크하고 Stage 현황을 업데이트합니다. 실제 구현된 파일을 확인하여 [x]로 변경하고, Stage 상태를 갱신합니다.
---

# ROADMAP 자동 업데이트 커맨드

## Phase 1: 현재 ROADMAP.md 상태 파악

1. `docs/ROADMAP.md` 파일 전체를 읽어서 현재 체크 상태 파악
   - Stage 1, 2, 3, 4, 5의 각 기술 태스크 섹션 검토
   - 현재 [ ] 또는 [x]로 표시된 항목 목록화

## Phase 2: 구현된 파일 존재 여부 확인

### Stage 1 검증 항목 (프로젝트 골격)

**1-1. 환경 변수 설정**
- [ ] `src/lib/env.ts` 파일 존재 확인
- [ ] `npm run dev` 환경 변수 에러 검증 항목

**1-2. @notionhq/client v5 API 호환성 검증**
- [ ] `src/app/api/notion/invoices/route.ts` 존재 확인
- [ ] Notion 데이터 조회 함수 구현 확인

**1-3. Supabase 데이터베이스 초기화**
- [ ] `src/lib/supabase/server.ts` 존재 확인
- [ ] Share Links 테이블 관련 파일 확인

**1-4. Middleware 검증**
- [ ] `src/middleware.ts` 존재 확인
- [ ] 인증 보호 로직 구현 확인

### Stage 2 검증 항목 (공통 모듈)

**2-1. Notion 데이터 조회 함수**
- [ ] `src/lib/notion/items.ts` 파일 존재 확인
- [ ] `getInvoices()`, `getInvoiceById()` 함수 구현

**2-2. ShareLink CRUD**
- [ ] `src/lib/supabase/share-links.ts` 파일 존재 확인

**2-3. 로그인/인증 기능**
- [ ] `src/app/login/page.tsx` 파일 존재 확인
- [ ] Supabase Auth 연동 확인

### Stage 3 검증 항목 (핵심 기능)

**Phase 2: 대시보드 UI (Day 4 ~ Day 6)**
- [ ] `src/app/dashboard/page.tsx` 파일 존재 및 내용 확인
  - 목록 테이블 구현 확인
  - Suspense + Skeleton 로딩 상태 확인
- [ ] `src/components/ui/sonner.tsx` 또는 Toast 컴포넌트 확인
- [ ] 헤더 로그아웃 버튼 구현 확인

**Phase 3: 웹 뷰어 컴포넌트 (Day 7 ~ Day 8)**
- [ ] `src/components/invoice/InvoiceViewer.tsx` 파일 존재 확인
  - 전문적인 인보이스 레이아웃
  - 응답형 디자인 구현
- [ ] `src/components/invoice/InvoiceStatusBadge.tsx` 파일 존재 확인
- [ ] `src/components/invoice/InvoiceActions.tsx` 파일 존재 확인
  - PDF 다운로드 버튼
  - 공유 링크 복사 버튼
- [ ] `src/components/invoice/InvoiceSkeleton.tsx` 파일 존재 확인

**Phase 2-3 통합: 공유 링크 (Day 6 ~ Day 7)**
- [ ] `/api/share-links` POST 엔드포인트 구현 확인
- [ ] 대시보드에서 공유 링크 복사 버튼 활성화 확인

**Phase 2-3 페이지 리팩토링 (Day 9 ~ Day 10)**
- [ ] `src/app/dashboard/invoice/[id]/page.tsx` 리팩토링 완료
- [ ] `src/app/invoice/[shareId]/page.tsx` 리팩토링 완료
  - `InvoiceViewer` 컴포넌트 사용
  - `InvoiceActions` 컴포넌트 통합
- [ ] `src/app/not-found.tsx` (전역 404) 파일 존재 확인
- [ ] `src/app/error.tsx` (전역 에러) 파일 존재 확인
- [ ] 홈 페이지 CTA 버튼 추가 확인

### Stage 4 검증 항목 (추가 기능 - PDF)

**4-1. 한글 폰트 TTF 파일 준비**
- [ ] `public/fonts/NotoSansKR-Regular.ttf` 파일 존재 확인
- [ ] `public/fonts/NotoSansKR-Bold.ttf` 파일 존재 확인 (선택)

**4-2. PDF 문서 컴포넌트**
- [ ] `src/components/invoice/invoice-pdf-document.tsx` 파일 존재 확인
  - TTF 폰트 소스 설정 확인
  - 레이아웃 구현 확인

**4-3. PDF 생성 API**
- [ ] `src/app/api/invoice/[shareId]/pdf/route.ts` 파일 존재 확인
  - Node.js Runtime 설정 확인
  - PDF 응답 로직 확인

**4-4. PDF 다운로드 클라이언트**
- [ ] `InvoiceActions.tsx`에 PDF 다운로드 로직 구현 확인

### Stage 5 검증 항목 (최적화 및 배포)

**5-1. 에러 페이지**
- [ ] `src/app/error.tsx` 구현 확인
- [ ] `src/app/not-found.tsx` 구현 확인

**5-2. 빌드 및 린트**
- [ ] `npm run build` 오류 0건 확인

## Phase 3: ROADMAP.md 업데이트

완료된 파일들을 확인한 후, ROADMAP.md의 다음 섹션을 업데이트합니다:

### Stage 1 섹션 업데이트
- Stage 1의 모든 기술 태스크 항목에서 [ ]를 [x]로 변경
- "현황" 필드를 "✅ **완료** (2026-02-18)"로 변경

### Stage 3 섹션 업데이트
- Phase 2, 3 관련 항목들을 [x]로 표시
  - InvoiceViewer.tsx 구현 확인 시 체크
  - InvoiceStatusBadge.tsx 구현 확인 시 체크
  - InvoiceActions.tsx 구현 확인 시 체크
  - InvoiceSkeleton.tsx 구현 확인 시 체크
  - dashboard/page.tsx 구현 확인 시 체크
  - not-found.tsx, error.tsx 구현 확인 시 체크
- "현황" 필드를 현재 상태로 업데이트 (완료도에 따라)
  - 예: "부분 완료, 통합 필요" → "완료" 또는 "일부 완료"

### 구현 현황 테이블 업데이트 (43~79줄)
- 완료된 파일의 "구현 상태" 컬럼을 다시 확인
- 미구현 구성 요소 목록(72~79줄)에서 실제 구현된 항목 제거
  - InvoiceViewer.tsx 구현됨 → 목록에서 제거
  - InvoiceStatusBadge.tsx 구현됨 → 목록에서 제거
  - InvoiceActions.tsx 구현됨 → 목록에서 제거
  - InvoiceSkeleton.tsx 구현됨 → 목록에서 제거
  - dashboard/components/ 구현됨 → 목록에서 제거
  - not-found.tsx, error.tsx 구현됨 → 목록에서 제거

## Phase 4: 최종 요약 출력

완료 후 다음 형식으로 요약 출력:

```
✅ ROADMAP 업데이트 완료

📊 변경 통계:
- Stage 1 완료 항목: [X개 체크됨]
- Stage 3 완료 항목: [X개 체크됨]
- 기타 Stage: [현황]

🎯 현재 진행 상태:
- Stage 1: ✅ 완료
- Stage 2: [현황 반영]
- Stage 3: [현황 반영]
- Stage 4: [현황 반영]
- Stage 5: [현황 반영]

📝 다음 단계:
[다음으로 진행해야 할 Stage 안내]

⚠️  주의사항:
- public/fonts/NotoSansKR-Regular.ttf 파일이 필수 (Stage 4)
- 각 페이지 E2E 테스트 권장
```

## 실행 순서

1. `Read` 도구로 현재 ROADMAP.md 전체 읽기
2. `Glob` 도구로 주요 파일들 존재 확인
3. `Read` 도구로 필요시 개별 파일 내용 확인
4. `Edit` 도구로 ROADMAP.md 업데이트 (섹션별 순차 편집)
5. 최종 요약 메시지 출력
