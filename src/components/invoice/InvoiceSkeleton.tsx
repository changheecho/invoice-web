/**
 * 견적서 목록 테이블 로딩 스켈레톤 컴포넌트
 *
 * 대시보드에서 Notion API 데이터를 불러오는 동안
 * 테이블 행 모양의 플레이스홀더를 표시합니다.
 *
 * @example
 * <InvoiceTableSkeleton rows={5} />
 */
import { Skeleton } from '@/components/ui/skeleton'
import {
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'

/**
 * 견적서 테이블 스켈레톤 Props
 * @property rows - 표시할 스켈레톤 행 수 (기본값: 5)
 */
interface InvoiceTableSkeletonProps {
  rows?: number
}

/**
 * 개별 스켈레톤 테이블 행
 * 실제 테이블 행과 동일한 컬럼 구조로 구성됩니다.
 */
const SkeletonRow = () => (
  <TableRow aria-hidden="true">
    {/* 제목 컬럼 */}
    <TableCell>
      <Skeleton className="h-4 w-36" />
    </TableCell>

    {/* 클라이언트명 컬럼 */}
    <TableCell>
      <Skeleton className="h-4 w-24" />
    </TableCell>

    {/* 총 금액 컬럼 */}
    <TableCell className="text-right">
      <div className="flex justify-end">
        <Skeleton className="h-4 w-20" />
      </div>
    </TableCell>

    {/* 견적 일자 컬럼 */}
    <TableCell className="hidden md:table-cell">
      <Skeleton className="h-4 w-24" />
    </TableCell>

    {/* 상태 컬럼 */}
    <TableCell className="hidden sm:table-cell">
      <Skeleton className="h-6 w-14 rounded-full" />
    </TableCell>

    {/* 액션 컬럼 */}
    <TableCell>
      <div className="flex items-center gap-2 justify-end">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </TableCell>
  </TableRow>
)

/**
 * 견적서 목록 테이블 스켈레톤 컴포넌트
 * Suspense fallback 또는 로딩 상태에서 사용합니다.
 */
export const InvoiceTableSkeleton = ({
  rows = 5,
}: InvoiceTableSkeletonProps) => {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonRow key={index} />
      ))}
    </TableBody>
  )
}
