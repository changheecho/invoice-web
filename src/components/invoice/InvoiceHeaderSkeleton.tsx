/**
 * InvoiceHeaderSkeleton - 견적서 헤더 영역 로딩 스켈레톤
 *
 * InvoiceViewer의 헤더 섹션(발행사 로고+회사명, 견적서 제목 배지)과
 * 발신/수신 정보 섹션의 플레이스홀더를 렌더링합니다.
 *
 * 사용 위치:
 * - 공개 견적서 페이지 Suspense fallback
 * - 관리자 견적서 상세 페이지 Suspense fallback
 *
 * @example
 * <Suspense fallback={<InvoiceHeaderSkeleton />}>
 *   <InvoiceViewerHeader invoice={invoice} />
 * </Suspense>
 */
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * 견적서 헤더 + 발신/수신 정보 스켈레톤 컴포넌트
 *
 * InvoiceViewer의 다음 두 섹션에 대응합니다:
 * 1. <header>: 발행사 로고 + 회사명 / 견적서 제목 배지
 * 2. 발신/수신 정보 grid
 */
export function InvoiceHeaderSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="견적서 헤더 로딩 중"
    >
      {/* ─────────────────────────────────────
          헤더 섹션: 회사 로고 + 회사명 / 견적서 타이틀
      ───────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-col sm:flex-row sm:items-start sm:justify-between',
          'gap-4 px-6 py-8 sm:px-10',
          'border-b border-border'
        )}
      >
        {/* 좌측: 회사 로고 플레이스홀더 + 회사명 */}
        <div className="flex items-center gap-3">
          {/* 회사 로고 아이콘 영역 */}
          <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
          <div className="flex flex-col gap-2">
            {/* "발행사" 레이블 */}
            <Skeleton className="h-3 w-10" />
            {/* 회사명 */}
            <Skeleton className="h-5 w-32" />
          </div>
        </div>

        {/* 우측: 견적서 제목 배지 영역 */}
        <div className="flex flex-col sm:items-end gap-2">
          {/* "견적서" 큰 텍스트 */}
          <Skeleton className="h-7 w-20" />
          {/* Notion 페이지 제목 (부제목) */}
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* ─────────────────────────────────────
          발신/수신 정보 섹션
      ───────────────────────────────────── */}
      <div className="px-6 pt-8 sm:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 발신 정보 (발행사) */}
          <div className="flex flex-col gap-2">
            {/* "발신" 레이블 */}
            <Skeleton className="h-3 w-8" />
            {/* 회사명 */}
            <Skeleton className="h-5 w-36" />
            {/* 이메일 */}
            <Skeleton className="h-4 w-48" />
          </div>

          {/* 수신 정보 (클라이언트) */}
          <div className="flex flex-col gap-2 sm:items-end">
            {/* "수신" 레이블 */}
            <Skeleton className="h-3 w-8" />
            {/* 클라이언트명 */}
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
