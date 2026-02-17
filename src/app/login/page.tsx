/**
 * 관리자 로그인 페이지
 *
 * Supabase Auth를 사용한 이메일/비밀번호 로그인 페이지입니다.
 * 로그인 성공 시 대시보드(/dashboard)로 리디렉션합니다.
 *
 * @public 인증 불필요. 이미 로그인된 상태면 미들웨어가 대시보드로 리디렉션합니다.
 * @note useSearchParams()를 사용하므로 Suspense 경계가 필요합니다.
 *       이 파일 하단의 LoginPageWrapper에서 Suspense로 감쌉니다.
 */
'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/lib/constants'
import type { LoginFormValues } from '@/types'

// ============================================================
// 폼 유효성 검사 스키마 (Zod)
// ============================================================

/**
 * 로그인 폼 입력 유효성 검사 스키마
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력하세요.')
    .email('올바른 이메일 형식을 입력하세요.'),
  password: z
    .string()
    .min(1, '비밀번호를 입력하세요.')
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
})

// ============================================================
// 컴포넌트
// ============================================================

/**
 * 로그인 폼 내부 컴포넌트 (useSearchParams 사용)
 * Suspense 경계 안에서 렌더링되어야 합니다.
 *
 * React Hook Form + Zod로 폼 상태 및 유효성 검사를 관리합니다.
 * Supabase Auth를 통해 실제 인증을 처리합니다.
 */
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 로그인 후 이동할 경로 (미들웨어가 redirectTo 파라미터를 설정할 수 있음)
  const redirectTo = searchParams.get('redirectTo') || ROUTES.DASHBOARD

  // 서버 에러 상태 (Supabase Auth 에러)
  const [serverError, setServerError] = useState<string | null>(null)

  // React Hook Form 설정
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  /**
   * 로그인 폼 제출 핸들러
   * Supabase Auth signInWithPassword를 호출합니다.
   *
   * @param values - 폼 입력 데이터 (email, password)
   */
  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      // 인증 실패 에러 메시지 한국어로 변환
      if (error.message.includes('Invalid login credentials')) {
        setServerError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else if (error.message.includes('Email not confirmed')) {
        setServerError('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.')
      } else {
        setServerError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
      return
    }

    // 로그인 성공 → 대시보드 또는 원래 접근하려던 페이지로 이동
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">
            Invoice Web
          </CardTitle>
          <CardDescription className="text-center">
            관리자 계정으로 로그인하세요
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* 서버 에러 메시지 */}
            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            {/* 이메일 입력 */}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="email"
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* 비밀번호 입력 */}
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 로그인 페이지 (Next.js 페이지 컴포넌트)
 *
 * useSearchParams()를 사용하는 LoginForm을 Suspense로 감싸
 * Next.js 정적 생성 에러를 방지합니다.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
