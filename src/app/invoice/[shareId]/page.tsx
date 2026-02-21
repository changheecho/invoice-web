/**
 * 클라이언트용 공개 견적서 페이지 (Post-MVP Phase 2 수정)
 *
 * 공유 링크(shareId)로 접근하는 비로그인 공개 페이지입니다.
 * shareId → notionPageId 매핑을 Supabase에서 조회한 후,
 * Notion API에서 견적서 데이터를 가져와 InvoiceViewer로 렌더링합니다.
 *
 * Post-MVP Phase 2: 페이지 렌더링 시 조회 기록 API 호출 추가
 *
 * @param params.shareId - 공개 공유 링크 ID (URL 파라미터)
 *
 * @public 인증 불필요. 유효하지 않은 shareId는 404 처리됩니다.
 */
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getShareLinkByShareId } from '@/lib/supabase/share-links'
import { transformToInvoice, extractItemIds } from '@/lib/notion/transform'
import { getInvoiceItems } from '@/lib/notion/items'
import { buildPdfFilename } from '@/lib/constants'
import { NOTION_API_KEY } from '@/lib/env'
import { InvoiceViewer } from '@/components/invoice/InvoiceViewer'
import { InvoiceActionsWrapper } from '@/components/invoice/InvoiceActionsWrapper'
import { InvoiceHeaderSkeleton } from '@/components/invoice/InvoiceHeaderSkeleton'
import { InvoiceItemsSkeleton } from '@/components/invoice/InvoiceItemsSkeleton'
import { InvoiceSummarySkeleton } from '@/components/invoice/InvoiceSummarySkeleton'
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

    const response = await fetch(`https://api.notion.com/v1/pages/${shareLink.notionPageId}`, {
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
      },
      // ISR 캐싱: 공개 견적서 메타데이터는 300초(5분)마다 재검증합니다.
      // 공개 페이지는 수정 빈도가 낮으므로 관리자 페이지보다 긴 캐시 시간을 적용합니다.
      next: { revalidate: 300 },
    })

    if (!response.ok) throw new Error('Notion API 오류')

    const page = await response.json() as PageObjectResponse

    if ('properties' in page) {
      const invoice = transformToInvoice(page)
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
 *
 * 세 영역별 스켈레톤 컴포넌트를 조합하여 InvoiceViewer와 동일한 레이아웃을 제공합니다:
 * - InvoiceHeaderSkeleton: 헤더 + 발신/수신 영역
 * - InvoiceItemsSkeleton: 메타 정보 + 항목 테이블 영역
 * - InvoiceSummarySkeleton: 총액 + 액션 버튼 + 푸터 영역
 *
 * 각 영역이 독립적으로 관리되어 향후 Suspense 경계를 세분화할 때 재사용 가능합니다.
 */
function InvoiceViewerSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="견적서 로딩 중"
      className="w-full bg-white dark:bg-slate-950 border border-border rounded-xl shadow-sm overflow-hidden"
    >
      {/* 헤더 + 발신/수신 정보 영역 스켈레톤 */}
      <InvoiceHeaderSkeleton />

      {/* 메타 정보 + 항목 테이블 영역 스켈레톤 */}
      <div className="pt-8 pb-0">
        <InvoiceItemsSkeleton rows={3} />
      </div>

      {/* 총액 + 액션 버튼 + 푸터 영역 스켈레톤 */}
      <div className="pb-0">
        <InvoiceSummarySkeleton showActions={true} />
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

  // 2단계: Notion에서 견적서 상세 데이터 조회 (fetch 직접 사용 - Relation 데이터 로드 보장)
  let invoice
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${shareLink.notionPageId}`, {
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
      },
      // ISR 캐싱: 공개 견적서 페이지는 300초(5분)마다 Notion 데이터를 재검증합니다.
      // 클라이언트가 접근하는 공개 페이지는 수정 빈도가 낮으므로 긴 캐시 시간을 적용합니다.
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`Notion API 오류: ${response.status}`)
    }

    const page = await response.json() as PageObjectResponse

    if (!('properties' in page)) {
      notFound()
    }

    invoice = transformToInvoice(page)

    // Items Relation ID 추출 및 실제 Items 조회
    const itemIds = extractItemIds(page)
    console.log('[공개페이지] Items ID 추출:', { shareId, itemIds, itemIdsLength: itemIds.length })

    if (itemIds.length > 0) {
      console.log('[공개페이지] Items 조회 시작...')
      const items = await getInvoiceItems(itemIds, shareLink.notionPageId)
      console.log('[공개페이지] Items 조회 완료:', { itemsCount: items.length, items })
      invoice = { ...invoice, items }
    } else {
      console.log('[공개페이지] Items ID가 없음 - 역방향 쿼리 시도...')
      const items = await getInvoiceItems([], shareLink.notionPageId)
      if (items.length > 0) {
        console.log('[공개페이지] 역방향 쿼리 성공:', { itemsCount: items.length })
        invoice = { ...invoice, items }
      }
    }
  } catch (error) {
    console.error('[공개페이지] 견적서 조회 오류:', error)
    notFound()
  }

  // PDF 파일명 생성
  const pdfFileName = buildPdfFilename(invoice.clientName, invoice.invoiceDate)

  // 공개 페이지 URL (공유 버튼용 - 이 페이지에서는 사용 안 함)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const shareUrl = `${appUrl}/invoice/${shareId}`

  // Post-MVP Phase 2: 비동기 조회 기록 저장 (페이지 렌더링에 영향 없음)
  // await하지 않음 - 병렬 처리로 성능 향상
  fetch(`${appUrl}/api/invoice/${shareId}/view`, { method: 'POST' }).catch((err) => {
    console.warn('[PublicInvoicePage] 조회 기록 저장 실패:', err)
  })

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
