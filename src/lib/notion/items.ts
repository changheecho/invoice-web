/**
 * Notion Items 데이터베이스 조회 유틸리티
 *
 * 견적서의 각 Item(라인 아이템)을 Notion Items DB에서 조회합니다.
 * transformToInvoice 함수와 함께 사용되어 완전한 Invoice 데이터를 구성합니다.
 */

import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import type { InvoiceItem } from '@/types'
import { NOTION_API_KEY, NOTION_ITEMS_DATABASE_ID } from '@/lib/env'

/**
 * Notion 페이지에서 텍스트를 추출합니다 (items.ts 내부용).
 */
function extractText(property: PageObjectResponse['properties'][string]): string {
  if (!property) return ''

  // title 타입
  if (property.type === 'title') {
    return property.title.map((t) => t.plain_text).join('') || ''
  }

  // rich_text 타입
  if (property.type === 'rich_text') {
    return property.rich_text.map((t) => t.plain_text).join('') || ''
  }

  return ''
}

/**
 * Notion 프로퍼티에서 숫자를 추출합니다.
 */
function extractNumber(property: PageObjectResponse['properties'][string]): number {
  if (!property || property.type !== 'number') return 0
  return property.number || 0
}

/**
 * Items Relation ID 배열에서 실제 Item 데이터를 조회합니다.
 *
 * itemIds가 비어있으면 Items DB를 역방향 쿼리합니다.
 * (Relation 필드가 API에서 비어있는 문제 해결)
 *
 * Notion Items DB 필드명:
 * - Title / 항목명: Item 이름
 * - Unit Price / 단가: 개당 가격 (number 타입)
 * - Quantity / 수량: 수량 (number 타입)
 * - Subtotal / 금액: 소계 (formula 타입, 읽기 전용)
 * - Invoices / 청구서: Invoices DB Relation (역방향 쿼리용)
 *
 * @param itemIds - Notion Item 페이지 ID 배열
 * @param invoiceId - 견적서 ID (역방향 쿼리용)
 * @returns InvoiceItem 배열 (조회 불가능하면 빈 배열)
 */
export async function getInvoiceItems(
  itemIds: string[],
  invoiceId?: string
): Promise<InvoiceItem[]> {
  // 1단계: itemIds로 직접 조회 시도
  if (itemIds && itemIds.length > 0) {
    console.log('[Items] 직접 조회 모드 (itemIds):', itemIds.length)
    return await getItemsByIds(itemIds)
  }

  // 2단계: itemIds가 비어있으면 역방향 쿼리
  if (invoiceId) {
    console.log('[Items] 역방향 쿼리 모드 (invoiceId):', invoiceId)
    return await getItemsByInvoiceId(invoiceId)
  }

  return []
}

/**
 * Item ID 배열로 직접 조회합니다.
 */
async function getItemsByIds(itemIds: string[]): Promise<InvoiceItem[]> {
  if (!itemIds || itemIds.length === 0) {
    return []
  }

  try {
    // 병렬로 모든 Item 페이지 조회 (fetch 사용, 성능 최적화)
    const itemPages = await Promise.all(
      itemIds.map(async (id) => {
        try {
          const response = await fetch(`https://api.notion.com/v1/pages/${id}`, {
            headers: {
              'Authorization': `Bearer ${NOTION_API_KEY}`,
              'Notion-Version': '2022-06-28',
            },
          })

          if (!response.ok) {
            console.warn(`[Items] Item 페이지 ${id} 조회 실패: ${response.status}`)
            return null
          }

          return (await response.json()) as PageObjectResponse
        } catch (error) {
          console.warn(`[Items] Item 페이지 ${id} 조회 오류:`, error)
          return null
        }
      })
    )

    return transformItemPages(itemPages)
  } catch (error) {
    console.error('[Items] Item 페이지 조회 실패:', error)
    // 에러 시 빈 배열 반환 (부분 실패 용인)
    return []
  }
}

/**
 * 견적서 ID로 Items DB를 역방향 쿼리합니다.
 * (Relation 필드가 API에서 비어있는 문제 해결)
 */
async function getItemsByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
  try {
    console.log('[Items] Items DB 역방향 쿼리:', { invoiceId, itemsDbId: NOTION_ITEMS_DATABASE_ID })

    // Items DB를 쿼리하며 Invoices Relation 필터로 현재 견적서 찾기
    const response = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_ITEMS_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            property: 'Invoices',
            relation: {
              contains: invoiceId,
            },
          },
          sorts: [
            {
              property: '수량',
              direction: 'ascending',
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      console.error('[Items] 역방향 쿼리 실패:', response.status)
      return []
    }

    const data = await response.json()
    const itemPages = data.results.filter(
      (page: unknown): page is PageObjectResponse =>
        typeof page === 'object' && page !== null && 'properties' in page
    )

    console.log('[Items] 역방향 쿼리 결과:', itemPages.length, '개')
    return transformItemPages(itemPages)
  } catch (error) {
    console.error('[Items] 역방향 쿼리 오류:', error)
    return []
  }
}

/**
 * Notion 페이지 배열을 InvoiceItem으로 변환합니다.
 */
function transformItemPages(itemPages: (PageObjectResponse | null)[]): InvoiceItem[] {
  // 조회 성공한 페이지만 필터링 및 변환
  const items: InvoiceItem[] = itemPages
    .filter((page): page is PageObjectResponse => {
      return page !== null && typeof page === 'object' && 'properties' in page
    })
    .map((page) => {
      const props = page.properties

      // Debug: 실제 필드명 및 조회된 데이터 출력
      console.log('[Items] 페이지 필드명:', Object.keys(props))
      console.log('[Items] 항목명:', extractText(props['항목명'] || props['Title']))
      console.log('[Items] 수량:', extractNumber(props['수량'] || props['Quantity']))
      console.log('[Items] 단가:', extractNumber(props['단가'] || props['Unit Price']))
      console.log('[Items] 금액:', extractNumber(props['금액'] || props['Subtotal']))

      return {
        // 항목명 - 한글 먼저, 영문 폴백
        name: extractText(props['항목명'] || props['Title']),
        // 수량 - 한글 먼저, 영문 폴백
        quantity: extractNumber(props['수량'] || props['Quantity']),
        // 단가 - 한글 먼저, 영문 폴백
        unitPrice: extractNumber(props['단가'] || props['Unit Price']),
        // 금액 - 한글 먼저, 영문 폴백 (formula 읽기 전용)
        subtotal: extractNumber(props['금액'] || props['Subtotal']),
      }
    })

  return items
}
