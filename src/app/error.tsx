'use client'

/**
 * 전역 에러 페이지 (500 에러 처리)
 *
 * Next.js App Router에서 예상치 못한 런타임 에러 발생 시 표시됩니다.
 * 'use client' 디렉티브 필수: error 및 reset 프롭을 사용하기 위해 클라이언트 컴포넌트여야 합니다.
 *
 * @example
 * // 에러 바운더리 내에서 throw된 에러를 자동으로 처리합니다.
 * throw new Error('서버 오류 발생')
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * 에러 페이지 Props
 * @property error - 발생한 에러 객체 (digest 포함)
 * @property reset - 에러 바운더리를 리셋하는 함수
 */
interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * 전역 에러 페이지 컴포넌트
 *
 * 구성:
 * - 배경: gradient (라이트/다크 모드)
 * - AlertTriangle 아이콘 (destructive 색상)
 * - 에러 제목 및 설명 메시지
 * - 개발 환경에서만 에러 상세 정보 표시
 * - "다시 시도" + "홈으로" 버튼
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  // 에러를 콘솔에 기록합니다 (프로덕션 에러 추적용)
  useEffect(() => {
    console.error('앱 에러 발생:', error)
  }, [error])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900"
      role="main"
      aria-labelledby="error-title"
    >
      <div className="text-center max-w-md">

        {/* AlertTriangle 아이콘 */}
        <div
          className="flex justify-center mb-6"
          aria-hidden="true"
        >
          <AlertTriangle
            className="h-16 w-16 text-destructive opacity-75"
          />
        </div>

        {/* 에러 제목 */}
        <h1
          id="error-title"
          className="text-3xl font-bold text-foreground"
        >
          오류가 발생했습니다
        </h1>

        {/* 에러 설명 */}
        <p className="mt-3 text-base text-muted-foreground">
          페이지를 불러오는 중 문제가 발생했습니다.
          <br />
          잠시 후 다시 시도해 주세요.
        </p>

        {/* 개발 환경에서만 에러 상세 표시 */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div
            className="mt-6 text-left"
            aria-label="에러 상세 정보 (개발 환경)"
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">
              에러 상세 (개발 환경만 표시):
            </p>
            <pre
              className="bg-slate-100 dark:bg-slate-800 border border-border p-4 rounded-lg text-left text-xs text-foreground overflow-auto max-h-40 whitespace-pre-wrap break-words"
            >
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </div>
        )}

        {/* 액션 버튼 */}
        <div
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
          role="group"
          aria-label="에러 복구 액션"
        >
          {/* 다시 시도 버튼 */}
          <Button
            size="lg"
            onClick={reset}
            aria-label="페이지를 다시 로드합니다"
          >
            다시 시도
          </Button>

          {/* 홈으로 버튼 */}
          <Button
            size="lg"
            variant="outline"
            asChild
          >
            <Link
              href="/"
              aria-label="홈 페이지로 이동합니다"
            >
              홈으로
            </Link>
          </Button>
        </div>

      </div>
    </div>
  )
}
