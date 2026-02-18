/**
 * Invoice Web MVP - 전체 타입 정의
 *
 * Notion 견적서 데이터, Supabase ShareLink,
 * API 응답 등 프로젝트 전반에 걸쳐 사용되는 타입을 정의합니다.
 */

// ============================================================
// Notion 관련 타입
// ============================================================

/**
 * Notion 견적서 항목 (라인 아이템)
 * @property name - 항목명 (제품/서비스)
 * @property quantity - 수량
 * @property unitPrice - 단가 (원)
 * @property subtotal - 소계 (수량 × 단가)
 */
export interface InvoiceItem {
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

/**
 * Notion 데이터베이스에서 조회한 견적서 데이터
 * @property id - Notion 페이지 ID
 * @property title - 견적서 제목
 * @property clientName - 클라이언트명
 * @property invoiceDate - 견적 일자 (ISO 8601 형식)
 * @property dueDate - 만료일 (선택)
 * @property status - 견적서 상태
 * @property totalAmount - 총 금액 (원)
 * @property items - 견적 항목 목록
 * @property notes - 내부 메모 (선택)
 */
export interface Invoice {
  id: string
  title: string
  clientName: string
  invoiceDate: string
  dueDate?: string | null
  status: InvoiceStatus
  totalAmount: number
  items: InvoiceItem[]
  notes?: string | null
}

/**
 * 견적서 상태 유니온 타입
 * - pending: 대기
 * - draft: 초안
 * - sent: 발송됨
 * - confirmed: 확인됨
 * - completed: 완료
 * - cancelled: 취소됨
 */
export type InvoiceStatus = 'pending' | 'draft' | 'sent' | 'confirmed' | 'completed' | 'cancelled'

/**
 * 견적서 목록 조회 시 반환되는 요약 데이터 (상세 항목 제외)
 */
export type InvoiceSummary = Omit<Invoice, 'items' | 'notes'>

// ============================================================
// Supabase ShareLink 관련 타입
// ============================================================

/**
 * ShareLink 테이블 레코드
 * Notion 페이지 ID와 공개 공유 링크 ID의 매핑
 *
 * @property id - UUID (Supabase 자동 생성)
 * @property notionPageId - Notion 페이지 ID (unique)
 * @property shareId - 공개 공유 링크용 고유 ID (nanoid, unique)
 * @property createdAt - 생성 일시 (ISO 8601)
 */
export interface ShareLink {
  id: string
  notionPageId: string
  shareId: string
  createdAt: string
}

/**
 * ShareLink 생성 요청 데이터
 */
export type ShareLinkCreateInput = Pick<ShareLink, 'notionPageId'>

// ============================================================
// API 응답 타입
// ============================================================

/**
 * API 성공 응답 래퍼
 * @template T - 응답 데이터 타입
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

/**
 * API 에러 응답 래퍼
 */
export interface ApiErrorResponse {
  success: false
  error: string
  details?: string
}

/**
 * API 응답 유니온 타입
 * @template T - 응답 데이터 타입
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// ============================================================
// 인증 관련 타입
// ============================================================

/**
 * 로그인 폼 입력 데이터
 * @property email - 이메일 주소
 * @property password - 비밀번호
 */
export interface LoginFormValues {
  email: string
  password: string
}

/**
 * 인증된 사용자 정보 (Supabase User 간소화)
 * @property id - Supabase 사용자 UUID
 * @property email - 이메일 주소
 */
export interface AuthUser {
  id: string
  email: string
}

// ============================================================
// 공통 UI 관련 타입
// ============================================================

/**
 * 네비게이션 아이템
 * @property label - 표시 텍스트
 * @property href - 링크 경로
 */
export interface NavItem {
  label: string
  href: string
}
