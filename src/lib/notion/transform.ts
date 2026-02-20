/**
 * Notion API 응답 → 앱 내부 타입 변환 유틸리티
 *
 * Notion의 복잡한 프로퍼티 구조를 Invoice, InvoiceItem 타입으로
 * 안전하게 변환합니다. 필드가 없거나 형식이 달라도 크래시 없이 처리합니다.
 *
 * Notion 데이터베이스 필드명 매핑:
 * - Title → 견적서 제목 → 견적서 번호 (title 타입)
 * - Client Name → 클라이언트명 (rich_text 타입)
 * - Invoice Date → 견적 일자 → 발행일 (date 타입)
 * - Due Date → 만료일 → 유효기간 (date 타입, 선택)
 * - Status → 상태 (status 타입 또는 select 타입)
 * - Total Amount → 총 금액 (number 타입)
 * - Items → 항목 (relation 타입)
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
 * Notion 프로퍼티에서 select 또는 status 값을 추출합니다.
 *
 * @param property - Notion select 또는 status 타입 프로퍼티
 * @returns select/status 이름 문자열 (없으면 빈 문자열)
 */
function extractSelect(
  property: PageObjectResponse['properties'][string]
): string {
  if (!property) return ''

  // select 타입 처리
  if (property.type === 'select') {
    return property.select?.name || ''
  }

  // status 타입 처리 (Notion의 Status 프로퍼티)
  if (property.type === 'status') {
    return property.status?.name || ''
  }

  return ''
}

/**
 * Notion relation 프로퍼티에서 페이지 ID 배열을 추출합니다.
 * Items DB와 같은 관계형 데이터 조회에 사용됩니다.
 *
 * @param property - Notion relation 타입 프로퍼티
 * @returns 페이지 ID 배열 (없으면 빈 배열)
 */
function extractRelationIds(
  property: PageObjectResponse['properties'][string]
): string[] {
  if (!property || property.type !== 'relation') return []
  return property.relation.map((r: { id: string }) => r.id) || []
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
    '대기': 'pending',
    'pending': 'pending',
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
    title: extractText(props['Title'] || props['제목'] || props['견적서 번호']),
    clientName: (extractText(props['Client Name'] || props['클라이언트명']) || '').trim(),
    invoiceDate: extractDate(props['Invoice Date'] || props['견적 일자'] || props['발행일']) || '',
    dueDate: extractDate(props['Due Date'] || props['만료일'] || props['유효기간']),
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
 * @note Items 필드는 Notion의 Relation 타입입니다.
 *       실제 Items 데이터 조회는 API Route에서 별도로 처리합니다.
 *       이 함수에서는 Items Relation ID 배열만 반환합니다.
 *
 * @param page - Notion API에서 반환된 페이지 객체
 * @returns Invoice 타입 데이터 (items는 빈 배열로 기본값)
 */
export function transformToInvoice(page: PageObjectResponse): Invoice {
  const summary = transformToInvoiceSummary(page)
  const props = page.properties

  // Items 필드: Relation 타입에서 ID 배열 추출
  // 실제 Item 데이터는 API Route에서 별도 조회
  // (현재는 빈 배열로 설정, 실제 items는 API Route에서 조회 후 채움)
  const items: InvoiceItem[] = []

  return {
    ...summary,
    items,
    notes: extractText(props['Notes'] || props['메모']) || null,
  }
}

/**
 * Items Relation ID 배열을 반환합니다.
 * API Route에서 Items를 조회할 때 사용합니다.
 *
 * @param page - Notion 페이지 객체
 * @returns Items Relation ID 배열
 */
export function extractItemIds(page: PageObjectResponse): string[] {
  const props = page.properties
  return extractRelationIds(props['Items'] || props['항목'])
}
