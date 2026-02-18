/**
 * 전역 404 Not Found 페이지
 *
 * 존재하지 않는 경로 또는 유효하지 않은 공유 링크에 접근할 때 표시됩니다.
 * Next.js App Router의 not-found.tsx 컨벤션을 따릅니다.
 *
 * @example
 * // 코드에서 호출하는 방법
 * import { notFound } from 'next/navigation'
 * if (!data) notFound()
 */
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * 전역 404 페이지 컴포넌트
 *
 * 구성:
 * - 배경: gradient (라이트/다크 모드)
 * - AlertCircle 아이콘 (destructive 색상)
 * - 큰 "404" 텍스트
 * - 설명 메시지
 * - "홈으로 돌아가기" 버튼
 */
export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900"
      role="main"
      aria-labelledby="not-found-title"
    >
      <div className="text-center max-w-md">

        {/* AlertCircle 아이콘 */}
        <div
          className="flex justify-center mb-6"
          aria-hidden="true"
        >
          <AlertCircle
            className="h-16 w-16 text-destructive opacity-75"
          />
        </div>

        {/* 404 큰 텍스트 */}
        <h1
          id="not-found-title"
          className="text-8xl font-extrabold tracking-tight text-foreground tabular-nums"
        >
          404
        </h1>

        {/* 제목 */}
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          페이지를 찾을 수 없습니다
        </h2>

        {/* 설명 */}
        <p className="mt-2 text-base text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          <br />
          URL을 다시 확인해 주세요.
        </p>

        {/* 홈으로 버튼 */}
        <div className="mt-8">
          <Button
            size="lg"
            asChild
          >
            <Link
              href="/"
              aria-label="홈 페이지로 돌아가기"
            >
              홈으로 돌아가기
            </Link>
          </Button>
        </div>

      </div>
    </div>
  )
}
