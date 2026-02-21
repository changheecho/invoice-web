/**
 * InvoiceSummarySkeleton - 견적서 금액 요약 + 액션 버튼 영역 로딩 스켈레톤
 *
 * InvoiceViewer의 요약 섹션(총 금액)과 액션 슬롯 영역,
 * 그리고 푸터 섹션의 플레이스홀더를 렌더링합니다.
 *
 * 사용 위치:
 * - 공개 견적서 페이지 Suspense fallback
 * - 관리자 견적서 상세 페이지 Suspense fallback
 *
 * @example
 * <Suspense fallback={<InvoiceSummarySkeleton showActions />}>
 *   <InvoiceSummarySection invoice={invoice} />
 * </Suspense>
 */
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * 견적서 합계 스켈레톤 Props
 * @property showActions - 액션 버튼 스켈레톤 표시 여부 (기본값: true)
 */
interface InvoiceSummarySkeletonProps {
  showActions?: boolean
}

/**
 * 견적서 요약(총액) + 액션 버튼 + 푸터 스켈레톤 컴포넌트
 *
 * InvoiceViewer의 다음 세 섹션에 대응합니다:
 * 1. 요약 섹션: 소계 / 구분선 / 총 금액
 * 2. 액션 슬롯: PDF 다운로드, 공유 링크 복사 버튼
 * 3. 푸터: 감사 메시지 + 자동 생성 안내
 */
export function InvoiceSummarySkeleton({
  showActions = true,
}: InvoiceSummarySkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="견적서 합계 로딩 중"
      className="px-6 sm:px-10 flex flex-col gap-8"
    >
      {/* ─────────────────────────────────────
          요약 섹션: 소계 + 총 금액
      ───────────────────────────────────── */}
      <div className="flex justify-end">
        <div
          className={cn(
            'flex flex-col gap-2',
            'min-w-[240px] sm:min-w-[280px]'
          )}
        >
          {/* 소계 행 */}
          <div className="flex justify-between items-center gap-8">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* 구분선 */}
          <Skeleton className="h-px w-full" />

          {/* 총 금액 행 (더 굵고 큰 텍스트) */}
          <div className="flex justify-between items-center gap-8 pt-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────
          액션 버튼 슬롯 (showActions=true 시 표시)
          PDF 다운로드 + 공유 링크 복사 버튼 영역
      ───────────────────────────────────── */}
      {showActions && (
        <div className="flex flex-wrap gap-3" aria-hidden="true">
          {/* PDF 다운로드 버튼 */}
          <Skeleton className="h-10 w-36 rounded-md" />
          {/* 공유 링크 복사 버튼 */}
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      )}

      {/* ─────────────────────────────────────
          푸터 섹션
      ───────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-col sm:flex-row sm:items-center sm:justify-between',
          'gap-2 -mx-6 sm:-mx-10 px-6 sm:px-10 py-5',
          'border-t border-border',
          'bg-muted/20'
        )}
      >
        {/* 감사 메시지 */}
        <Skeleton className="h-4 w-52" />
        {/* 자동 생성 안내 */}
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  )
}
