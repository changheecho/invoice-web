/**
 * Supabase ShareLink 테이블 CRUD 헬퍼
 *
 * 공유 링크 생성, 조회 관련 데이터베이스 작업을 캡슐화합니다.
 * 서버 사이드 (Route Handler, Server Action)에서만 사용해야 합니다.
 *
 * ShareLink 테이블 DDL (Supabase SQL Editor에서 실행):
 * @see /docs/supabase-schema.sql
 */
import { nanoid } from 'nanoid'
import { createServerClient } from '@/lib/supabase/server'
import type { ShareLink } from '@/types'

/**
 * Notion 페이지 ID로 기존 공유 링크를 조회하거나,
 * 없으면 새 공유 링크를 생성하여 반환합니다.
 *
 * @param notionPageId - Notion 페이지 ID
 * @returns 생성되거나 조회된 ShareLink 객체
 * @throws Supabase 쿼리 에러 발생 시 예외 throw
 *
 * @example
 * const shareLink = await getOrCreateShareLink('notion-page-id-123')
 * // shareLink.shareId → 'abc123xyz'
 */
export async function getOrCreateShareLink(
  notionPageId: string
): Promise<ShareLink> {
  const supabase = await createServerClient()

  // 기존 공유 링크 조회
  const { data: existing, error: selectError } = await supabase
    .from('share_links')
    .select('*')
    .eq('notion_page_id', notionPageId)
    .single()

  // 조회 에러 처리 (PGRST116: 결과 없음은 정상)
  if (selectError && selectError.code !== 'PGRST116') {
    throw new Error(`ShareLink 조회 실패: ${selectError.message}`)
  }

  // 기존 링크가 있으면 반환
  if (existing) {
    return mapShareLink(existing)
  }

  // 새 공유 링크 생성 (nanoid로 고유 ID 생성)
  const shareId = nanoid(12) // 12자리 URL-safe 고유 ID

  const { data: created, error: insertError } = await supabase
    .from('share_links')
    .insert({
      notion_page_id: notionPageId,
      share_id: shareId,
    })
    .select('*')
    .single()

  if (insertError || !created) {
    throw new Error(`ShareLink 생성 실패: ${insertError?.message}`)
  }

  return mapShareLink(created)
}

/**
 * shareId로 ShareLink 레코드를 조회합니다.
 * 공개 견적서 페이지 접근 시 Notion 페이지 ID를 알아내는 데 사용합니다.
 *
 * @param shareId - URL에 포함된 공유 ID
 * @returns ShareLink 객체 (없으면 null)
 * @throws Supabase 쿼리 에러 발생 시 예외 throw
 *
 * @example
 * const shareLink = await getShareLinkByShareId('abc123xyz')
 * if (!shareLink) { // 404 처리 }
 */
export async function getShareLinkByShareId(
  shareId: string
): Promise<ShareLink | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('share_id', shareId)
    .single()

  // 결과 없음 (PGRST116)은 null 반환
  if (error?.code === 'PGRST116') return null

  if (error) {
    throw new Error(`ShareLink 조회 실패: ${error.message}`)
  }

  return data ? mapShareLink(data) : null
}

/**
 * Supabase 스네이크_케이스 레코드를 ShareLink 카멜케이스 타입으로 변환합니다.
 *
 * @param record - Supabase DB 레코드 (스네이크_케이스)
 * @returns ShareLink 타입 객체 (카멜케이스)
 */
function mapShareLink(record: Record<string, unknown>): ShareLink {
  return {
    id: String(record['id']),
    notionPageId: String(record['notion_page_id']),
    shareId: String(record['share_id']),
    createdAt: String(record['created_at']),
  }
}
