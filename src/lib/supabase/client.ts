/**
 * Supabase 브라우저(클라이언트) 클라이언트
 *
 * 클라이언트 컴포넌트에서 Supabase와 상호작용할 때 사용합니다.
 * @supabase/ssr의 createBrowserClient를 사용하여 Next.js App Router와
 * 쿠키 기반 세션 관리가 호환되도록 설정합니다.
 *
 * @example
 * // 클라이언트 컴포넌트 내에서 사용
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * const supabase = createClient()
 * const { data, error } = await supabase.auth.signInWithPassword({ email, password })
 */
import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

/**
 * Supabase 브라우저 클라이언트 인스턴스를 생성하여 반환합니다.
 * 매 호출 시 새 인스턴스를 반환하므로, 컴포넌트 레벨에서 호출하세요.
 *
 * @returns Supabase SupabaseClient 인스턴스
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
