/**
 * API Route: GET /api/notion/invoice/[id]
 *
 * Notion에서 특정 견적서의 상세 데이터를 조회합니다.
 * Items Relation을 따라 실제 라인 아이템 데이터도 함께 조회합니다.
 * 관리자용 견적서 상세 페이지 및 공개 견적서 페이지에서 사용됩니다.
 *
 * @param params.id - Notion 페이지 ID
 *
 * @security 이 엔드포인트는 서버에서 NOTION_API_KEY를 사용합니다.
 */
import { NextResponse } from 'next/server'
import { transformToInvoice, extractItemIds } from '@/lib/notion/transform'
import { getInvoiceItems } from '@/lib/notion/items'
import { NOTION_API_KEY } from '@/lib/env'
import { createServerClient } from '@/lib/supabase/server'
import type { Invoice, ApiResponse } from '@/types'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

/**
 * 견적서 상세 조회 핸들러
 *
 * @param request - Next.js 요청 객체
 * @param params.id - Notion 페이지 ID (URL 파라미터)
 * @returns 200 - Invoice 상세 데이터
 * @returns 404 - 견적서를 찾을 수 없는 경우
 * @returns 500 - Notion API 오류
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: '견적서 ID가 필요합니다.' },
      { status: 400 }
    )
  }

  // 관리자 인증 검증
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: '인증이 필요합니다.' },
      { status: 401 }
    )
  }

  try {
    // Notion 페이지 상세 조회 (fetch 사용)
    const response = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
      },
    })

    if (!response.ok) {
      throw new Error(`Notion API 오류: ${response.status}`)
    }

    const page = await response.json() as PageObjectResponse

    // 프로퍼티가 없는 응답 타입 처리
    if (!('properties' in page)) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '유효하지 않은 견적서입니다.' },
        { status: 404 }
      )
    }

    // Invoice 타입으로 변환 (이 시점에서는 items가 빈 배열)
    let invoice: Invoice = transformToInvoice(page)

    // Items Relation ID 추출 및 실제 Items 조회
    const itemIds = extractItemIds(page)
    if (itemIds.length > 0) {
      const items = await getInvoiceItems(itemIds)
      invoice = { ...invoice, items }
    }

    return NextResponse.json<ApiResponse<Invoice>>({
      success: true,
      data: invoice,
    })
  } catch (error) {
    // Notion API 404 에러 처리
    const isNotFound =
      error instanceof Error && error.message.includes('Could not find')

    if (isNotFound) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '견적서를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.error(`[API] /api/notion/invoice/${id} 오류:`, error)

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Notion 데이터 조회 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
