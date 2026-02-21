/**
 * 견적서 조회 상태 배지 컴포넌트 (Post-MVP Phase 2)
 *
 * 미조회 vs 조회됨 상태를 색깔 있는 배지로 표시합니다.
 * InvoiceStatusBadge 패턴을 참고하여 구현
 *
 * @example
 * <InvoiceViewStatusBadge viewCount={0} />  // "미조회" 배지
 * <InvoiceViewStatusBadge viewCount={5} lastViewedAt="2026-02-21T..." />  // "조회됨 5회" 배지
 */

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

/**
 * 조회 상태 배지 Props
 */
interface InvoiceViewStatusBadgeProps {
  /** 총 조회 횟수 */
  viewCount: number
  /** 최근 조회 일시 (선택) */
  lastViewedAt?: string
  /** 추가 Tailwind 클래스 */
  className?: string
}

/**
 * 조회 상태별 추가 스타일 맵
 *
 * shadcn/ui Badge의 기본 variant 외에
 * 조회 상태에 따른 색상 구분
 */
const VIEW_STATUS_EXTRA_CLASSES = {
  unviewed:
    'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  viewed:
    'bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
}

/**
 * 조회 상태 배지 컴포넌트
 *
 * 미조회 또는 조회됨 상태를 배지로 표시합니다.
 * 다크모드 지원
 */
export const InvoiceViewStatusBadge = ({
  viewCount,
  lastViewedAt,
  className,
}: InvoiceViewStatusBadgeProps) => {
  // 조회 상태 결정
  const isViewed = viewCount > 0
  const status = isViewed ? 'viewed' : 'unviewed'

  // 상태별 한국어 레이블
  const label = isViewed ? `조회됨 ${viewCount}회` : '미조회'

  // 상태별 색상 클래스
  const extraClasses = VIEW_STATUS_EXTRA_CLASSES[status]

  // Tooltip 텍스트 (선택)
  let tooltipText = ''
  if (isViewed && lastViewedAt) {
    try {
      const date = new Date(lastViewedAt)
      tooltipText = `최근 조회: ${date.toLocaleString('ko-KR')}`
    } catch {
      tooltipText = '최근 조회: 알 수 없음'
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn('border font-medium', extraClasses, className)}
      aria-label={`조회 상태: ${label}`}
      title={tooltipText}
    >
      {label}
    </Badge>
  )
}
