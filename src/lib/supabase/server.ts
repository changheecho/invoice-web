/**
 * Supabase 서버 클라이언트
 *
 * Server Components, Route Handlers, Server Actions에서 사용합니다.
 * @supabase/ssr의 createServerClient를 사용하여 쿠키 기반 세션 관리를 처리합니다.
 *
 * @example
 * // 서버 컴포넌트 또는 API Route에서 사용
 * import { createServerClient } from '@/lib/supabase/server'
 *
 * const supabase = await createServerClient()
 * const { data: { user } } = await supabase.auth.getUser()
 */
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

/**
 * Supabase 서버 클라이언트 인스턴스를 생성하여 반환합니다.
 * Next.js 쿠키 스토어와 연동하여 세션을 유지합니다.
 *
 * @returns Supabase SupabaseClient 인스턴스 (Promise)
 */
export async function createServerClient() {
  // Next.js 쿠키 스토어 가져오기
  const cookieStore = await cookies()

  return createSupabaseServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      /**
       * 쿠키 목록 조회 핸들러
       */
      getAll() {
        return cookieStore.getAll()
      },
      /**
       * 쿠키 일괄 저장 핸들러
       * Route Handler 에서는 정상 동작하나,
       * Server Component에서는 읽기 전용으로 에러가 발생할 수 있습니다.
       */
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Component에서 호출 시 에러 무시
          // 미들웨어에서 세션을 갱신하므로 안전합니다.
        }
      },
    },
  })
}
