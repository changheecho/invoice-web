/**
 * InvoiceViewer - 견적서 웹 뷰어 컴포넌트
 *
 * Notion에서 조회된 견적서 데이터를 전문적인 인보이스 레이아웃으로 렌더링합니다.
 * 관리자 상세 페이지, 공개 견적서 페이지에서 공통으로 사용됩니다.
 * PDF 문서와 동일한 레이아웃 구조를 유지합니다.
 *
 * @example
 * // 관리자 상세 페이지에서 사용
 * <InvoiceViewer invoice={invoiceData} companyName="My Company" showActions />
 *
 * @example
 * // 공개 견적서 페이지에서 사용
 * <InvoiceViewer invoice={invoiceData} />
 */

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_VARIANTS,
  CURRENCY_FORMAT,
} from '@/lib/constants'
import type { Invoice } from '@/types'
import { FileText, Building2, Calendar, Hash, Clock } from 'lucide-react'

// ============================================================
// Props 인터페이스
// ============================================================

/**
 * InvoiceViewer 컴포넌트 Props
 * @property invoice - 렌더링할 견적서 데이터
 * @property companyName - 발행사 회사명 (기본값: "Your Company")
 * @property showActions - 액션 영역 슬롯 표시 여부 (기본값: false)
 * @property actionsSlot - 액션 버튼 영역에 렌더링할 ReactNode (showActions=true 시 사용)
 * @property className - 루트 엘리먼트에 추가할 CSS 클래스
 */
interface InvoiceViewerProps {
  invoice: Invoice
  companyName?: string
  showActions?: boolean
  actionsSlot?: React.ReactNode
  className?: string
}

// ============================================================
// 유틸리티 함수 (포맷팅)
// ============================================================

/**
 * 금액을 한국 원화 형식으로 포맷합니다.
 * @param amount - 포맷할 금액 (숫자)
 * @returns '₩1,000,000' 형식의 문자열
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', CURRENCY_FORMAT).format(amount)
}

/**
 * ISO 날짜 문자열을 한국어 표준 날짜 형식으로 포맷합니다.
 * @param dateStr - YYYY-MM-DD 형식의 날짜 문자열
 * @returns '2026. 2. 18.' 형식의 문자열, 입력이 없으면 '-' 반환
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-'
  // ISO 8601 날짜 파싱 시 UTC 오프셋 보정
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * 견적서 항목의 소계를 모두 합산하여 소계(subtotal)를 계산합니다.
 * @param items - 견적 항목 배열
 * @returns 소계 합산 금액
 */
function calculateSubtotal(items: Invoice['items']): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0)
}

// ============================================================
// 서브 컴포넌트
// ============================================================

/**
 * 견적서 메타 정보 셀 (레이블 + 값 쌍)
 */
