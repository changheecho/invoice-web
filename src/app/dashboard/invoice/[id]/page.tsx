/**
 * 관리자용 견적서 상세 페이지
 *
 * Notion에서 특정 견적서 데이터를 조회하여 상세 내용을 표시합니다.
 * PDF 다운로드 및 공유 링크 복사 기능을 제공합니다.
 *
 * @param params.id - Notion 페이지 ID (URL 파라미터)
 *
 * @protected 이 페이지는 미들웨어(middleware.ts)에 의해 보호됩니다.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notionClient } from '@/lib/notion/client'
import { transformToInvoice } from '@/lib/notion/transform'
import { ROUTES } from '@/lib/constants'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

/**
 * 동적 메타데이터 생성
 * 견적서 제목을 페이지 타이틀에 반영합니다.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params

  try {
    const page = await notionClient.pages.retrieve({ page_id: id })
    if ('properties' in page) {
      const invoice = transformToInvoice(page as PageObjectResponse)
      return {
        title: `${invoice.title} | Invoice Web`,
      }
    }
  } catch {
    // 메타데이터 생성 실패는 무시
  }

  return { title: '견적서 상세 | Invoice Web' }
}

/**
 * 관리자용 견적서 상세 페이지 컴포넌트
 */
export default async function DashboardInvoicePage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Notion에서 견적서 데이터 조회
  let invoice
  try {
    const page = await notionClient.pages.retrieve({ page_id: id })

    if (!('properties' in page)) {
      notFound()
    }

    invoice = transformToInvoice(page as PageObjectResponse)
  } catch {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 뒤로 가기 */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.DASHBOARD}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            대시보드로 돌아가기
          </Link>
        </Button>
      </div>

      {/* 견적서 헤더 */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{invoice.title}</h1>
          <p className="text-muted-foreground mt-1">{invoice.clientName}</p>
        </div>
        {/* 액션 버튼 (TODO: 클라이언트 컴포넌트로 분리) */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            링크 복사
          </Button>
          <Button size="sm" disabled>
            PDF 다운로드
          </Button>
        </div>
      </div>

      {/* 견적서 상세 내용 */}
      <div className="rounded-lg border bg-card p-6">
        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="text-muted-foreground">견적 일자</span>
            <p className="font-medium mt-1">{invoice.invoiceDate}</p>
          </div>
          {invoice.dueDate && (
            <div>
              <span className="text-muted-foreground">만료일</span>
              <p className="font-medium mt-1">{invoice.dueDate}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">상태</span>
            <p className="font-medium mt-1">{invoice.status}</p>
          </div>
          <div>
            <span className="text-muted-foreground">총 금액</span>
            <p className="font-medium mt-1">
              {new Intl.NumberFormat('ko-KR', {
                style: 'currency',
                currency: 'KRW',
              }).format(invoice.totalAmount)}
            </p>
          </div>
        </div>

        {/* 항목 테이블 */}
        {invoice.items.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">견적 항목</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">항목명</th>
                  <th className="text-right py-2">수량</th>
                  <th className="text-right py-2">단가</th>
                  <th className="text-right py-2">소계</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{item.name}</td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">
                      {new Intl.NumberFormat('ko-KR', {
                        style: 'currency',
                        currency: 'KRW',
                      }).format(item.unitPrice)}
                    </td>
                    <td className="text-right py-2">
                      {new Intl.NumberFormat('ko-KR', {
                        style: 'currency',
                        currency: 'KRW',
                      }).format(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 메모 */}
      {invoice.notes && (
        <div className="mt-4 rounded-lg border bg-muted/50 p-4 text-sm">
          <p className="text-muted-foreground font-medium mb-1">메모</p>
          <p>{invoice.notes}</p>
        </div>
      )}
    </div>
  )
}
