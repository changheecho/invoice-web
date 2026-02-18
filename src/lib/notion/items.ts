/**
 * Notion Items 데이터베이스 조회 유틸리티
 *
 * 견적서의 각 Item(라인 아이템)을 Notion Items DB에서 조회합니다.
 * transformToInvoice 함수와 함께 사용되어 완전한 Invoice 데이터를 구성합니다.
 */

import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import type { InvoiceItem } from '@/types'
import { notionClient } from './client'

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
 * Notion Items DB 필드명:
 * - Title / 항목명: Item 이름
 * - Unit Price / 단가: 개당 가격 (number 타입)
 * - Quantity / 수량: 수량 (number 타입)
 * - Subtotal / 금액: 소계 (formula 타입, 읽기 전용)
 *
 * @param itemIds - Notion Item 페이지 ID 배열
 * @returns InvoiceItem 배열 (조회 불가능하면 빈 배열)
 */
export async function getInvoiceItems(itemIds: string[]): Promise<InvoiceItem[]> {
  if (!itemIds || itemIds.length === 0) {
    return []
  }

  try {
    // 병렬로 모든 Item 페이지 조회 (성능 최적화)
    const itemPages = await Promise.all(
      itemIds.map((id) =>
        notionClient.pages.retrieve({ page_id: id }).catch(() => null)
      )
    )

    // 조회 성공한 페이지만 필터링 및 변환
    const items: InvoiceItem[] = itemPages
      .filter((page): page is PageObjectResponse => {
        return page !== null && typeof page === 'object' && 'properties' in page
      })
      .map((page) => {
        const props = page.properties

        return {
          // 항목명 - Title 또는 한글 폴백
          name: extractText(props['Title'] || props['항목명']),
          // 수량 - Quantity 또는 한글 폴백
          quantity: extractNumber(props['Quantity'] || props['수량']),
          // 단가 - Unit Price 또는 한글 폴백
          unitPrice: extractNumber(props['Unit Price'] || props['단가']),
          // 소계 - Subtotal 또는 한글 폴백 (formula 읽기 전용)
          subtotal: extractNumber(props['Subtotal'] || props['금액']),
        }
      })

    return items
  } catch (error) {
    console.error('[Items] Item 페이지 조회 실패:', error)
    // 에러 시 빈 배열 반환 (부분 실패 용인)
    return []
  }
}
