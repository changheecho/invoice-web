'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FileText, Copy, Check, Loader2 } from 'lucide-react' // Loader2: 링크 생성/PDF 로딩

/**
 * 견적서 액션 버튼 컴포넌트 (클라이언트 컴포넌트)
 *
 * PDF 다운로드 버튼과 공유 링크 복사 버튼을 제공합니다.
 * 실제 로직(API 호출, 클립보드 복사)은 부모 컴포넌트에서
 * onPdfClick / onShareClick 핸들러로 전달합니다.
 *
 * @example
 * // 관리자 상세 페이지 (PDF + 공유 링크 복사)
 * <InvoiceActions
 *   invoiceId="abc123"
 *   shareId="xyz789"
 *   showPdfButton
 *   showShareButton
 *   onPdfClick={handlePdfDownload}
 *   onShareClick={handleShareCopy}
 * />
 *
 * // 공개 견적서 페이지 (PDF 다운로드만)
 * <InvoiceActions
 *   invoiceId="abc123"
 *   showPdfButton
 *   showShareButton={false}
 *   onPdfClick={handlePdfDownload}
 * />
 */
interface InvoiceActionsProps {
  /** Notion 페이지 ID */
  invoiceId: string
  /** 공유 링크 ID - 없으면 공유 버튼이 비활성화됩니다 */
  shareId?: string
  /** PDF 다운로드 버튼 표시 여부 (기본값: true) */
  showPdfButton?: boolean
  /** 공유 링크 복사 버튼 표시 여부 (기본값: true) */
  showShareButton?: boolean
  /** PDF 파일명 (접근성 레이블 및 다운로드 hint용) */
  pdfFileName?: string
  /** PDF 버튼 클릭 핸들러 */
  onPdfClick?: () => void
  /** 공유 버튼 클릭 핸들러 */
  onShareClick?: () => void
  /** PDF 생성 중 로딩 상태 (기본값: false) */
  isLoading?: boolean
  /** 공유 링크 복사 성공 상태 (기본값: false) */
  isShared?: boolean
  /** 공유 링크 생성 중 로딩 상태 (기본값: false) */
  isGeneratingShareLink?: boolean
  /** 루트 요소에 추가할 Tailwind 클래스 */
  className?: string
}

/**
 * 견적서 액션 버튼 그룹
 */
export const InvoiceActions = ({
  invoiceId,
  shareId,
  showPdfButton = true,
  showShareButton = true,
  pdfFileName = '견적서.pdf',
  onPdfClick,
  onShareClick,
  isLoading = false,
  isShared = false,
  isGeneratingShareLink = false,
  className,
}: InvoiceActionsProps) => {
  // shareId가 없거나 생성 중이면 공유 버튼을 비활성화
  const isShareDisabled = !shareId && !isGeneratingShareLink

  return (
    <div
      className={cn(
        // 모바일: 세로 배열, 데스크톱: 가로 배열
        'flex flex-col gap-2 sm:flex-row sm:gap-3',
        className
      )}
      role="group"
      aria-label="견적서 액션"
    >
      {/* PDF 다운로드 버튼 */}
      {showPdfButton && (
        <Button
          variant="default"
          onClick={onPdfClick}
          disabled={isLoading}
          aria-label={isLoading ? 'PDF 생성 중' : `${pdfFileName} 다운로드`}
          aria-busy={isLoading}
          data-invoice-id={invoiceId}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            // 로딩 스피너
            <Loader2
              className="size-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            // PDF 파일 아이콘
            <FileText
              className="size-4"
              aria-hidden="true"
            />
          )}
          <span>{isLoading ? 'PDF 생성 중...' : 'PDF 다운로드'}</span>
        </Button>
      )}

      {/* 공유 링크 복사 버튼 */}
      {showShareButton && (
        <Button
          variant="outline"
          onClick={onShareClick}
          disabled={isShareDisabled || isGeneratingShareLink}
          aria-label={
            isGeneratingShareLink
              ? '공유 링크 생성 중'
              : isShareDisabled
                ? '공유 링크를 먼저 생성해주세요'
                : isShared
                  ? '링크가 클립보드에 복사되었습니다'
                  : '공유 링크를 클립보드에 복사'
          }
          aria-pressed={isShared}
          aria-busy={isGeneratingShareLink}
          data-invoice-id={invoiceId}
          data-share-id={shareId}
          className={cn(
            'w-full sm:w-auto',
            // 복사 성공 상태: 초록빛 강조
            isShared && 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
          )}
        >
          {isGeneratingShareLink ? (
            // 생성 중 스피너
            <Loader2
              className="size-4 animate-spin"
              aria-hidden="true"
            />
          ) : isShared ? (
            // 복사 완료 아이콘
            <Check
              className="size-4"
              aria-hidden="true"
            />
          ) : (
            // 복사 아이콘
            <Copy
              className="size-4"
              aria-hidden="true"
            />
          )}
          <span>
            {isGeneratingShareLink ? '링크 생성 중...' : isShared ? '복사됨!' : '링크 복사'}
          </span>
        </Button>
      )}
    </div>
  )
}
