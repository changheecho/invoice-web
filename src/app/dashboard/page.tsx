/**
 * 관리자 견적서 대시보드 페이지
 *
 * Notion 데이터베이스의 견적서 목록을 표시하고
 * 공유 링크 생성 및 상세 페이지 이동 기능을 제공합니다.
 *
 * @protected 이 페이지는 미들웨어(middleware.ts)에 의해 보호됩니다.
 *             인증되지 않은 사용자는 /login으로 리디렉션됩니다.
 */
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '견적서 대시보드 | Invoice Web',
  description: '견적서 목록을 조회하고 관리합니다.',
}

/**
 * 견적서 대시보드 페이지 컴포넌트
 * 클라이언트 인터랙션(공유 링크 복사, 검색 등)은 별도 클라이언트 컴포넌트로 분리 예정
 */
export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">견적서 대시보드</h1>
          <p className="text-muted-foreground mt-1">
            Notion 데이터베이스에서 견적서를 조회하고 관리합니다.
          </p>
        </div>
      </div>

      {/* 견적서 목록 (TODO: DashboardInvoiceList 클라이언트 컴포넌트로 구현) */}
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <p className="text-sm">
          견적서 목록을 불러오는 중입니다...
        </p>
        <p className="text-xs mt-2">
          환경 변수(NOTION_API_KEY, NOTION_DATABASE_ID) 설정 후 사용 가능합니다.
        </p>
      </div>
    </div>
  )
}
