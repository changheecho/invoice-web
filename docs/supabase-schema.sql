-- Invoice Web MVP - Supabase 데이터베이스 스키마
-- Supabase SQL Editor에서 이 스크립트를 실행하여 테이블을 생성합니다.
-- @updated 2026-02-16

-- ============================================================
-- ShareLink 테이블
-- Notion 페이지 ID와 공개 공유 링크 ID의 매핑 저장
-- ============================================================

CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_page_id TEXT NOT NULL UNIQUE,
  share_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스: share_id로 빠른 조회 (공개 견적서 페이지 접근 시)
CREATE INDEX IF NOT EXISTS idx_share_links_share_id
  ON share_links (share_id);

-- ============================================================
-- Row Level Security (RLS) 설정
-- ============================================================

-- RLS 활성화
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책: 누구나 share_links 조회 가능 (공개 견적서 페이지)
CREATE POLICY "share_links_public_read"
  ON share_links
  FOR SELECT
  TO public
  USING (true);

-- 인증된 사용자 쓰기 정책: 로그인한 사용자는 INSERT/UPDATE/DELETE 가능
CREATE POLICY "share_links_authenticated_write"
  ON share_links
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 서비스 롤 전용 쓰기 정책: Service Role Key로도 INSERT/UPDATE/DELETE 가능
CREATE POLICY "share_links_service_role_write"
  ON share_links
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
