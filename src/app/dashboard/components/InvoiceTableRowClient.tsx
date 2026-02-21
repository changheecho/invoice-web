/**
 * 견적서 테이블 행 Client Component (Post-MVP Phase 4)
 *
 * 대시보드 테이블의 행 컴포넌트를 Client Component로 분리하여
 * 복사 기능 구현을 위한 상태 관리를 가능하게 합니다.
 *
 * @property invoice - 견적서 요약 데이터
 * @property viewCount - 조회 횟수
 * @property lastViewedAt - 최근 조회 일시
 */

'use client'

import Link from 'next/link'
import { Copy, ChevronRight, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { InvoiceStatusBadge } from '@/components/invoice/InvoiceStatusBadge'
import { InvoiceViewStatusBadge } from '@/components/invoice/InvoiceViewStatusBadge'
import { ROUTES } from '@/lib/constants'
import type { InvoiceSummary } from '@/types'

/**
 * 금액을 한국 원화 형식으로 포맷합니다.
 */
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

/**
 * ISO 날짜 문자열을 YYYY-MM-DD 형식으로 반환합니다.
 */
const formatDate = (dateString: string): string => {
  return dateString.split('T')[0]
}

interface InvoiceTableRowClientProps {
  invoice: InvoiceSummary
  viewCount?: number
  lastViewedAt?: string
}

/**
 * 견적서 테이블 행 Client Component
 *
 * Copy 버튼의 상태 관리(로딩, 성공)를 처리하며,
 * 공유 링크 복사 기능을 제공합니다.
 */
export const InvoiceTableRowClient = ({
  invoice,
  viewCount = 0,
  lastViewedAt,
}: InvoiceTableRowClientProps) => {
  // Copy 버튼 상태
  const [isCopying, setIsCopying] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  /**
   * 공유 링크 복사 핸들러
   * POST /api/share-links를 호출하여 링크를 생성 또는 조회한 후
   * 클립보드에 복사합니다.
   */
  const handleCopyLink = async () => {
    setIsCopying(true)
    setCopySuccess(false)

    try {
      // 공유 링크 생성 또는 조회
      const response = await fetch('/api/share-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notionPageId: invoice.id,
        }),
      })

      if (!response.ok) {
        throw new Error('링크 생성 실패')
      }

      const data = await response.json()

      // 링크 복사
      if (data.success && data.data?.shareUrl) {
        await navigator.clipboard.writeText(data.data.shareUrl)

        toast.success('링크가 복사되었습니다')
        setCopySuccess(true)

        // 2초 후 성공 상태 해제
        setTimeout(() => {
          setCopySuccess(false)
        }, 2000)
      } else {
        throw new Error('링크 데이터 오류')
      }
    } catch (error) {
      toast.error('링크 복사 실패')
      console.error('[Copy] 복사 실패:', error)
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <TableRow className="group">
      {/* 제목 */}
      <TableCell>
        <Link
          href={ROUTES.DASHBOARD_INVOICE(invoice.id)}
          className={cn(
            'font-medium text-foreground',
            'hover:text-primary hover:underline underline-offset-4',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm'
          )}
          aria-label={`${invoice.title} 상세 페이지로 이동`}
        >
          {invoice.title}
        </Link>
      </TableCell>

      {/* 클라이언트명 */}
      <TableCell className="text-muted-foreground">
        {invoice.clientName}
      </TableCell>

      {/* 총 금액 */}
      <TableCell className="text-right font-medium tabular-nums">
        {formatAmount(invoice.totalAmount)}
      </TableCell>

      {/* 견적 일자 (태블릿 이상) */}
      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
        {formatDate(invoice.invoiceDate)}
      </TableCell>

      {/* 상태 배지 (소형 화면 이상) */}
      <TableCell className="hidden sm:table-cell">
        <InvoiceStatusBadge status={invoice.status} />
      </TableCell>

      {/* 조회 상태 배지 (소형 화면 이상) */}
      <TableCell className="hidden sm:table-cell">
        <InvoiceViewStatusBadge viewCount={viewCount} lastViewedAt={lastViewedAt} />
      </TableCell>

      {/* 액션 버튼 */}
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          {/* 복사 버튼 */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopyLink}
            disabled={isCopying}
            aria-label={`${invoice.clientName} 견적서 공유 링크 복사`}
            title="공유 링크 복사"
            className={cn(
              'text-muted-foreground hover:text-foreground',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              copySuccess && 'text-green-600 dark:text-green-400'
            )}
          >
            {copySuccess ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>

          {/* 상세보기 버튼 */}
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            aria-label={`${invoice.clientName} 견적서 상세보기`}
            title="상세보기"
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href={ROUTES.DASHBOARD_INVOICE(invoice.id)}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
