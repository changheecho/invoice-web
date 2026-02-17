/**
 * 클라이언트용 공개 견적서 페이지
 *
 * 공유 링크(shareId)로 접근하는 비로그인 공개 페이지입니다.
 * shareId → notionPageId 매핑을 Supabase에서 조회한 후,
 * Notion API에서 견적서 데이터를 가져와 렌더링합니다.
 *
 * @param params.shareId - 공개 공유 링크 ID (URL 파라미터)
 *
 * @public 인증 불필요. 유효하지 않은 shareId는 404 처리됩니다.
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getShareLinkByShareId } from '@/lib/supabase/share-links'
import { notionClient } from '@/lib/notion/client'
import { transformToInvoice } from '@/lib/notion/transform'
import { INVOICE_STATUS_LABELS, CURRENCY_FORMAT } from '@/lib/constants'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

/**
 * 동적 메타데이터 생성
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

/**
 * 클라이언트용 공개 견적서 페이지 컴포넌트
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
  } catch {
    notFound()
  }

  const statusLabel = INVOICE_STATUS_LABELS[invoice.status]
  const pdfUrl = `/api/invoice/${shareId}/pdf`

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* 견적서 카드 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-8">
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b">
            <div>
              <h1 className="text-2xl font-bold">견적서</h1>
              <p className="text-muted-foreground mt-1">{invoice.title}</p>
            </div>
            <Button asChild size="sm">
              <a href={pdfUrl} download>
                <Download className="h-4 w-4 mr-2" />
                PDF 다운로드
              </a>
            </Button>
          </div>

          {/* 기본 정보 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">수신</p>
              <p className="font-semibold text-base">{invoice.clientName}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">견적 일자</p>
              <p className="font-medium">{invoice.invoiceDate}</p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-muted-foreground mb-1">만료일</p>
                <p className="font-medium">{invoice.dueDate}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground mb-1">상태</p>
              <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium">
                {statusLabel}
              </span>
            </div>
          </div>

          {/* 항목 테이블 */}
          <div className="mb-8">
            <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
              견적 항목
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y bg-slate-50 dark:bg-slate-800/50 text-muted-foreground">
                  <th className="text-left py-3 px-3">항목명</th>
                  <th className="text-right py-3 px-3">수량</th>
                  <th className="text-right py-3 px-3">단가</th>
                  <th className="text-right py-3 px-3">소계</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-3">{item.name}</td>
                      <td className="text-right py-3 px-3">{item.quantity}</td>
                      <td className="text-right py-3 px-3">
                        {new Intl.NumberFormat('ko-KR', CURRENCY_FORMAT).format(
                          item.unitPrice
                        )}
                      </td>
                      <td className="text-right py-3 px-3">
                        {new Intl.NumberFormat('ko-KR', CURRENCY_FORMAT).format(
                          item.subtotal
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      항목 정보가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 총 금액 */}
          <div className="flex justify-end">
            <div className="min-w-48">
              <div className="flex justify-between items-center pt-3 border-t-2 font-bold text-lg">
                <span>총 금액</span>
                <span>
                  {new Intl.NumberFormat('ko-KR', CURRENCY_FORMAT).format(
                    invoice.totalAmount
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 메모 */}
          {invoice.notes && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm">
              <p className="text-muted-foreground font-medium mb-1">메모</p>
              <p className="text-slate-700 dark:text-slate-300">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* 푸터 안내 */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          본 견적서는 Invoice Web을 통해 공유되었습니다.
        </p>
      </div>
    </div>
  )
}
