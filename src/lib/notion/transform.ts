/**
 * Notion API 응답 → 앱 내부 타입 변환 유틸리티
 *
 * Notion의 복잡한 프로퍼티 구조를 Invoice, InvoiceItem 타입으로
 * 안전하게 변환합니다. 필드가 없거나 형식이 달라도 크래시 없이 처리합니다.
 *
 * Notion 데이터베이스 필드명 매핑:
 * - Title → 견적서 제목 (title 타입)
 * - Client Name → 클라이언트명 (rich_text 타입)
 * - Invoice Date → 견적 일자 (date 타입)
 * - Due Date → 만료일 (date 타입, 선택)
 * - Status → 상태 (select 타입)
 * - Total Amount → 총 금액 (number 타입)
 * - Notes → 메모 (rich_text 타입, 선택)
 */
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import type { Invoice, InvoiceItem, InvoiceStatus, InvoiceSummary } from '@/types'

/**
 * Notion 페이지 프로퍼티에서 일반 텍스트를 추출합니다.
 *
 * @param property - Notion 프로퍼티 객체
 * @returns 추출된 텍스트 문자열 (없으면 빈 문자열)
 */
function extractText(property: PageObjectResponse['properties'][string]): string {
  if (!property) return ''

  // title 타입 프로퍼티
  if (property.type === 'title') {
    return property.title.map((t) => t.plain_text).join('') || ''
  }

  // rich_text 타입 프로퍼티
  if (property.type === 'rich_text') {
    return property.rich_text.map((t) => t.plain_text).join('') || ''
  }

  return ''
}

/**
 * Notion 프로퍼티에서 날짜 문자열을 추출합니다.
 *
 * @param property - Notion date 타입 프로퍼티
 * @returns ISO 날짜 문자열 (없으면 null)
 */
function extractDate(
  property: PageObjectResponse['properties'][string]
): string | null {
  if (!property || property.type !== 'date') return null
  return property.date?.start || null
}

/**
 * Notion 프로퍼티에서 숫자를 추출합니다.
 *
 * @param property - Notion number 타입 프로퍼티
 * @returns 숫자 (없으면 0)
 */
function extractNumber(
  property: PageObjectResponse['properties'][string]
): number {
  if (!property || property.type !== 'number') return 0
  return property.number || 0
}

/**
 * Notion 프로퍼티에서 select 값을 추출합니다.
 *
 * @param property - Notion select 타입 프로퍼티
 * @returns select 이름 문자열 (없으면 빈 문자열)
 */
function extractSelect(
  property: PageObjectResponse['properties'][string]
): string {
  if (!property || property.type !== 'select') return ''
  return property.select?.name || ''
}

/**
 * Notion select 값을 InvoiceStatus 타입으로 변환합니다.
 * 알 수 없는 값은 'draft'로 폴백합니다.
 *
 * @param value - Notion select 원시 값
 * @returns InvoiceStatus 타입 값
 */
function parseStatus(value: string): InvoiceStatus {
  const statusMap: Record<string, InvoiceStatus> = {
    '초안': 'draft',
    'draft': 'draft',
    '발송됨': 'sent',
    'sent': 'sent',
    '확인됨': 'confirmed',
    'confirmed': 'confirmed',
    '완료': 'completed',
    'completed': 'completed',
    '취소됨': 'cancelled',
    'cancelled': 'cancelled',
  }
  return statusMap[value] ?? 'draft'
}

/**
 * Notion 페이지 객체를 InvoiceSummary 타입으로 변환합니다.
 * 대시보드 목록 표시에 사용됩니다 (항목 상세 데이터 제외).
 *
 * @param page - Notion API에서 반환된 페이지 객체
 * @returns InvoiceSummary 타입 데이터
 */
export function transformToInvoiceSummary(
  page: PageObjectResponse
): InvoiceSummary {
  const props = page.properties

  return {
    id: page.id,
    title: extractText(props['Title'] || props['제목']),
    clientName: extractText(props['Client Name'] || props['클라이언트명']),
    invoiceDate: extractDate(props['Invoice Date'] || props['견적 일자']) || '',
    dueDate: extractDate(props['Due Date'] || props['만료일']),
    status: parseStatus(
      extractSelect(props['Status'] || props['상태'])
    ),
    totalAmount: extractNumber(props['Total Amount'] || props['총 금액']),
  }
}

/**
 * Notion 페이지 객체를 Invoice 타입으로 변환합니다.
 * 견적서 상세 페이지에 사용됩니다.
 *
 * @note 현재 Items 필드는 rich_text에서 JSON으로 파싱합니다.
 *       별도 Relation DB 연동 시 이 함수를 확장하세요.
 *
 * @param page - Notion API에서 반환된 페이지 객체
 * @returns Invoice 타입 데이터
 */
export function transformToInvoice(page: PageObjectResponse): Invoice {
  const summary = transformToInvoiceSummary(page)
  const props = page.properties

  // Items 필드: JSON 형식의 rich_text에서 파싱 (기본 빈 배열)
  let items: InvoiceItem[] = []
  try {
    const itemsRaw = extractText(props['Items'] || props['항목'])
    if (itemsRaw) {
      items = JSON.parse(itemsRaw) as InvoiceItem[]
    }
  } catch {
    // JSON 파싱 실패 시 빈 배열로 폴백
    items = []
  }

  return {
    ...summary,
    items,
    notes: extractText(props['Notes'] || props['메모']) || null,
  }
}
