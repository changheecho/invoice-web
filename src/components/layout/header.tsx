/**
 * 관리자 대시보드 헤더 컴포넌트
 *
 * 관리자 영역(/dashboard/*)에서 표시되는 상단 네비게이션 바입니다.
 * 로고, 로그아웃 버튼을 포함합니다.
 *
 * @note 이 컴포넌트는 src/app/dashboard/layout.tsx에서 사용됩니다.
 */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/lib/constants'

/**
 * 관리자 대시보드 헤더 컴포넌트
 * 로그아웃 시 Supabase Auth 세션을 종료하고 로그인 페이지로 이동합니다.
 */
export function DashboardHeader() {
  const router = useRouter()

  /**
   * 로그아웃 핸들러
   * Supabase Auth 세션을 종료하고 로그인 페이지로 이동합니다.
   */
  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success('로그아웃되었습니다')
      router.push(ROUTES.LOGIN)
      router.refresh()
    } catch (error) {
      toast.error('로그아웃 실패했습니다')
      console.error('[로그아웃] 실패:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-7xl flex h-14 items-center justify-between px-4">
        {/* 로고 */}
        <Link
          href={ROUTES.DASHBOARD}
          className="flex items-center gap-2 font-semibold"
        >
          <FileText className="h-5 w-5 text-primary" />
          <span>Invoice Web</span>
        </Link>

        {/* 로그아웃 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </Button>
      </div>
    </header>
  )
}
