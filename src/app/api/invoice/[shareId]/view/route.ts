/**
 * API Route: POST /api/invoice/[shareId]/view (Post-MVP Phase 2)
 *
 * 공개 견적서 페이지 조회 시 조회 기록을 저장합니다.
 * 인증 불필요, 실패해도 페이지 렌더링에 영향 없음
 *
 * @param params.shareId - 공유 링크 ID (URL 파라미터)
 * @returns 200 {success: true} - 조회 기록 저장 성공
 * @returns 400 - shareId 누락/invalid
 * @returns 500 - 서버 오류
 *
 * @public 인증 불필요
 */

import { NextResponse } from 'next/server'
import { getOrCreateInvoiceView } from '@/lib/supabase/invoice-views'
import type { ApiResponse } from '@/types'

/**
 * 조회 기록 저장 핸들러
 *
 * @param request - POST 요청 객체
 * @param params - URL 파라미터 (shareId)
 * @returns 200 또는 에러 응답
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params

    // shareId 검증
    if (!shareId || typeof shareId !== 'string') {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'shareId가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 요청자 정보 수집 (선택)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const viewerIp = process.env.COLLECT_VIEWER_IP === 'true' ? forwardedFor || undefined : undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // 조회 기록 저장
    await getOrCreateInvoiceView(shareId, viewerIp, userAgent)

    console.log('[API] 조회 기록 저장:', {
      shareId,
      hasIp: !!viewerIp,
      hasUserAgent: !!userAgent,
    })

    return NextResponse.json<ApiResponse<{ success: boolean }>>({
      success: true,
      data: { success: true },
    })
  } catch (error) {
    console.error('[API] /api/invoice/[shareId]/view 오류:', error)

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: '조회 기록 저장 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
