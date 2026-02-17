/**
 * Invoice Web 푸터 컴포넌트
 *
 * 공개 견적서 페이지 하단에 표시되는 간단한 푸터입니다.
 *
 * @used
 * - src/app/invoice/[shareId]/page.tsx
 */

/**
 * 공개 페이지용 간소화된 푸터 컴포넌트
 */
export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto px-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Invoice Web. 모든 권리 보유.
        </p>
      </div>
    </footer>
  )
}
