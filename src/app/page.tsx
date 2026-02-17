/**
 * 홈 페이지
 *
 * Invoice Web MVP 서비스 소개 랜딩 페이지입니다.
 * 관리자 로그인 버튼으로 대시보드 진입을 안내합니다.
 */
import Link from 'next/link'
import { FileText, Share2, Download, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

/**
 * 홈 페이지 컴포넌트
 * 서비스 소개 섹션과 관리자 로그인 진입점을 제공합니다.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* 히어로 섹션 */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
          견적서를 더 쉽게
          <br />
          <span className="text-primary">관리하고 공유하세요</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Notion 데이터베이스와 연동하여 견적서를 실시간으로 조회하고,
          <br />
          PDF로 다운로드하거나 클라이언트에게 링크로 공유하세요.
        </p>
        <Button asChild size="lg">
          <Link href={ROUTES.LOGIN}>관리자 로그인</Link>
        </Button>
      </section>

      {/* 기능 소개 섹션 */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 기능 카드: Notion 연동 */}
          <div className="rounded-lg border bg-card p-6">
            <FileText className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">Notion 연동</h3>
            <p className="text-sm text-muted-foreground">
              Notion 데이터베이스에서 견적서를 실시간으로 조회합니다.
            </p>
          </div>

          {/* 기능 카드: 링크 공유 */}
          <div className="rounded-lg border bg-card p-6">
            <Share2 className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">링크 공유</h3>
            <p className="text-sm text-muted-foreground">
              고유 링크를 생성하여 클라이언트가 로그인 없이 열람할 수 있습니다.
            </p>
          </div>

          {/* 기능 카드: PDF 다운로드 */}
          <div className="rounded-lg border bg-card p-6">
            <Download className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">PDF 다운로드</h3>
            <p className="text-sm text-muted-foreground">
              견적서를 깔끔한 PDF 파일로 다운로드할 수 있습니다.
            </p>
          </div>

          {/* 기능 카드: 관리자 인증 */}
          <div className="rounded-lg border bg-card p-6">
            <Lock className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">안전한 인증</h3>
            <p className="text-sm text-muted-foreground">
              Supabase Auth 기반 인증으로 관리자 페이지를 보호합니다.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
