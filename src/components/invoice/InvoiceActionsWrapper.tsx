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
import { toJpeg } from 'html-to-image'
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
   * html2canvas로 견적서를 이미지로 캡처한 후 jsPDF로 PDF 생성
   */
  const handlePdfClick = useCallback(async () => {
    setIsLoading(true)
    try {
      const element = document.getElementById('invoice-content')
      if (!element) throw new Error('견적서 영역을 찾을 수 없습니다')

      // Dark 모드 임시 제거
      const htmlElement = document.documentElement
      const hadDarkClass = htmlElement.classList.contains('dark')
      if (hadDarkClass) htmlElement.classList.remove('dark')

      try {
        // DOM을 이미지로 변환 (html-to-image)
        const filter = (node: HTMLElement) => {
          const exclusionId = node.dataset ? node.dataset.html2pdfIgnore : null;
          return exclusionId !== 'true';
        };

        const dataUrl = await toJpeg(element, {
          pixelRatio: 1.5, // 고해상도 이미지 처리 (2에서 1.5로 줄여 용량 최적화)
          quality: 0.95, // JPEG 품질 설정
          backgroundColor: '#ffffff',
          skipFonts: false,
          filter: filter,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        })

        // 이미지를 캔버스로 변환하여 기존 jsPDF 분할 로직 재사용
        const img = new Image()
        img.src = dataUrl
        await new Promise((resolve) => {
          img.onload = resolve
        })

        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
        }

        // PDF 생성
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true // PDF 내부 압축 활성화
        })

        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const imgWidth = pageWidth - 20
        const yOffset = 10

        // 페이지 높이에 맞게 분할
        let yPos = yOffset
        let imgPos = 0
        const maxImgHeightPerPage = (pageHeight - 20) * (canvas.width / imgWidth)

        while (imgPos < canvas.height) {
          const remainingHeight = canvas.height - imgPos
          const chunkHeight = Math.min(maxImgHeightPerPage, remainingHeight)

          // 캔버스에서 해당 부분 추출
          const pageCanvas = document.createElement('canvas')
          const pageCtx = pageCanvas.getContext('2d')

          pageCanvas.width = canvas.width
          pageCanvas.height = chunkHeight

          pageCtx?.drawImage(
            canvas,
            0,
            imgPos,
            canvas.width,
            chunkHeight,
            0,
            0,
            canvas.width,
            chunkHeight
          )

          // PNG 대신 JPEG 사용 및 약간의 압축으로 용량 대폭 감소
          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.9)
          const pageImgHeight = (chunkHeight * imgWidth) / canvas.width

          pdf.addImage(pageImgData, 'JPEG', 10, yPos, imgWidth, pageImgHeight)

          imgPos += chunkHeight
          if (imgPos < canvas.height) {
            pdf.addPage()
            yPos = 10
          }
        }

        // ✅ 올바른 해결책: Form Submit으로 API 호출
        // blob: URL에서는 Content-Disposition 헤더가 작동하지 않으므로
        // 브라우저의 form submit을 사용하여 API 응답의 헤더를 인식하도록 함
        console.log('[PDF 다운로드] Form submit 방식으로 API 호출')

        // PDF를 data URI로 변환
        const pdfDataUri = pdf.output('datauristring')

        // Form 요소 생성
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = `/api/invoice/${shareId || 'local'}/pdf`

        // Form 필드 추가
        const baseInput = document.createElement('input')
        baseInput.type = 'hidden'
        baseInput.name = 'pdfBase64'
        baseInput.value = pdfDataUri
        form.appendChild(baseInput)

        const filenameInput = document.createElement('input')
        filenameInput.type = 'hidden'
        filenameInput.name = 'pdfFileName'
        filenameInput.value = pdfFileName
        form.appendChild(filenameInput)

        // Form submit (브라우저가 Content-Disposition 헤더를 읽음)
        document.body.appendChild(form)
        form.submit()
        document.body.removeChild(form)

        console.log('[PDF 다운로드] Form submit 완료')
        toast.success('PDF 다운로드가 완료되었습니다')
      } finally {
        // Dark 클래스 복원
        if (hadDarkClass) htmlElement.classList.add('dark')
      }
    } catch (error) {
      toast.error('PDF 다운로드에 실패했습니다')
      console.error('[PDF 다운로드] 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [pdfFileName, shareId])

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
