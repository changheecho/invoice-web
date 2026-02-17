import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { APP_URL } from "./env"

/**
 * className을 병합하고 충돌을 해결하는 유틸리티
 *
 * clsx로 조건부 클래스 문자열을 생성한 후
 * tailwind-merge로 Tailwind CSS 클래스 충돌을 자동으로 해결합니다.
 *
 * @param inputs - className 문자열, 객체, 배열
 * @returns 병합된 className 문자열
 *
 * @example
 * cn('px-4', isActive && 'bg-blue-500', { 'text-white': true })
 * // => 'px-4 bg-blue-500 text-white'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * 문자열을 지정된 길이로 절단하는 유틸리티
 *
 * @param text - 원본 문자열
 * @param length - 절단할 길이
 * @param suffix - 절단 후 붙일 접미사 (기본값: '...')
 * @returns 절단된 문자열
 *
 * @example
 * truncate('Hello, World!', 8)
 * // => 'Hello, W...'
 *
 * truncate('Hello', 10)
 * // => 'Hello'
 */
export function truncate(text: string, length: number, suffix: string = '...'): string {
  if (text.length <= length) {
    return text
  }
  return text.slice(0, length) + suffix
}

/**
 * 상대 경로를 절대 URL로 변환하는 유틸리티
 *
 * SITE_URL과 상대 경로를 결합하여 완전한 URL을 생성합니다.
 * 외부 URL이나 절대 경로가 전달되면 그대로 반환합니다.
 *
 * @param path - 상대 경로 (예: '/about', 'https://example.com')
 * @returns 절대 URL
 *
 * @example
 * absoluteUrl('/about')
 * // => 'https://example.com/about'
 *
 * absoluteUrl('https://external.com')
 * // => 'https://external.com'
 */
export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return new URL(path, APP_URL).toString()
}

/**
 * 날짜를 지정된 형식으로 포맷하는 유틸리티
 *
 * @param date - 포맷할 날짜 (Date 객체 또는 ISO 문자열)
 * @param format - 날짜 형식 (기본값: 'yyyy-mm-dd')
 *   - 'yyyy-mm-dd': 2026-02-07
 *   - 'dd/mm/yyyy': 07/02/2026
 *   - 'full': 2026년 2월 7일
 * @returns 포맷된 날짜 문자열
 *
 * @example
 * formatDate(new Date('2026-02-07'))
 * // => '2026-02-07'
 *
 * formatDate(new Date('2026-02-07'), 'full')
 * // => '2026년 2월 7일'
 */
export function formatDate(
  date: Date | string,
  format: 'yyyy-mm-dd' | 'dd/mm/yyyy' | 'full' = 'yyyy-mm-dd'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')

  switch (format) {
    case 'yyyy-mm-dd':
      return `${year}-${month}-${day}`
    case 'dd/mm/yyyy':
      return `${day}/${month}/${year}`
    case 'full':
      return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`
    default:
      return `${year}-${month}-${day}`
  }
}
