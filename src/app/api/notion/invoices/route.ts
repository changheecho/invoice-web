/**
 * API Route: GET /api/notion/invoices
 *
 * Notion 데이터베이스에서 견적서 목록을 조회합니다.
 * 관리자 대시보드의 견적서 목록 테이블에 사용됩니다.
 *
 * @security 이 엔드포인트는 서버에서 NOTION_API_KEY를 사용합니다.
 *           클라이언트에 API 키가 노출되지 않습니다.
 */
import { NextResponse } from 'next/server'
import { transformToInvoiceSummary } from '@/lib/notion/transform'
import { NOTION_DATABASE_ID, validateEnv } from '@/lib/env'
import { createServerClient } from '@/lib/supabase/server'
import type { InvoiceSummary, ApiResponse } from '@/types'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

/**
 * 견적서 목록 조회 핸들러
 * Notion 데이터베이스에서 최신순으로 견적서 목록을 반환합니다.
 *
 * @returns 200 - 견적서 요약 목록 배열
 * @returns 500 - Notion API 오류 또는 환경 변수 미설정
 */
export async function GET() {
  // 필수 환경 변수 검증 (Fail-Fast 패턴)
  const missingEnv = validateEnv()
  if (missingEnv.length > 0) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: '서버 설정 오류',
        details: `누락된 환경 변수: ${missingEnv.join(', ')}`,
      },
      { status: 500 }
    )
  }

  // 환경 변수 유효성 검사
  if (!NOTION_DATABASE_ID) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: '서버 설정 오류',
        details: 'NOTION_DATABASE_ID가 설정되지 않았습니다.',
      },
      { status: 500 }
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
    // Notion API를 직접 호출 (fetch 사용)
    console.log('[API] Notion 데이터베이스 조회:', {
      NOTION_DATABASE_ID,
      apiKey: process.env.NOTION_API_KEY ? '설정됨' : '미설정',
    })

    const response = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sorts: [
            {
              property: '발행일',
              direction: 'descending',
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Notion API 오류: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as { results: unknown[] }

    // Notion 페이지 객체를 InvoiceSummary 타입으로 변환
    const invoices: InvoiceSummary[] = data.results
      .filter((page): page is PageObjectResponse => {
        return typeof page === 'object' && page !== null && 'properties' in page
      })
      .map(transformToInvoiceSummary)

    return NextResponse.json<ApiResponse<InvoiceSummary[]>>({
      success: true,
      data: invoices,
    })
  } catch (error) {
    console.error('[API] /api/notion/invoices 오류:', error)

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
