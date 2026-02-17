'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * 테마 토글 드롭다운 메뉴 컴포넌트
 *
 * Light, Dark, System 3가지 테마 선택 옵션을 제공합니다.
 * 각 옵션에 해당 아이콘을 표시하여 시각적 피드백을 강화합니다.
 *
 * 접근성 개선:
 * - DropdownMenu로 명확한 선택지 제공
 * - 각 옵션에 설명 텍스트 포함
 * - aria-label을 통한 스크린 리더 지원
 * - 키보드 네비게이션 지원 (라디오버튼 패턴)
 *
 * 사용자 경험:
 * - 시스템 설정 자동 감지 (System 옵션)
 * - 선택한 테마 시각적 표시
 * - 각 옵션에 아이콘으로 직관적 이해 향상
 *
 * @returns 테마 선택 메뉴 버튼
 *
 * @used
 * - src/components/layout/header.tsx (우측 액션 버튼)
 *
 * @example
 * // 헤더에서 사용:
 * <div className="flex items-center space-x-2">
 *   <ThemeToggle />
 *   <MobileNav />
 * </div>
 *
 * @themes
 * - light: 라이트 모드 (밝은 배경, 어두운 텍스트)
 * - dark: 다크 모드 (어두운 배경, 밝은 텍스트)
 * - system: 시스템 설정 따름 (Windows/macOS 설정)
 */
/**
 * 서버/클라이언트 불일치 방지를 위한 마운트 상태 추적 훅
 * useSyncExternalStore를 사용하여 useEffect 없이 SSR/CSR을 안전하게 처리합니다.
 * 서버에서는 false, 클라이언트에서는 true를 반환합니다.
 */
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useIsMounted()

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="테마 메뉴" disabled />
  }

  // 현재 선택된 테마에 맞는 아이콘 표시
  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-[1.2rem] w-[1.2rem]" />
      case 'dark':
        return <Moon className="h-[1.2rem] w-[1.2rem]" />
      case 'system':
        return <Monitor className="h-[1.2rem] w-[1.2rem]" />
      default:
        return <Sun className="h-[1.2rem] w-[1.2rem]" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="테마 선택"
          title="테마 설정"
        >
          {getIcon()}
          <span className="sr-only">테마 메뉴 열기</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>라이트</span>
          {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>다크</span>
          {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>시스템 설정</span>
          {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
