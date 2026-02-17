/**
 * 루트 레이아웃
 *
 * 모든 페이지에 공통으로 적용되는 최상위 레이아웃입니다.
 * ThemeProvider로 감싸 다크모드를 지원하며,
 * Geist 폰트를 전역에 적용합니다.
 */
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/providers/theme-provider'
import { APP_URL } from '@/lib/env'
import './globals.css'

/** Geist Sans 폰트 - 본문 텍스트용 */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

/** Geist Mono 폰트 - 코드/숫자 표시용 */
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

/**
 * 앱 기본 메타데이터
 * 각 페이지에서 generateMetadata()로 오버라이드 가능합니다.
 */
export const metadata: Metadata = {
  title: {
    default: 'Invoice Web',
    template: '%s | Invoice Web',
  },
  description: 'Notion 연동 견적서 관리 및 공유 시스템',
  openGraph: {
    title: 'Invoice Web',
    description: 'Notion 연동 견적서 관리 및 공유 시스템',
    url: APP_URL,
    siteName: 'Invoice Web',
    locale: 'ko_KR',
    type: 'website',
  },
}

/**
 * 루트 레이아웃 컴포넌트
 *
 * @param children - 하위 페이지 컴포넌트
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        {/* ThemeProvider: next-themes 기반 다크/라이트 모드 지원 */}
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
