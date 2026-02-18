import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { INVOICE_STATUS_LABELS } from '@/lib/constants'
import type { InvoiceStatus } from '@/types'

/**
 * 견적서 상태를 색깔 있는 배지로 표시하는 컴포넌트
 *
 * constants.ts의 INVOICE_STATUS_LABELS, INVOICE_STATUS_VARIANTS를 기반으로
 * 상태에 맞는 한국어 레이블과 Badge variant를 자동으로 적용합니다.
 *
 * @example
 * <InvoiceStatusBadge status="sent" />
 * <InvoiceStatusBadge status="confirmed" className="text-sm" />
 */
interface InvoiceStatusBadgeProps {
  /** 견적서 상태 값 */
  status: InvoiceStatus
  /** 추가 Tailwind 클래스 */
  className?: string
}

/**
 * 상태별 추가 스타일 오버라이드 맵
 *
 * shadcn/ui Badge의 기본 variant 외에 특정 상태에 대해
 * 더 명확한 색상 구분이 필요한 경우 클래스를 추가합니다.
 */
const STATUS_EXTRA_CLASSES: Record<InvoiceStatus, string> = {
  pending: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
  draft: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  sent: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  completed: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
}

/**
 * 견적서 상태 배지 컴포넌트
 */
export const InvoiceStatusBadge = ({
  status,
  className,
}: InvoiceStatusBadgeProps) => {
  // 상태별 한국어 레이블
  const label = INVOICE_STATUS_LABELS[status]

  // 상태별 색상 클래스
  const extraClasses = STATUS_EXTRA_CLASSES[status]

  return (
    <Badge
      variant="outline"
      className={cn(
        'border font-medium',
        extraClasses,
        className
      )}
      aria-label={`견적서 상태: ${label}`}
    >
      {label}
    </Badge>
  )
}
