/**
 * Invoice Web MVP - 앱 전체 상수 정의
 *
 * 라우트 경로, 상태 레이블, 포맷팅 등
 * 앱 전반에서 공유하는 상수 값을 관리합니다.
 */

import type { InvoiceStatus, NavItem } from '@/types'

// ============================================================
// 라우트 경로 상수
// ============================================================

/**
 * 앱 내 주요 라우트 경로 상수
 * 하드코딩된 문자열 대신 이 상수를 사용하여 경로 관리를 일원화합니다.
 */
export const ROUTES = {
  /** 홈 페이지 */
  HOME: '/',
  /** 로그인 페이지 */
  LOGIN: '/login',
  /** 관리자 대시보드 */
  DASHBOARD: '/dashboard',
  /** 관리자용 견적서 상세 (동적 경로 빌더 포함) */
  DASHBOARD_INVOICE: (id: string) => `/dashboard/invoice/${id}`,
  /** 클라이언트용 공개 견적서 (동적 경로 빌더 포함) */
  INVOICE_PUBLIC: (shareId: string) => `/invoice/${shareId}`,
} as const

// ============================================================
// 관리자 네비게이션
// ============================================================

/**
 * 관리자 대시보드 헤더 네비게이션 아이템
 * @used src/components/layout/header.tsx
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: '대시보드', href: ROUTES.DASHBOARD },
]

// ============================================================
// 견적서 상태 레이블 및 스타일
// ============================================================

/**
 * 견적서 상태(InvoiceStatus)에 대응하는 한국어 레이블
 *
 * @example
 * const label = INVOICE_STATUS_LABELS['sent'] // '발송됨'
 */
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending: '대기',
  draft: '초안',
  sent: '발송됨',
  confirmed: '확인됨',
  completed: '완료',
  cancelled: '취소됨',
}

/**
 * 견적서 상태에 대응하는 Badge 색상 변형 (shadcn/ui Badge variant)
 *
 * @example
 * const variant = INVOICE_STATUS_VARIANTS['completed'] // 'default'
 */
export const INVOICE_STATUS_VARIANTS: Record<
  InvoiceStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  draft: 'outline',
  sent: 'secondary',
  confirmed: 'default',
  completed: 'default',
  cancelled: 'destructive',
}

// ============================================================
// 숫자 / 날짜 포맷 상수
// ============================================================

/**
 * 금액 포맷 옵션 (한국 원화)
 * Intl.NumberFormat 에 전달하는 옵션 객체
 *
 * @example
 * const formatted = new Intl.NumberFormat('ko-KR', CURRENCY_FORMAT).format(150000)
 * // '₩150,000'
 */
export const CURRENCY_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
}

/**
 * 날짜 포맷 옵션 (한국어 표준)
 *
 * @example
 * const formatted = new Intl.DateTimeFormat('ko-KR', DATE_FORMAT).format(new Date())
 * // '2026. 2. 16.'
 */
export const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

// ============================================================
// 페이지네이션 상수
// ============================================================

/**
 * 대시보드 견적서 목록 페이지당 표시 항목 수
 */
export const DASHBOARD_PAGE_SIZE = 20

// ============================================================
// PDF 파일명 패턴
// ============================================================

/**
 * PDF 파일명 생성 함수
 * 견적서 다운로드 시 파일명에 사용됩니다.
 *
 * @param clientName - 클라이언트명
 * @param date - 견적 일자 (YYYY-MM-DD)
 * @returns 견적서_[클라이언트명]_[날짜].pdf 형식의 파일명
 *
 * @example
 * buildPdfFilename('홍길동', '2026-02-16') // '견적서_홍길동_2026-02-16.pdf'
 */
export function buildPdfFilename(clientName: string, date: string): string {
  // 파일명에 사용 불가능한 특수문자 제거
  const safeClientName = clientName.replace(/[/\\?%*:|"<>]/g, '')
  return `견적서_${safeClientName}_${date}.pdf`
}
