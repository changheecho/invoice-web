/**
 * 대시보드 레이아웃
 *
 * 관리자 영역(/dashboard/*)에 공통으로 적용되는 레이아웃입니다.
 * DashboardHeader를 포함하여 모든 대시보드 페이지에 일관된 헤더를 제공합니다.
 *
 * @note 인증 검사는 미들웨어(middleware.ts)에서 처리합니다.
 *       이 레이아웃에서는 별도 인증 확인이 불필요합니다.
 */
import { DashboardHeader } from '@/components/layout/header'

/**
 * 대시보드 레이아웃 컴포넌트
 *
 * @param children - 대시보드 하위 페이지 컴포넌트
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 대시보드 헤더 (로고 + 로그아웃) */}
      <DashboardHeader />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  )
}
