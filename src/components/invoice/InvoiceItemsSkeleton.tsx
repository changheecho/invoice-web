/**
 * InvoiceItemsSkeleton - 견적서 항목 테이블 영역 로딩 스켈레톤
 *
 * InvoiceViewer의 상세 정보 행(메타 정보 grid)과
 * 항목 테이블 섹션의 플레이스홀더를 렌더링합니다.
 *
 * 사용 위치:
 * - 공개 견적서 페이지 Suspense fallback
 * - 관리자 견적서 상세 페이지 Suspense fallback
 *
 * @example
 * <Suspense fallback={<InvoiceItemsSkeleton rows={3} />}>
 *   <InvoiceItemsTable items={invoice.items} />
 * </Suspense>
 */
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * 견적서 항목 테이블 스켈레톤 Props
 * @property rows - 표시할 항목 행 수 (기본값: 3)
 */
interface InvoiceItemsSkeletonProps {
  rows?: number
}

/**
 * 개별 항목 행 스켈레톤
 * 실제 테이블 행(항목명 / 수량 / 단가 / 소계)과 동일한 4컬럼 구조입니다.
 */
function SkeletonItemRow() {
  return (
    <div className="grid grid-cols-4 gap-4 px-4 py-3 border-t border-border">
      {/* 항목명 (넓은 컬럼) */}
      <Skeleton className="h-4 w-32" />
      {/* 수량 (우측 정렬) */}
      <Skeleton className="h-4 w-8 ml-auto" />
      {/* 단가 (우측 정렬) */}
      <Skeleton className="h-4 w-20 ml-auto" />
      {/* 소계 (우측 정렬) */}
      <Skeleton className="h-4 w-20 ml-auto" />
    </div>
  )
}

/**
 * 견적서 상세 정보 + 항목 테이블 스켈레톤 컴포넌트
 *
 * InvoiceViewer의 다음 두 섹션에 대응합니다:
 * 1. 구분선 + 상세 정보 행 (메타 정보 4개 셀)
 * 2. 항목 테이블 (헤더 + N개 행 + 소계 행)
 */
export function InvoiceItemsSkeleton({ rows = 3 }: InvoiceItemsSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="견적서 항목 로딩 중"
      className="px-6 sm:px-10 flex flex-col gap-8"
    >
      {/* 구분선 스켈레톤 */}
      <Skeleton className="h-px w-full" />

      {/* ─────────────────────────────────────
          상세 정보 행: 견적 번호 / 견적 일자 / 만료일 / 상태
      ───────────────────────────────────── */}
      <div
        className={cn(
          'grid grid-cols-2 sm:grid-cols-4 gap-4',
          'rounded-lg bg-muted/40 px-5 py-4'
        )}
        aria-hidden="true"
      >
        {/* 메타 정보 4개 셀 */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            {/* 레이블 (아이콘 + 텍스트) */}
            <Skeleton className="h-3 w-16" />
            {/* 값 */}
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────
          항목 테이블 섹션
      ───────────────────────────────────── */}
      <div>
        {/* "견적 항목" 섹션 제목 */}
        <Skeleton className="h-3 w-16 mb-3" />

        {/* 테이블 래퍼 */}
        <div className="rounded-lg border border-border overflow-hidden">
          {/* 테이블 헤더 행 */}
          <div className="bg-muted/40 px-4 py-3">
            <div className="grid grid-cols-4 gap-4">
              {/* 열 헤더 레이블: 항목명 / 수량 / 단가 / 소계 */}
              {['항목명', '수량', '단가', '소계'].map((col) => (
                <Skeleton key={col} className="h-3 w-10" />
              ))}
            </div>
          </div>

          {/* 테이블 항목 행들 */}
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonItemRow key={i} />
          ))}

          {/* 소계 행 */}
          <div className="bg-muted/30 px-4 py-2.5 border-t border-border flex justify-end gap-4">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}
