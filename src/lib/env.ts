/**
 * 환경 변수 중앙 관리 파일
 *
 * 모든 환경 변수를 한 곳에서 관리하여 타입 안정성 및 기본값 제공합니다.
 * 서버 전용 환경 변수는 클라이언트 코드에서 임포트하지 않도록 주의하세요.
 *
 * @example
 * import { SUPABASE_URL, NOTION_API_KEY } from '@/lib/env'
 */

// ============================================================
// 앱 설정
// ============================================================

/**
 * 앱 공개 URL (배포 도메인)
 * @env NEXT_PUBLIC_APP_URL
 * @default 'http://localhost:3000' (개발 환경)
 */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ============================================================
// Supabase 설정
// ============================================================

/**
 * Supabase 프로젝트 URL (클라이언트 공개)
 * @env NEXT_PUBLIC_SUPABASE_URL
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

/**
 * Supabase Anonymous Key (클라이언트 공개)
 * @env NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Supabase Service Role Key (서버 전용 - 절대 클라이언트에 노출 금지)
 * @env SUPABASE_SERVICE_ROLE_KEY
 * @security 이 값은 서버 사이드 코드에서만 사용해야 합니다.
 */
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// ============================================================
// Notion 설정
// ============================================================

/**
 * Notion API 통합 시크릿 키 (서버 전용)
 * @env NOTION_API_KEY
 * @security 이 값은 서버 사이드 코드에서만 사용해야 합니다.
 */
export const NOTION_API_KEY = process.env.NOTION_API_KEY || ''

/**
 * Notion 견적서 데이터베이스 ID (서버 전용)
 * @env NOTION_DATABASE_ID
 * @security 이 값은 서버 사이드 코드에서만 사용해야 합니다.
 */
export const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || ''

/**
 * Notion Items(라인 아이템) 데이터베이스 ID (서버 전용)
 * @env NOTION_ITEMS_DATABASE_ID
 * @security 이 값은 서버 사이드 코드에서만 사용해야 합니다.
 */
export const NOTION_ITEMS_DATABASE_ID = process.env.NOTION_ITEMS_DATABASE_ID || ''

// ============================================================
// 환경 변수 유효성 검사 유틸리티
// ============================================================

/**
 * 서버 시작 시 필수 환경 변수 존재 여부를 검사합니다.
 * 누락된 환경 변수가 있으면 에러 목록을 반환합니다.
 *
 * @returns 누락된 환경 변수 이름 배열 (모두 설정된 경우 빈 배열)
 *
 * @example
 * const missing = validateEnv()
 * if (missing.length > 0) {
 *   console.error('누락된 환경 변수:', missing)
 * }
 */
export function validateEnv(): string[] {
  // 필수 환경 변수 목록
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NOTION_API_KEY',
    'NOTION_DATABASE_ID',
    'NOTION_ITEMS_DATABASE_ID',
  ]

  // 설정되지 않은 환경 변수 필터링
  return required.filter((key) => !process.env[key])
}
