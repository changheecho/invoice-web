/**
 * API Route: POST /api/share-links
 *
 * Notion 페이지에 대한 공유 링크를 생성합니다.
 * 기존 링크가 있으면 재사용하고, 없으면 새로 생성합니다.
 *
 * @protected 이 엔드포인트는 인증된 관리자만 접근 가능합니다.
 *
 * @body {string} notionPageId - Notion 페이지 ID
 * @returns {shareId, shareUrl} - 생성된 공유 링크 ID와 URL
 */
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getOrCreateShareLink } from '@/lib/supabase/share-links'
import type { ApiResponse } from '@/types'

/**
 * 공유 링크 생성 요청 타입
 */
interface CreateShareLinkRequest {
  notionPageId: string
}

/**
 * 공유 링크 생성 응답 타입
 */
interface CreateShareLinkResponse {
  shareId: string
  shareUrl: string
}

/**
 * 공유 링크 생성 핸들러
 *
 * @param request - POST 요청 객체
 * @returns 200 - 생성된 shareId와 shareUrl
 * @returns 400 - 요청 데이터 오류
 * @returns 401 - 미인증 사용자
 * @returns 500 - 서버 오류
 */
export async function POST(request: Request) {
  try {
    // 인증 검증
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 요청 데이터 파싱
    let body: CreateShareLinkRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '요청 데이터가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // notionPageId 검증
    if (!body.notionPageId || typeof body.notionPageId !== 'string') {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'notionPageId는 필수입니다.' },
        { status: 400 }
      )
    }

    // 공유 링크 생성 또는 조회
    const shareLink = await getOrCreateShareLink(body.notionPageId)

    // 공유 URL 구성
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${appUrl}/invoice/${shareLink.shareId}`

    return NextResponse.json<ApiResponse<CreateShareLinkResponse>>({
      success: true,
      data: {
        shareId: shareLink.shareId,
        shareUrl,
      },
    })
  } catch (error) {
    console.error('[API] /api/share-links 오류:', error)

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: '공유 링크 생성 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
