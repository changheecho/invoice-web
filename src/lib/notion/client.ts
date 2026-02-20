/**
 * Notion API 클라이언트 설정
 *
 * @notionhq/client를 사용하여 Notion API와 통신합니다.
 * 이 파일은 서버 사이드에서만 사용해야 합니다 (NOTION_API_KEY 보호).
 *
 * @security NOTION_API_KEY는 절대 클라이언트에 노출되어서는 안 됩니다.
 */
import { Client } from '@notionhq/client'
import { NOTION_API_KEY } from '@/lib/env'

/**
 * 싱글턴 Notion 클라이언트 인스턴스
 * 서버 사이드 코드에서만 import하여 사용하세요.
 *
 * @example
 * import { notionClient } from '@/lib/notion/client'
 *
 * const response = await notionClient.databases.query({ database_id: '...' })
 */
export const notionClient = new Client({
  auth: NOTION_API_KEY,
  notionVersion: '2022-06-28',
})
