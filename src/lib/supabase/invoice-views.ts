/**
 * Supabase InvoiceView 테이블 CRUD 헬퍼 (Post-MVP Phase 2)
 *
 * 공개 견적서 페이지 조회 기록 관리
 * 서버 사이드 (Route Handler, Server Action)에서만 사용
 *
 * @see /docs/supabase-schema.sql
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { createServerClient } from '@/lib/supabase/server'
import type { InvoiceView, ViewStats } from '@/types'

/**
 * 조회 기록 저장 및 share_links 통계 업데이트
 *
 * 1. invoice_views에 조회 기록 INSERT
 * 2. share_links의 view_count 증가
 * 3. first_viewed_at/last_viewed_at 갱신
 *
 * @param shareId - 공유 링크 ID
 * @param viewerIp - 조회자 IP (선택)
 * @param userAgent - 조회자 User-Agent (선택)
 * @returns 생성된 조회 기록
 * @throws Supabase 쿼리 에러 발생 시 예외 throw
 *
 * @example
 * const view = await getOrCreateInvoiceView('abc123xyz', '192.168.1.1', 'Mozilla/5.0...')
 */
export async function getOrCreateInvoiceView(
  shareId: string,
  viewerIp?: string,
  userAgent?: string
): Promise<InvoiceView> {
  // 무기명 사용자가 RLS를 우회하여 조회 기록을 남길 수 있도록 Admin 권한 클라이언트 생성
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // 1. invoice_views에 조회 기록 추가
  const { data: view, error: insertError } = await supabaseAdmin
    .from('invoice_views')
    .insert({
      share_id: shareId,
      viewed_at: new Date().toISOString(),
      viewer_ip: viewerIp,
      user_agent: userAgent,
    })
    .select('*')
    .single()

  if (insertError || !view) {
    throw new Error(`조회 기록 저장 실패: ${insertError?.message}`)
  }

  // 2. share_links에서 현재 통계 조회
  const { data: shareLink, error: selectError } = await supabaseAdmin
    .from('share_links')
    .select('view_count, first_viewed_at, last_viewed_at')
    .eq('share_id', shareId)
    .single()

  if (selectError) {
    console.warn(`share_links 조회 실패: ${selectError.message}`)
    return mapInvoiceView(view)
  }

  // 3. share_links 통계 업데이트
  const newViewCount = (shareLink?.view_count || 0) + 1
  const firstViewedAt = shareLink?.first_viewed_at || new Date().toISOString()
  const lastViewedAt = new Date().toISOString()

  const { error: updateError } = await supabaseAdmin
    .from('share_links')
    .update({
      view_count: newViewCount,
      first_viewed_at: firstViewedAt,
      last_viewed_at: lastViewedAt,
    })
    .eq('share_id', shareId)

  if (updateError) {
    console.warn(`share_links 통계 업데이트 실패: ${updateError.message}`)
  }

  return mapInvoiceView(view)
}

/**
 * share_links에서 조회 통계 조회
 *
 * @param shareId - 공유 링크 ID
 * @returns 조회 통계 (없으면 null)
 * @throws Supabase 쿼리 에러 발생 시 예외 throw
 *
 * @example
 * const stats = await getShareLinkViewStats('abc123xyz')
 * // { viewCount: 5, firstViewedAt: '2026-02-21T...', lastViewedAt: '2026-02-21T...' }
 */
export async function getShareLinkViewStats(shareId: string): Promise<ViewStats | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('share_links')
    .select('view_count, first_viewed_at, last_viewed_at')
    .eq('share_id', shareId)
    .single()

  // 결과 없음 (PGRST116)은 null 반환
  if (error?.code === 'PGRST116') return null

  if (error) {
    throw new Error(`share_links 통계 조회 실패: ${error.message}`)
  }

  return data ? mapViewStats(data) : null
}

/**
 * Supabase 스네이크_케이스 레코드를 InvoiceView 카멜케이스 타입으로 변환
 *
 * @param record - Supabase DB 레코드 (스네이크_케이스)
 * @returns InvoiceView 타입 객체 (카멜케이스)
 */
function mapInvoiceView(record: Record<string, unknown>): InvoiceView {
  return {
    id: String(record['id']),
    shareId: String(record['share_id']),
    viewedAt: String(record['viewed_at']),
    viewerIp: record['viewer_ip'] ? String(record['viewer_ip']) : undefined,
    userAgent: record['user_agent'] ? String(record['user_agent']) : undefined,
  }
}

/**
 * share_links 레코드의 조회 통계를 ViewStats 타입으로 변환
 *
 * @param record - Supabase share_links 레코드
 * @returns ViewStats 타입 객체
 */
function mapViewStats(record: Record<string, unknown>): ViewStats {
  return {
    viewCount: Number(record['view_count']) || 0,
    firstViewedAt: record['first_viewed_at'] ? String(record['first_viewed_at']) : undefined,
    lastViewedAt: record['last_viewed_at'] ? String(record['last_viewed_at']) : undefined,
  }
}