function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      {/* 레이블 행 */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </div>
      {/* 값 행 */}
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

// ============================================================
// 메인 컴포넌트
// ============================================================

/**
 * 견적서 웹 뷰어 서버 컴포넌트
 *
 * @param props.invoice - 렌더링할 Invoice 데이터
 * @param props.companyName - 발행사 회사명
 * @param props.showActions - 액션 버튼 영역 표시 여부
 * @param props.actionsSlot - 액션 버튼 영역 콘텐츠
 * @param props.className - 추가 클래스명
 */
export function InvoiceViewer({
  invoice,
  companyName = 'Your Company',
  showActions = false,
  actionsSlot,
  className,
}: InvoiceViewerProps) {
  // 소계 계산
  const subtotal = calculateSubtotal(invoice.items)

  // 상태 레이블 및 배지 변형
  const statusLabel = INVOICE_STATUS_LABELS[invoice.status]
  const statusVariant = INVOICE_STATUS_VARIANTS[invoice.status]

  return (
    <article
      id="invoice-content"
      aria-label={`견적서: ${invoice.title}`}
      className={cn(
        // 기본 레이아웃
        'flex flex-col w-full max-w-4xl mx-auto',
        // 배경 및 텍스트 색상
        'bg-white dark:bg-slate-950',
        // 테두리 및 둥근 모서리
        'border border-border rounded-xl',
        // 그림자
        'shadow-sm',
        className
      )}
    >
      {/* ─────────────────────────────────────
          헤더 섹션: 회사명 + 견적서 제목
      ───────────────────────────────────── */}
      <header
        className={cn(
          'flex flex-col sm:flex-row sm:items-start sm:justify-between',
          'gap-4 px-6 py-8 sm:px-10',
          'border-b border-border'
        )}
      >
        {/* 좌측: 회사 로고 영역 + 회사명 */}
        <div className="flex items-center gap-3">
          {/* 회사 로고 플레이스홀더 */}
          <div
            aria-hidden="true"
            className={cn(
              'flex items-center justify-center shrink-0',
              'h-12 w-12 rounded-lg',
              'bg-primary text-primary-foreground'
            )}
          >
            <Building2 className="h-6 w-6" />
          </div>
          {/* 회사명 */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              발행사
            </p>
            <h1 className="text-lg font-bold text-foreground">{companyName}</h1>
          </div>
        </div>

        {/* 우측: 견적서 제목 배지 */}
        <div className="flex flex-col sm:items-end gap-1">
          <div className="flex items-center gap-2">
            <FileText
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
              견적서
            </span>
          </div>
          {/* 견적서 부제목 (Notion 페이지 제목) */}
          <p className="text-sm text-muted-foreground">{invoice.title}</p>
        </div>
      </header>

      <div className="flex flex-col gap-8 px-6 py-8 sm:px-10">
        {/* ─────────────────────────────────────
            발신/수신 정보 섹션
        ───────────────────────────────────── */}
        <section aria-labelledby="parties-heading">
          <h2 id="parties-heading" className="sr-only">
            발신 및 수신 정보
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* 발신 (발행사) */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                발신
              </p>
              <p className="text-base font-semibold text-foreground">
                {companyName}
              </p>
              <p className="text-sm text-muted-foreground">
                contact@yourcompany.com
              </p>
            </div>

            {/* 수신 (클라이언트) */}
            <div
              className={cn(
                'flex flex-col gap-1.5',
                'sm:text-right'
              )}
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                수신
              </p>
              <p className="text-base font-semibold text-foreground">
                {invoice.clientName}
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* ─────────────────────────────────────
            상세 정보 행 (견적 번호 / 일자 / 만료일 / 상태)
        ───────────────────────────────────── */}
        <section aria-labelledby="meta-heading">
          <h2 id="meta-heading" className="sr-only">
            견적서 상세 정보
          </h2>
          <dl
            className={cn(
              'grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6',
              'rounded-lg bg-muted/40 dark:bg-muted/20 px-5 py-4'
            )}
          >
            {/* 견적 번호 */}
            <div>
              <MetaItem
                icon={Hash}
                label="견적 번호"
                value={
                  <span className="font-mono text-xs truncate" title={invoice.id}>
                    {invoice.id.slice(0, 12)}...
                  </span>
                }
              />
            </div>

            {/* 견적 일자 */}
            <div>
              <MetaItem
                icon={Calendar}
                label="견적 일자"
                value={formatDate(invoice.invoiceDate)}
              />
            </div>

            {/* 만료일 */}
            <div>
              <MetaItem
                icon={Clock}
                label="만료일"
                value={formatDate(invoice.dueDate)}
              />
            </div>

            {/* 상태 배지 */}
            <div>
              <MetaItem
                icon={FileText}
                label="상태"
                value={
                  <Badge variant={statusVariant} aria-label={`견적서 상태: ${statusLabel}`}>
                    {statusLabel}
                  </Badge>
                }
              />
            </div>
          </dl>
        </section>

        {/* ─────────────────────────────────────
            항목 테이블
        ───────────────────────────────────── */}
        <section aria-labelledby="items-heading">
          <h2
            id="items-heading"
            className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3"
          >
            견적 항목
          </h2>

          {/* 테이블 래퍼: 모바일에서 수평 스크롤 */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table aria-label="견적서 항목 목록">
              <TableHeader>
                <TableRow className="bg-muted/40 dark:bg-muted/20 hover:bg-muted/40">
                  {/* 항목명: flex-grow */}
                  <TableHead className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider w-[40%]">
                    항목명
                  </TableHead>
                  {/* 수량 */}
                  <TableHead className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider">
                    수량
                  </TableHead>
                  {/* 단가 */}
                  <TableHead className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider">
                    단가
                  </TableHead>
                  {/* 소계 */}
                  <TableHead className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider">
                    소계
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <TableRow
                      key={index}
                      className={cn(
                        // 홀수 행 줄무늬 배경
                        index % 2 === 1 && 'bg-muted/20 dark:bg-muted/10'
                      )}
                    >
                      {/* 항목명 */}
                      <TableCell className="px-4 py-3 text-sm font-medium text-foreground">
                        {item.name}
                      </TableCell>
                      {/* 수량 */}
                      <TableCell className="px-4 py-3 text-sm text-right text-foreground tabular-nums">
                        {item.quantity.toLocaleString('ko-KR')}
                      </TableCell>
                      {/* 단가 */}
                      <TableCell className="px-4 py-3 text-sm text-right text-foreground tabular-nums">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      {/* 소계 */}
                      <TableCell className="px-4 py-3 text-sm text-right font-medium text-foreground tabular-nums">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  /* 항목 없는 경우 빈 상태 */
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      등록된 견적 항목이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              {/* 테이블 푸터: 합계 행 */}
              {invoice.items.length > 0 && (
                <TableFooter>
                  {/* 소계 행 */}
                  <TableRow className="bg-muted/30 dark:bg-muted/15 hover:bg-muted/30">
                    <TableCell
                      colSpan={3}
                      className="px-4 py-2.5 text-sm text-right text-muted-foreground font-medium"
                    >
                      소계
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-sm text-right text-foreground tabular-nums font-medium">
                      {formatCurrency(subtotal)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </section>

        {/* ─────────────────────────────────────
            요약 섹션 (총액)
        ───────────────────────────────────── */}
        <section
          aria-labelledby="summary-heading"
          className="flex justify-end"
        >
          <h2 id="summary-heading" className="sr-only">
            견적서 금액 요약
          </h2>

          <dl
            className={cn(
              'flex flex-col gap-2',
              'min-w-[240px] sm:min-w-[280px]'
            )}
          >
            {/* 소계 행 (항목이 있을 때만) */}
            {invoice.items.length > 0 && (
              <div className="flex justify-between items-center gap-8 text-sm">
                <dt className="text-muted-foreground">소계</dt>
                <dd className="tabular-nums text-foreground">{formatCurrency(subtotal)}</dd>
              </div>
            )}

            {/* 구분선 */}
            <Separator />

            {/* 총액 행 */}
            <div
              className={cn(
                'flex justify-between items-center gap-8',
                'pt-1'
              )}
            >
              <dt className="text-base font-bold text-foreground">총 금액</dt>
              <dd
                className={cn(
                  'text-xl font-extrabold tabular-nums',
                  'text-foreground'
                )}
                aria-label={`총 금액: ${formatCurrency(invoice.totalAmount)}`}
              >
                {formatCurrency(invoice.totalAmount)}
              </dd>
            </div>
          </dl>
        </section>

        {/* ─────────────────────────────────────
            메모 섹션 (선택, notes가 있을 때만 표시)
        ───────────────────────────────────── */}
        {invoice.notes && (
          <section aria-labelledby="notes-heading">
            <h2
              id="notes-heading"
              className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2"
            >
              메모
            </h2>
            <div
              className={cn(
                'rounded-lg px-4 py-3',
                'bg-muted/40 dark:bg-muted/20',
                'border border-border'
              )}
            >
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </div>
          </section>
        )}

        {/* ─────────────────────────────────────
            액션 슬롯 (showActions=true 시 표시)
            PDF 다운로드, 공유 링크 복사 등의 버튼이 외부에서 주입됩니다.
        ───────────────────────────────────── */}
        {showActions && actionsSlot && (
          <section aria-label="견적서 액션">
            {actionsSlot}
          </section>
        )}
      </div>

      {/* ─────────────────────────────────────
          푸터 섹션
      ───────────────────────────────────── */}
      <footer
        className={cn(
          'flex flex-col sm:flex-row sm:items-center sm:justify-between',
          'gap-2 px-6 py-5 sm:px-10',
          'border-t border-border',
          'bg-muted/20 dark:bg-muted/10',
          'rounded-b-xl'
        )}
      >
        {/* 감사 메시지 */}
        <p className="text-sm text-muted-foreground">
          본 견적서를 검토해 주셔서 감사합니다.
        </p>
        {/* 자동 생성 안내 */}
        <p className="text-xs text-muted-foreground/60">
          이 문서는 자동으로 생성되었습니다.
        </p>
      </footer>
    </article>
  )
}
