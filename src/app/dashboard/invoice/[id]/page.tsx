/**
 * 관리자용 견적서 상세 페이지
 *
 * Notion에서 특정 견적서 데이터를 조회하여 상세 내용을 표시합니다.
 * InvoiceViewer 컴포넌트를 사용하여 전문적인 인보이스 레이아웃을 제공합니다.
 * PDF 다운로드 및 공유 링크 복사 기능이 모두 활성화됩니다.
 *
 * @param params.id - Notion 페이지 ID (URL 파라미터)
 *
 * @protected 이 페이지는 미들웨어(middleware.ts)에 의해 보호됩니다.
 */
import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { notionClient } from '@/lib/notion/client'
import { transformToInvoice } from '@/lib/notion/transform'
import { getOrCreateShareLink } from '@/lib/supabase/share-links'
import { ROUTES, buildPdfFilename } from '@/lib/constants'
import { InvoiceViewer } from '@/components/invoice/InvoiceViewer'
import { InvoiceActionsWrapper } from '@/components/invoice/InvoiceActionsWrapper'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

/**
 * 동적 메타데이터 생성
 * 견적서 제목을 페이지 타이틀에 반영합니다.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params

  try {
    const page = await notionClient.pages.retrieve({ page_id: id })
    if ('properties' in page) {
      const invoice = transformToInvoice(page as PageObjectResponse)
      return {
        title: `${invoice.title} | Invoice Web`,
        description: `${invoice.clientName} 견적서 상세 페이지입니다.`,
      }
    }
  } catch {
    // 메타데이터 생성 실패는 무시
  }

  return { title: '견적서 상세 | Invoice Web' }
}

// ============================================================
// 로딩 스켈레톤
// ============================================================

/**
 * 견적서 상세 뷰어 로딩 스켈레톤
 * 데이터를 불러오는 동안 동일한 레이아웃 구조로 표시됩니다.
 */
function InvoiceDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="견적서 로딩 중"
      className="w-full bg-white dark:bg-slate-950 border border-border rounded-xl shadow-sm overflow-hidden"
    >
      {/* 헤더 스켈레톤 */}
      <div className="flex items-start justify-between gap-4 px-6 py-8 sm:px-10 border-b border-border">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* 본문 스켈레톤 */}
      <div className="px-6 py-8 sm:px-10 flex flex-col gap-8">
        {/* 발신/수신 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>

        <Skeleton className="h-px w-full" />

        {/* 메타 정보 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg bg-muted/40 px-5 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        {/* 항목 테이블 */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="bg-muted/40 px-4 py-3 grid grid-cols-4 gap-4">
            {['항목명', '수량', '단가', '소계'].map((col) => (
              <Skeleton key={col} className="h-3 w-12" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 border-t border-border">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-8 ml-auto" />
              <Skeleton className="h-4 w-24 ml-auto" />
              <Skeleton className="h-4 w-24 ml-auto" />
            </div>
          ))}
        </div>

        {/* 총 금액 */}
        <div className="flex justify-end">
          <div className="flex flex-col gap-2 min-w-[240px]">
            <Skeleton className="h-px w-full" />
            <div className="flex justify-between pt-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-6 w-28" />
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* 푸터 */}
      <div className="flex justify-between items-center px-6 py-5 sm:px-10 border-t border-border bg-muted/20">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  )
}

// ============================================================
// 메인 페이지 컴포넌트
// ============================================================

/**
 * 관리자용 견적서 상세 페이지 컴포넌트
 *
 * 구성:
 * - 뒤로가기 버튼: 대시보드로 이동
 * - 페이지 제목
 * - Suspense 경계: 스켈레톤 로딩
 * - InvoiceViewer: 전문 인보이스 레이아웃
 * - InvoiceActionsWrapper: PDF 다운로드 + 공유 링크 복사 버튼 모두 표시
 */
export default async function DashboardInvoicePage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  // Notion에서 견적서 데이터 조회
  let invoice
  try {
    const page = await notionClient.pages.retrieve({ page_id: id })

    if (!('properties' in page)) {
      notFound()
    }

    invoice = transformToInvoice(page as PageObjectResponse)
  } catch {
    notFound()
  }

  // ShareLink 조회 또는 신규 생성 (공유 버튼용)
  let shareLink = null
  try {
    shareLink = await getOrCreateShareLink(id)
  } catch {
    // ShareLink 생성 실패는 무시 (공유 버튼 비활성화로 처리됨)
  }

  // PDF 파일명 및 공유 URL 생성
  const pdfFileName = buildPdfFilename(invoice.clientName, invoice.invoiceDate)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const shareUrl = shareLink ? `${appUrl}/invoice/${shareLink.shareId}` : undefined

  return (
    <div
      className={cn(
        'min-h-screen py-8',
        'bg-gradient-to-br from-slate-50 to-slate-100',
        'dark:from-slate-950 dark:to-slate-900'
      )}
    >
      <div className="container mx-auto px-4 max-w-4xl">

        {/* ────────────────────────────────────
            뒤로가기 버튼
        ──────────────────────────────────── */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              'text-muted-foreground hover:text-foreground',
              'gap-1 -ml-2 px-2'
            )}
          >
            <Link
              href={ROUTES.DASHBOARD}
              aria-label="견적서 목록 대시보드로 돌아가기"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-medium">목록으로 돌아가기</span>
            </Link>
          </Button>
        </div>

        {/* ────────────────────────────────────
            페이지 제목
        ──────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            견적서 상세
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Notion에서 조회한 견적서 데이터를 확인하고 공유합니다.
          </p>
        </div>

        {/* ────────────────────────────────────
            InvoiceViewer (Suspense 경계)
        ──────────────────────────────────── */}
        <Suspense fallback={<InvoiceDetailSkeleton />}>
          <InvoiceViewer
            invoice={invoice}
            showActions={true}
            actionsSlot={
              <InvoiceActionsWrapper
                invoiceId={id}
                shareId={shareLink?.shareId}
                showPdfButton={true}
                showShareButton={true}
                pdfFileName={pdfFileName}
                shareUrl={shareUrl}
              />
            }
          />
        </Suspense>

      </div>
    </div>
  )
}
