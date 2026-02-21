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
import { RotateCw, FileText, Inbox, Copy, ChevronRight } from 'lucide-react'
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
import { InvoiceViewStatusBadge } from '@/components/invoice/InvoiceViewStatusBadge'
import { InvoiceTableSkeleton } from '@/components/invoice/InvoiceSkeleton'
import { DashboardSearchFilter } from './components/DashboardSearchFilter'
import { ROUTES } from '@/lib/constants'
import { transformToInvoiceSummary } from '@/lib/notion/transform'
import { NOTION_DATABASE_ID } from '@/lib/env'
import { getShareLinkByNotionId } from '@/lib/supabase/share-links'
import type { InvoiceSummary } from '@/types'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { InvoiceTableRowClient } from './components/InvoiceTableRowClient'

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
 * 견적서 테이블 행 컴포넌트 (Post-MVP Phase 2 수정)
 * 각 견적서의 정보를 테이블 행으로 표시합니다.
 *
 * @property invoice - 견적서 요약 데이터
 * @property viewCount - 조회 횟수 (Post-MVP Phase 2)
 * @property lastViewedAt - 최근 조회 일시 (Post-MVP Phase 2)
 */
const InvoiceTableRow = ({
  invoice,
  viewCount = 0,
  lastViewedAt,
}: {
  invoice: InvoiceSummary
  viewCount?: number
  lastViewedAt?: string
}) => (
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

    {/* 조회 상태 배지 (Post-MVP Phase 2) - 소형 화면 이상에서 표시 */}
    <TableCell className="hidden sm:table-cell">
      <InvoiceViewStatusBadge viewCount={viewCount} lastViewedAt={lastViewedAt} />
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
 *
 * Notion 데이터베이스에서 견적서 목록을 조회하여 TableBody를 렌더링합니다.
 *
 * 캐싱 전략:
 * - `next: { revalidate: 60 }` 옵션으로 60초간 응답을 캐시합니다.
 * - 60초 이내 동일 요청은 캐시 응답을 반환하여 Notion API 호출 횟수를 절감합니다.
 *
 * Suspense 연동:
 * - 이 컴포넌트는 Suspense 경계 내부에서 렌더링됩니다.
 * - 데이터 로딩 중에는 InvoiceTableSkeleton이 표시됩니다.
 * - DashboardSearchFilter는 Suspense 외부에 있으므로 즉시 표시됩니다.
 */
const InvoiceTableBody = async () => {
  // 데이터 조회를 try/catch로 감싸고, JSX 구성은 외부에서 처리
  let invoices: InvoiceSummary[] = []
  let hasError = false

  try {
    // Notion REST API를 fetch로 직접 호출 (사용자 curl 테스트 기반)
    console.log('[대시보드] Notion 데이터 조회:', { NOTION_DATABASE_ID })

    const response = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID.replace(/-/g, '')}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sorts: [
            {
              property: '발행일',
              direction: 'descending',
            },
          ],
        }),
        // ISR 캐싱: 관리자 대시보드 목록은 60초마다 Notion 데이터를 재검증합니다.
        // 60초 이내 동일 요청은 캐시 응답을 반환하여 Notion API 호출 횟수를 절감합니다.
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Notion API 오류:', errorData)
      throw new Error(`Notion API 실패: ${response.statusText}`)
    }

    const data = await response.json()

    // Notion 페이지 객체를 InvoiceSummary 타입으로 변환
    invoices = data.results
      .filter((page: unknown): page is PageObjectResponse => {
        return typeof page === 'object' && page !== null && 'object' in page && page.object === 'page' && 'properties' in page
      })
      .map(transformToInvoiceSummary)
  } catch (error) {
    console.error('[대시보드] 견적서 조회 오류:', error)
    hasError = true
  }

  // 에러 발생 또는 데이터가 없으면 빈 상태 표시
  if (hasError || invoices.length === 0) {
    return <EmptyState />
  }

  // Post-MVP Phase 2: 각 invoice의 view_count 조회
  const invoicesWithViewStats = await Promise.all(
    invoices.map(async (invoice) => {
      try {
        const shareLink = await getShareLinkByNotionId(invoice.id)
        return {
          invoice,
          viewCount: shareLink?.viewCount ?? 0,
          lastViewedAt: shareLink?.lastViewedAt ?? undefined,
        }
      } catch (error) {
        console.warn(`[대시보드] view_count 조회 실패 (invoiceId=${invoice.id}):`, error)
        return {
          invoice,
          viewCount: 0,
          lastViewedAt: undefined,
        }
      }
    })
  )

  return (
    <TableBody>
      {invoicesWithViewStats.map(({ invoice, viewCount, lastViewedAt }) => (
        <InvoiceTableRowClient
          key={invoice.id}
          invoice={invoice}
          viewCount={viewCount}
          lastViewedAt={lastViewedAt}
        />
      ))}
    </TableBody>
  )
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
          - Suspense 경계 외부에 배치하여 데이터 로딩 중에도 즉시 표시됩니다.
          - 사용자는 Notion 데이터를 기다리는 동안 검색/필터 UI를 즉시 사용 가능합니다.
          ==================================================== */}
      <div className="mb-6">
        <DashboardSearchFilter />
      </div>

      {/* ====================================================
          견적서 테이블 영역
          - InvoiceTableBody는 Suspense 경계 내부에 배치하여 비동기 렌더링을 지원합니다.
          - Notion API 응답 대기 중에는 InvoiceTableSkeleton이 표시됩니다.
          - DashboardSearchFilter가 외부에 있으므로 검색 UI는 로딩 중에도 즉시 표시됩니다.
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

              {/* 조회 컬럼 (Post-MVP Phase 2) - 소형 화면 이상에서 표시 */}
              <TableHead
                className="hidden sm:table-cell w-[100px]"
                scope="col"
              >
                조회
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
        {/* 데이터 출처 안내 */}
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3" aria-hidden="true" />
          <span>Notion 데이터베이스 연동</span>
        </div>
      </div>
    </section>
  )
}
