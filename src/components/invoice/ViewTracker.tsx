'use client'

import { useEffect, useRef } from 'react'

/**
 * 공개 견적서 페이지 조회(View) 트래커
 *
 * Server Component에서 ISR로 캐싱될 경우 조회 기록 API가 매번 호출되지
 * 않는 문제를 방지하기 위해, Client Component 마운트 시점에 API를 호출합니다.
 */
export function ViewTracker({ shareId }: { shareId: string }) {
    const isFetched = useRef(false)

    useEffect(() => {
        if (isFetched.current) return
        isFetched.current = true

        // 조회 기록 저장 (백그라운드 비동기 요청)
        fetch(`/api/invoice/${shareId}/view`, { method: 'POST' }).catch((err) => {
            console.warn('[ViewTracker] 조회 기록 저장 실패:', err)
        })
    }, [shareId])

    return null
}
