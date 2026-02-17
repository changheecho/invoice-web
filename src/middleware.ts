/**
 * Next.js 미들웨어 - 인증 및 라우트 보호
 *
 * Supabase Auth 세션을 검증하여 보호된 경로(/dashboard/*)에 대한
 * 인증되지 않은 접근을 로그인 페이지로 리디렉션합니다.
 *
 * 처리 흐름:
 * 1. 요청마다 Supabase 세션 쿠키 갱신
 * 2. 보호된 경로 접근 시 인증 여부 확인
 * 3. 미인증 상태면 /login으로 리디렉션
 * 4. 로그인 상태에서 /login 접근 시 /dashboard로 리디렉션
 *
 * @reference https://supabase.com/docs/guides/auth/server-side/nextjs
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'
import { ROUTES } from '@/lib/constants'

/**
 * 미들웨어 메인 함수
 * 모든 매칭된 요청에서 실행됩니다.
 *
 * @param request - Next.js 요청 객체
 * @returns NextResponse (리디렉션 또는 다음 미들웨어/핸들러로 전달)
 */
export async function middleware(request: NextRequest) {
  // Supabase 환경 변수 미설정 시 인증 없이 통과 (개발 편의)
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  // 미들웨어 내 Supabase 클라이언트 생성 (쿠키 갱신용)
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // 요청 쿠키 업데이트
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        // 응답 쿠키 업데이트
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  // 세션 정보 조회 (쿠키 갱신도 함께 수행)
  // getUser()는 getSession()보다 안전합니다 (서버에서 토큰 검증)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 보호된 경로: /dashboard/* 접근 시 인증 확인
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      // 미인증 상태 → 로그인 페이지로 리디렉션
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = ROUTES.LOGIN
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 로그인 페이지: 이미 로그인된 상태면 대시보드로 리디렉션
  if (pathname === ROUTES.LOGIN && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = ROUTES.DASHBOARD
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

/**
 * 미들웨어가 실행될 경로 패턴 설정
 * 보호된 경로(/dashboard/*)와 로그인 페이지(/login)만 처리합니다.
 */
export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
