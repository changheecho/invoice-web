'use client'

/**
 * 대시보드 검색 및 상태 필터 클라이언트 컴포넌트
 *
 * 클라이언트명 검색 Input과 상태 필터 Select를 렌더링합니다.
 * URL SearchParams 기반 상태 관리는 Stage 3-2에서 연결 예정입니다.
 *
 * @example
 * <DashboardSearchFilter />
 */
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { INVOICE_STATUS_LABELS } from '@/lib/constants'
import type { InvoiceStatus } from '@/types'

/**
 * 상태 필터에 표시할 옵션 목록
 * InvoiceStatus 타입 기반으로 INVOICE_STATUS_LABELS에서 가져옵니다.
 */
const STATUS_OPTIONS: Array<{ value: InvoiceStatus; label: string }> = (
  Object.entries(INVOICE_STATUS_LABELS) as Array<[InvoiceStatus, string]>
).map(([value, label]) => ({ value, label }))

/**
 * 대시보드 검색/필터 컴포넌트
 * 검색 입력과 상태 필터 드롭다운을 제공합니다.
 */
export const DashboardSearchFilter = () => {
  return (
    <div
      className="flex flex-col sm:flex-row gap-3"
      role="search"
      aria-label="견적서 검색 및 필터"
    >
      {/* 클라이언트명 검색 입력 */}
      <div className="relative flex-1 max-w-sm">
        {/* 검색 아이콘 */}
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="클라이언트명 검색..."
          className="pl-9"
          aria-label="클라이언트명으로 검색"
          autoComplete="off"
        />
      </div>

      {/* 상태 필터 Select */}
      <Select defaultValue="all" aria-label="견적서 상태 필터">
        <SelectTrigger
          className="w-full sm:w-40"
          aria-label="상태 필터 선택"
        >
          <SelectValue placeholder="모든 상태" />
        </SelectTrigger>
        <SelectContent>
          {/* 기본 옵션: 모든 상태 */}
          <SelectItem value="all">모든 상태</SelectItem>

          {/* 상태별 옵션 목록 */}
          {STATUS_OPTIONS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
