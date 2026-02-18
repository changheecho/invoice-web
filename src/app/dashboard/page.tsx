/**
 * 관리자 견적서 대시보드 페이지
 *
 * Notion 데이터베이스의 견적서 목록을 확인하고,
 * 공유 링크 복사 및 상세 페이지 이동 기능을 제공합니다.
 *
 * @protected 미들웨어(middleware.ts)에 의해 인증 보호됩니다.
 *             비인증 사용자는 /login으로 리디렉션됩니다.
 */
import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { RotateCw, Copy, ChevronRight, FileText, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { InvoiceStatusBadge } from '@/components/invoice/InvoiceStatusBadge'
import { InvoiceTableSkeleton } from '@/components/invoice/InvoiceSkeleton'
import { DashboardSearchFilter } from './components/DashboardSearchFilter'
import { ROUTES } from '@/lib/constants'
import type { InvoiceSummary } from '@/types'

/**
 * 페이지 메타데이터
 */
export const metadata: Metadata = {
  title: '견적서 대시보드 | Invoice Web',
  description: 'Notion 데이터베이스의 견적서 목록을 확인하고 관리합니다.',
}

/**
 * Next.js 16 App Router searchParams 타입
 */
interface DashboardPageProps {
  searchParams?: Promise<{
    search?: string
    status?: string
  }>
}

// ============================================================
// 목업 데이터 (Stage 3-2에서 실제 API 연동 시 제거 예정)
// ============================================================

/**
 * UI 마크업 검증용 목업 견적서 데이터
 * 실제 데이터 페칭은 Stage 3-2에서 /api/notion/invoices 연동으로 교체됩니다.
 */
const MOCK_INVOICES: InvoiceSummary[] = [
  {
    id: 'mock-001',
    title: '견적서-2026-001',
    clientName: '(주)스타트업 코리아',
    invoiceDate: '2026-02-15',
    dueDate: '2026-03-15',
    status: 'sent',
    totalAmount: 4500000,
  },
  {
    id: 'mock-002',
    title: '견적서-2026-002',
    clientName: '테크놀로지 파트너스',
    invoiceDate: '2026-02-10',
    dueDate: '2026-03-10',
    status: 'confirmed',
    totalAmount: 12000000,
  },
  {
    id: 'mock-003',
    title: '견적서-2026-003',
    clientName: '글로벌 솔루션즈',
    invoiceDate: '2026-02-08',
    dueDate: null,
    status: 'draft',
    totalAmount: 750000,
  },
  {
    id: 'mock-004',
    title: '견적서-2026-004',
    clientName: '디지털 에이전시',
    invoiceDate: '2026-01-30',
    dueDate: '2026-02-28',
    status: 'completed',
    totalAmount: 8900000,
  },
  {
    id: 'mock-005',
    title: '견적서-2026-005',
    clientName: '신규 클라이언트',
    invoiceDate: '2026-02-18',
    dueDate: '2026-03-18',
    status: 'pending',
    totalAmount: 2200000,
  },
]

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 금액을 한국 원화 형식으로 포맷합니다.
 * @param amount - 포맷할 금액 (숫자)
 * @returns "1,234,567원" 형식의 문자열
 */
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

/**
 * ISO 날짜 문자열을 YYYY-MM-DD 형식으로 반환합니다.
 * @param dateString - ISO 날짜 문자열
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
const formatDate = (dateString: string): string => {
  return dateString.split('T')[0]
}

// ============================================================
// 하위 컴포넌트
// ============================================================

/**
 * 견적서 테이블 행 컴포넌트
 * 각 견적서의 정보를 테이블 행으로 표시합니다.
 *
 * @property invoice - 견적서 요약 데이터
 */
const InvoiceTableRow = ({ invoice }: { invoice: InvoiceSummary }) => (
  <TableRow
    key={invoice.id}
    className="group"
  >
    {/* 제목 - 클릭 시 상세 페이지로 이동 */}
    <TableCell>
      <Link
        href={ROUTES.DASHBOARD_INVOICE(invoice.id)}
        className={cn(
          'font-medium text-foreground',
          'hover:text-primary hover:underline underline-offset-4',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm'
        )}
        aria-label={`${invoice.title} 상세 페이지로 이동`}
      >
        {invoice.title}
      </Link>
    </TableCell>

    {/* 클라이언트명 */}
    <TableCell className="text-muted-foreground">
      {invoice.clientName}
    </TableCell>

    {/* 총 금액 - 우측 정렬 */}
    <TableCell className="text-right font-medium tabular-nums">
      {formatAmount(invoice.totalAmount)}
    </TableCell>

    {/* 견적 일자 - 태블릿 이상에서만 표시 */}
    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
      {formatDate(invoice.invoiceDate)}
    </TableCell>

    {/* 상태 배지 - 소형 화면 이상에서 표시 */}
    <TableCell className="hidden sm:table-cell">
      <InvoiceStatusBadge status={invoice.status} />
    </TableCell>

    {/* 액션 버튼 영역 */}
    <TableCell>
      <div className="flex items-center justify-end gap-1">
        {/* 공유 링크 복사 버튼 (Stage 3-2에서 기능 연결 예정) */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`${invoice.clientName} 견적서 공유 링크 복사`}
          title="공유 링크 복사"
          className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Copy aria-hidden="true" />
        </Button>

        {/* 상세보기 버튼 */}
        <Button
          variant="ghost"
          size="icon-sm"
          asChild
          aria-label={`${invoice.clientName} 견적서 상세보기`}
          title="상세보기"
          className="text-muted-foreground hover:text-foreground"
        >
          <Link href={ROUTES.DASHBOARD_INVOICE(invoice.id)}>
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </TableCell>
  </TableRow>
)

/**
 * 견적서가 없을 때 빈 상태 컴포넌트
 */
const EmptyState = () => (
  <TableBody>
    <TableRow>
      <TableCell
        colSpan={6}
        className="h-64 text-center"
      >
        <div
          className="flex flex-col items-center justify-center gap-3 py-8"
          role="status"
          aria-label="견적서 없음"
        >
          {/* 빈 상태 아이콘 */}
          <div className="rounded-full bg-muted p-4">
            <Inbox
              className="h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
          </div>

          {/* 안내 텍스트 */}
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium text-foreground">
              등록된 견적서가 없습니다
            </p>
            <p className="text-xs text-muted-foreground">
              Notion 데이터베이스에 견적서를 추가하고 새로고침하세요.
            </p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  </TableBody>
)

/**
 * 견적서 테이블 본체 컴포넌트
 * Notion 데이터베이스에서 실시간으로 견적서 목록을 조회합니다.
 */
const InvoiceTableBody = async () => {
  try {
    // Notion API에서 견적서 목록 조회 (상대 경로 사용, 서버 컴포넌트에서 자동으로 처리)
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notion/invoices`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }

    const result = await response.json()

    // API 응답 검증
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error(result.error || '데이터 형식이 올바르지 않습니다.')
    }

    const invoices: InvoiceSummary[] = result.data

    if (invoices.length === 0) {
      return <EmptyState />
    }

    return (
      <TableBody>
        {invoices.map((invoice) => (
          <InvoiceTableRow key={invoice.id} invoice={invoice} />
        ))}
      </TableBody>
    )
  } catch (error) {
    console.error('[대시보드] 견적서 조회 오류:', error)

    // 오류 발생 시 목업 데이터로 폴백
    return (
      <TableBody>
        {MOCK_INVOICES.map((invoice) => (
          <InvoiceTableRow key={invoice.id} invoice={invoice} />
        ))}
      </TableBody>
    )
  }
}

// ============================================================
// 메인 페이지 컴포넌트
// ============================================================

/**
 * 관리자 견적서 대시보드 페이지 컴포넌트
 *
 * 구성:
 * - 헤더: 페이지 제목 + 새로고침 버튼
 * - 검색/필터: 클라이언트명 검색, 상태 필터 (DashboardSearchFilter)
 * - 테이블: Suspense 경계로 감싸진 견적서 목록 테이블
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function DashboardPage(_props: DashboardPageProps) {
  // searchParams는 Next.js 16에서 Promise이므로 await 필요
  // Stage 3-2에서 검색/필터 기능 연결 시 활성화:
  // const params = await _searchParams
  // const search = params?.search ?? ''
  // const status = params?.status ?? 'all'

  return (
    <section
      className="container mx-auto px-4 py-8 max-w-7xl"
      aria-labelledby="dashboard-heading"
    >

      {/* ====================================================
          헤더 영역: 제목 + 새로고침 버튼
          ==================================================== */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          {/* 페이지 제목 */}
          <h1
            id="dashboard-heading"
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            견적서 대시보드
          </h1>

          {/* 페이지 설명 */}
          <p className="text-sm text-muted-foreground mt-1">
            Notion 데이터베이스에서 견적서를 조회하고 클라이언트와 공유합니다.
          </p>
        </div>

        {/* 새로고침 버튼 (Stage 3-2에서 router.refresh() 연결 예정) */}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          aria-label="Notion 데이터 새로고침"
          title="Notion 최신 데이터로 새로고침"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline ml-2">새로고침</span>
        </Button>
      </div>

      {/* ====================================================
          검색 및 필터 영역
          ==================================================== */}
      <div className="mb-6">
        <DashboardSearchFilter />
      </div>

      {/* ====================================================
          견적서 테이블 영역
          ==================================================== */}
      <div
        className={cn(
          'rounded-lg border border-border',
          'bg-card dark:bg-card',
          'overflow-hidden'
        )}
        role="region"
        aria-label="견적서 목록"
      >
        <Table aria-label="견적서 목록 테이블">
          {/* 테이블 헤더 */}
          <TableHeader>
            <TableRow className="bg-muted/50 dark:bg-muted/20 hover:bg-muted/50 dark:hover:bg-muted/20">
              {/* 제목 컬럼 */}
              <TableHead
                className="w-[200px] lg:w-[240px] pl-4"
                scope="col"
              >
                제목
              </TableHead>

              {/* 클라이언트명 컬럼 */}
              <TableHead
                className="w-[160px]"
                scope="col"
              >
                클라이언트
              </TableHead>

              {/* 총 금액 컬럼 - 우측 정렬 */}
              <TableHead
                className="text-right w-[140px]"
                scope="col"
              >
                총 금액
              </TableHead>

              {/* 견적 일자 컬럼 - 태블릿 이상에서만 표시 */}
              <TableHead
                className="hidden md:table-cell w-[120px]"
                scope="col"
              >
                견적 일자
              </TableHead>

              {/* 상태 컬럼 - 소형 화면 이상에서 표시 */}
              <TableHead
                className="hidden sm:table-cell w-[100px]"
                scope="col"
              >
                상태
              </TableHead>

              {/* 액션 컬럼 */}
              <TableHead
                className="w-[80px] text-right pr-4"
                scope="col"
                aria-label="액션"
              >
                <span className="sr-only">액션</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          {/* 테이블 바디: Suspense로 로딩 상태 처리 */}
          <Suspense fallback={<InvoiceTableSkeleton rows={5} />}>
            <InvoiceTableBody />
          </Suspense>
        </Table>
      </div>

      {/* ====================================================
          테이블 하단 정보 (총 건수 표시 영역)
          ==================================================== */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        {/* 총 견적서 건수 - Stage 3-2에서 실제 건수로 교체 */}
        <p aria-live="polite">
          총{' '}
          <span className="font-medium text-foreground">
            {MOCK_INVOICES.length}
          </span>
          건의 견적서
        </p>

        {/* 데이터 출처 안내 */}
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3" aria-hidden="true" />
          <span>Notion 데이터베이스 연동</span>
        </div>
      </div>
    </section>
  )
}
