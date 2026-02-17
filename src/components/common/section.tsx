import { cn } from '@/lib/utils'

interface SectionProps {
  children: React.ReactNode
  className?: string
  id?: string
}

/**
 * 섹션 컴포넌트
 * 섹션 상하 여백과 선택적 배경색을 제공하는 래퍼
 */
export function Section({ children, className, id }: SectionProps) {
  return (
    <section
      id={id}
      className={cn('py-12 md:py-20 lg:py-24', className)}
    >
      {children}
    </section>
  )
}
