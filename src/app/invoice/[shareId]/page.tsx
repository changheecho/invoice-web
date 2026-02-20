/**
 * 클라이언트용 공개 견적서 페이지
 *
 * 공유 링크(shareId)로 접근하는 비로그인 공개 페이지입니다.
 * shareId → notionPageId 매핑을 Supabase에서 조회한 후,
 * Notion API에서 견적서 데이터를 가져와 InvoiceViewer로 렌더링합니다.
 *
 * @param params.shareId - 공개 공유 링크 ID (URL 파라미터)
 *
 * @public 인증 불필요. 유효하지 않은 shareId는 404 처리됩니다.
 */
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getShareLinkByShareId } from '@/lib/supabase/share-links'
import { notionClient } from '@/lib/notion/client'
import { transformToInvoice, extractItemIds } from '@/lib/notion/transform'
import { getInvoiceItems } from '@/lib/notion/items'
import { buildPdfFilename } from '@/lib/constants'
import { InvoiceViewer } from '@/components/invoice/InvoiceViewer'
import { InvoiceActionsWrapper } from '@/components/invoice/InvoiceActionsWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

/**
 * 동적 메타데이터 생성
 * 견적서 제목 및 클라이언트명을 페이지 타이틀에 반영합니다.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ shareId: string }> }
): Promise<Metadata> {
  const { shareId } = await params

  try {
    const shareLink = await getShareLinkByShareId(shareId)
    if (!shareLink) return { title: '견적서 | Invoice Web' }

    const page = await notionClient.pages.retrieve({
      page_id: shareLink.notionPageId,
    })

    if ('properties' in page) {
      const invoice = transformToInvoice(page as PageObjectResponse)
      return {
        title: `${invoice.title} - ${invoice.clientName} | Invoice Web`,
        description: `견적 일자: ${invoice.invoiceDate}`,
      }
    }
  } catch {
    // 메타데이터 생성 실패는 무시
  }

  return { title: '견적서 | Invoice Web' }
}

// ============================================================
// 로딩 스켈레톤 (InvoiceViewer 형태에 맞춘 플레이스홀더)
// ============================================================

/**
 * 견적서 뷰어 로딩 스켈레톤
 * InvoiceViewer가 로딩될 때 동일한 레이아웃 구조로 표시됩니다.
 */
function InvoiceViewerSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="견적서 로딩 중"
      className="w-full bg-white dark:bg-slate-950 border border-border rounded-xl shadow-sm overflow-hidden"
    >
      {/* 헤더 스켈레톤 */}
      <div className="flex items-start justify-between gap-4 px-6 py-8 sm:px-10 border-b border-border">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* 발신/수신 스켈레톤 */}
      <div className="px-6 py-8 sm:px-10 flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>

        {/* 구분선 */}
        <Skeleton className="h-px w-full" />

        {/* 메타 정보 스켈레톤 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg bg-muted/40 px-5 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        {/* 테이블 스켈레톤 */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="bg-muted/40 px-4 py-3">
            <div className="grid grid-cols-4 gap-4">
              {['항목명', '수량', '단가', '소계'].map((col) => (
                <Skeleton key={col} className="h-3 w-12" />
              ))}
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 border-t border-border">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-8 ml-auto" />
              <Skeleton className="h-4 w-20 ml-auto" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          ))}
        </div>

        {/* 총 금액 스켈레톤 */}
        <div className="flex justify-end">
          <div className="flex flex-col gap-2 min-w-[240px]">
            <Skeleton className="h-px w-full" />
            <div className="flex justify-between pt-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-6 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 스켈레톤 */}
      <div className="flex justify-between items-center px-6 py-5 sm:px-10 border-t border-border bg-muted/20">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  )
}

// ============================================================
// 메인 페이지 컴포넌트
// ============================================================

/**
 * 클라이언트용 공개 견적서 페이지 컴포넌트
 *
 * 구성:
 * - Suspense 경계: 로딩 스켈레톤 표시
 * - InvoiceViewer: 전문 인보이스 레이아웃
 * - InvoiceActionsWrapper: PDF 다운로드 버튼 (공유 버튼 없음)
 * - 하단 안내 문구
 */
export default async function PublicInvoicePage(
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params

  // 1단계: shareId → ShareLink 조회
  const shareLink = await getShareLinkByShareId(shareId).catch(() => null)

  if (!shareLink) {
    notFound()
  }

  // 2단계: Notion에서 견적서 상세 데이터 조회
  let invoice
  try {
    const page = await notionClient.pages.retrieve({
      page_id: shareLink.notionPageId,
    })

    if (!('properties' in page)) {
      notFound()
    }

    invoice = transformToInvoice(page as PageObjectResponse)

    // Items Relation ID 추출 및 실제 Items 조회
    const itemIds = extractItemIds(page as PageObjectResponse)
    if (itemIds.length > 0) {
      const items = await getInvoiceItems(itemIds)
      invoice = { ...invoice, items }
    }
  } catch {
    notFound()
  }

  // PDF 파일명 생성
  const pdfFileName = buildPdfFilename(invoice.clientName, invoice.invoiceDate)

  // 공개 페이지 URL (공유 버튼용 - 이 페이지에서는 사용 안 함)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const shareUrl = `${appUrl}/invoice/${shareId}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 max-w-4xl py-8 sm:py-12">

        {/* 견적서 뷰어 (Suspense 경계) */}
        <Suspense fallback={<InvoiceViewerSkeleton />}>
          <InvoiceViewer
            invoice={invoice}
            showActions={true}
            actionsSlot={
              <InvoiceActionsWrapper
                invoiceId={invoice.id}
                shareId={shareId}
                showPdfButton={true}
                showShareButton={false}
                pdfFileName={pdfFileName}
                shareUrl={shareUrl}
              />
            }
          />
        </Suspense>

        {/* 하단 안내 문구 */}
        <p
          className="text-center text-xs text-muted-foreground mt-6"
          aria-label="견적서 생성 안내"
        >
          본 견적서는 Invoice Web을 통해 공유되었습니다.
        </p>
      </div>
    </div>
  )
}
