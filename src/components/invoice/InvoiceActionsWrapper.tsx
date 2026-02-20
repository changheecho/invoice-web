'use client'

/**
 * 견적서 액션 래퍼 클라이언트 컴포넌트
 *
 * InvoiceActions의 onPdfClick / onShareClick 핸들러를 구현합니다.
 * 서버 컴포넌트인 페이지에서 직접 핸들러를 주입할 수 없기 때문에
 * 이 래퍼 컴포넌트를 통해 클라이언트 사이드 액션을 처리합니다.
 *
 * @example
 * // 공개 견적서 페이지 (PDF 다운로드만)
 * <InvoiceActionsWrapper
 *   invoiceId="abc123"
 *   shareId="xyz789"
 *   showPdfButton
 *   showShareButton={false}
 *   pdfFileName="견적서_홍길동_2026-02-18.pdf"
 * />
 *
 * @example
 * // 관리자 상세 페이지 (PDF + 공유 링크 복사)
 * <InvoiceActionsWrapper
 *   invoiceId="abc123"
 *   shareId="xyz789"
 *   showPdfButton
 *   showShareButton
 *   pdfFileName="견적서_홍길동_2026-02-18.pdf"
 *   shareUrl="https://yourdomain.com/invoice/xyz789"
 * />
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { InvoiceActions } from '@/components/invoice/InvoiceActions'

/**
 * InvoiceActionsWrapper Props
 * @property invoiceId - Notion 페이지 ID
 * @property shareId - 공유 링크 ID (공유 버튼 활성화에 필요)
 * @property showPdfButton - PDF 다운로드 버튼 표시 여부 (기본값: true)
 * @property showShareButton - 공유 링크 복사 버튼 표시 여부 (기본값: true)
 * @property pdfFileName - 다운로드될 PDF 파일명
 * @property shareUrl - 클립보드에 복사할 공유 URL
 * @property className - 추가 클래스명
 */
interface InvoiceActionsWrapperProps {
  invoiceId: string
  shareId?: string
  showPdfButton?: boolean
  showShareButton?: boolean
  pdfFileName?: string
  shareUrl?: string
  className?: string
}

/**
 * 견적서 액션 래퍼 컴포넌트
 * PDF 다운로드와 공유 링크 복사 기능의 클라이언트 사이드 로직을 담당합니다.
 */
export const InvoiceActionsWrapper = ({
  invoiceId,
  shareId: initialShareId,
  showPdfButton = true,
  showShareButton = true,
  pdfFileName = '견적서.pdf',
  shareUrl,
  className,
}: InvoiceActionsWrapperProps) => {
  // PDF 생성 중 로딩 상태
  const [isLoading, setIsLoading] = useState(false)
  // 공유 링크 복사 완료 상태
  const [isShared, setIsShared] = useState(false)
  // 공유 링크 생성 중 로딩 상태
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false)
  // 현재 shareId (초기값 또는 생성된 값)
  const [shareId, setShareId] = useState(initialShareId)

  /**
   * PDF 다운로드 핸들러
   * html2canvas로 현재 렌더링된 견적서 DOM을 캡처하여
   * jsPDF로 PDF로 변환하고 다운로드합니다.
   */
  const handlePdfClick = useCallback(async () => {
    setIsLoading(true)
    try {
      // 견적서 DOM 요소 캡처
      const element = document.getElementById('invoice-content')
      if (!element) throw new Error('견적서 영역을 찾을 수 없습니다')

      const canvas = await html2canvas(element, {
        scale: 2, // 고해상도 (retina)
        useCORS: true, // 외부 리소스 CORS 허용
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(pdfFileName)
      toast.success('PDF 다운로드가 완료되었습니다')
    } catch (error) {
      toast.error('PDF 다운로드에 실패했습니다')
      console.error('[PDF 다운로드] 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [pdfFileName])

  /**
   * 공유 링크 복사 핸들러
   * shareId가 없으면 먼저 API를 호출하여 생성한 후,
   * 클립보드 API를 사용해 공유 URL을 복사합니다.
   */
  const handleShareClick = useCallback(async () => {
    try {
      let finalShareUrl = shareUrl

      // shareId가 없으면 API를 호출하여 생성
      if (!shareId) {
        setIsGeneratingShareLink(true)
        const response = await fetch('/api/share-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notionPageId: invoiceId }),
        })

        if (!response.ok) {
          throw new Error('공유 링크 생성 실패')
        }

        const result = await response.json()
        if (!result.success || !result.data) {
          throw new Error(result.error || '공유 링크 생성 실패')
        }

        // 생성된 shareId 저장 및 URL 구성
        setShareId(result.data.shareId)
        finalShareUrl = result.data.shareUrl
      }

      // 클립보드에 URL 복사
      const urlToCopy = finalShareUrl ?? window.location.href
      await navigator.clipboard.writeText(urlToCopy)
      setIsShared(true)
      toast.success('공유 링크가 클립보드에 복사되었습니다')

      // 2초 후 복사 완료 상태 초기화
      setTimeout(() => setIsShared(false), 2000)
    } catch (error) {
      // 클립보드 API 미지원 환경 폴백 처리
      toast.error('공유 링크 복사에 실패했습니다')
      console.error('[공유 링크] 복사 실패:', error)
    } finally {
      setIsGeneratingShareLink(false)
    }
  }, [invoiceId, shareId, shareUrl])

  return (
    <InvoiceActions
      invoiceId={invoiceId}
      shareId={shareId}
      showPdfButton={showPdfButton}
      showShareButton={showShareButton}
      pdfFileName={pdfFileName}
      onPdfClick={handlePdfClick}
      onShareClick={handleShareClick}
      isLoading={isLoading}
      isShared={isShared}
      isGeneratingShareLink={isGeneratingShareLink}
      className={className}
    />
  )
}
