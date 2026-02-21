/**
 * 대시보드 테이블 래퍼 (Post-MVP Phase 4)
 *
 * 선택 상태를 관리하는 Client Component입니다.
 * 서버 컴포넌트(InvoiceTableBody)의 결과를 받아서
 * 클라이언트 측 선택 기능을 추가합니다.
 */

'use client'

import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { InvoiceSummary } from '@/types'
import { InvoiceTableRowClient } from './InvoiceTableRowClient'
import { DashboardBulkActions } from './DashboardBulkActions'

interface DashboardTableWrapperProps {
  /** 견적서 데이터와 조회 통계 */
  data: Array<{
    invoice: InvoiceSummary
    viewCount: number
    lastViewedAt?: string
  }>
}

/**
 * 대시보드 테이블 래퍼 컴포넌트
 */
export const DashboardTableWrapper = ({ data }: DashboardTableWrapperProps) => {
  // 선택된 invoice ID 목록
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  /**
   * 선택된 invoice 목록을 메모이제이션합니다.
   */
  const selectedInvoices = useMemo(() => {
    return data
      .map((item) => item.invoice)
      .filter((invoice) => selectedIds.has(invoice.id))
  }, [data, selectedIds])

  /**
   * 전체 선택 여부
   */
  const isAllSelected = data.length > 0 && selectedIds.size === data.length

  /**
   * 전체 선택/해제 핸들러
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(data.map((item) => item.invoice.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  /**
   * 개별 선택 핸들러
   */
  const handleSelectionChange = (invoiceId: string, selected: boolean) => {
    const newSelectedIds = new Set(selectedIds)
    if (selected) {
      newSelectedIds.add(invoiceId)
    } else {
      newSelectedIds.delete(invoiceId)
    }
    setSelectedIds(newSelectedIds)
  }

  /**
   * 선택 해제 핸들러
   */
  const handleClear = () => {
    setSelectedIds(new Set())
  }

  return (
    <>
      <Table aria-label="견적서 목록 테이블">
        {/* 테이블 헤더 */}
        <TableHeader>
          <TableRow className="bg-muted/50 dark:bg-muted/20 hover:bg-muted/50 dark:hover:bg-muted/20">
            {/* 전체 선택 체크박스 */}
            <TableHead className="w-12 px-2" scope="col">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="모든 항목 선택"
              />
            </TableHead>

            {/* 제목 컬럼 */}
            <TableHead
              className="w-[200px] lg:w-[240px] pl-4"
              scope="col"
            >
              제목
            </TableHead>

            {/* 클라이언트명 컬럼 */}
            <TableHead
              className="w-[160px]"
              scope="col"
            >
              클라이언트
            </TableHead>

            {/* 총 금액 컬럼 - 우측 정렬 */}
            <TableHead
              className="text-right w-[140px]"
              scope="col"
            >
              총 금액
            </TableHead>

            {/* 견적 일자 컬럼 - 태블릿 이상에서만 표시 */}
            <TableHead
              className="hidden md:table-cell w-[120px]"
              scope="col"
            >
              견적 일자
            </TableHead>

            {/* 상태 컬럼 - 소형 화면 이상에서 표시 */}
            <TableHead
              className="hidden sm:table-cell w-[100px]"
              scope="col"
            >
              상태
            </TableHead>

            {/* 조회 컬럼 - 소형 화면 이상에서 표시 */}
            <TableHead
              className="hidden sm:table-cell w-[100px]"
              scope="col"
            >
              조회
            </TableHead>

            {/* 액션 컬럼 */}
            <TableHead
              className="w-[80px] text-right pr-4"
              scope="col"
              aria-label="액션"
            >
              <span className="sr-only">액션</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        {/* 테이블 바디 */}
        <TableBody>
          {data.map(({ invoice, viewCount, lastViewedAt }) => (
            <InvoiceTableRowClient
              key={invoice.id}
              invoice={invoice}
              viewCount={viewCount}
              lastViewedAt={lastViewedAt}
              isSelected={selectedIds.has(invoice.id)}
              onSelectionChange={handleSelectionChange}
            />
          ))}
        </TableBody>
      </Table>

      {/* 일괄 액션 바 - 선택된 항목이 있을 때만 표시 */}
      {selectedInvoices.length > 0 && (
        <DashboardBulkActions
          selectedInvoices={selectedInvoices}
          onClear={handleClear}
        />
      )}
    </>
  )
}
