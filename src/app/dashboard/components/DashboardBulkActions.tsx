/**
 * 대시보드 일괄 액션 바 (Post-MVP Phase 4)
 *
 * 선택된 견적서들에 대해 일괄 작업(복사)을 수행하는 컴포넌트입니다.
 * 선택된 항목이 있을 때만 표시됩니다.
 */

'use client'

import { Copy, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { InvoiceSummary } from '@/types'

/**
 * 복사 포맷 타입
 */
type CopyFormat = 'url' | 'markdown' | 'text'

interface DashboardBulkActionsProps {
  /** 선택된 견적서 목록 */
  selectedInvoices: InvoiceSummary[]
  /** 선택 해제 콜백 */
  onClear: () => void
}

/**
 * 복사 포맷에 따라 URL을 가공합니다.
 */
const formatCopyText = (
  shareUrl: string,
  format: CopyFormat,
  clientName: string
): string => {
  switch (format) {
    case 'url':
      return shareUrl
    case 'markdown':
      return `[견적서_${clientName}](${shareUrl})`
    case 'text':
      return `${clientName}: ${shareUrl}`
    default:
      return shareUrl
  }
}

/**
 * 일괄 액션 바 컴포넌트
 */
export const DashboardBulkActions = ({
  selectedInvoices,
  onClear,
}: DashboardBulkActionsProps) => {
  const [isLoading, setIsLoading] = useState(false)

  /**
   * 선택된 견적서들의 공유 링크를 일괄 복사합니다.
   * Promise.all()을 사용하여 병렬로 API를 호출합니다.
   */
  const handleBulkCopy = async (format: CopyFormat = 'url') => {
    setIsLoading(true)

    try {
      // 선택된 모든 견적서의 공유 링크를 병렬로 조회
      const linkPromises = selectedInvoices.map(async (invoice) => {
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
          throw new Error(`${invoice.title} 링크 생성 실패`)
        }

        const data = await response.json()
        if (!data.success || !data.data?.shareUrl) {
          throw new Error(`${invoice.title} 링크 데이터 오류`)
        }

        return {
          shareUrl: data.data.shareUrl,
          clientName: invoice.clientName,
        }
      })

      const links = await Promise.all(linkPromises)

      // 포맷에 따라 텍스트 생성 (줄바꿈으로 구분)
      const textToCopy = links
        .map(({ shareUrl, clientName }) =>
          formatCopyText(shareUrl, format, clientName)
        )
        .join('\n')

      // 클립보드에 복사
      await navigator.clipboard.writeText(textToCopy)

      const formatLabel = {
        url: 'URL',
        markdown: '마크다운',
        text: '텍스트',
      }[format]

      toast.success(`${selectedInvoices.length}개 항목이 ${formatLabel}로 복사되었습니다`)
      onClear()
    } catch (error) {
      toast.error('일괄 복사 실패')
      console.error('[BulkCopy] 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background dark:bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container mx-auto px-4 py-3 max-w-7xl flex items-center justify-between">
        {/* 선택 정보 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedInvoices.length}개 항목 선택
          </span>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          {/* 일괄 복사 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                disabled={isLoading}
                aria-label="선택된 항목 일괄 복사 (포맷 선택)"
              >
                <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                <span>일괄 복사</span>
                <ChevronDown className="h-3 w-3 ml-1" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => handleBulkCopy('url')}
                disabled={isLoading}
              >
                <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>URL 복사</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  기본
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkCopy('markdown')}
                disabled={isLoading}
              >
                <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>마크다운 복사</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkCopy('text')}
                disabled={isLoading}
              >
                <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>텍스트 복사</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 선택 해제 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={isLoading}
            aria-label="선택 해제"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline ml-2">해제</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
