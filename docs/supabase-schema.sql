-- Invoice Web MVP - Supabase 데이터베이스 스키마
-- Supabase SQL Editor에서 이 스크립트를 실행하여 테이블을 생성합니다.
-- @updated 2026-02-21

-- ============================================================
-- ShareLink 테이블
-- Notion 페이지 ID와 공개 공유 링크 ID의 매핑 저장
-- ============================================================

CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_page_id TEXT NOT NULL UNIQUE,
  share_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  view_count INT NOT NULL DEFAULT 0,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ
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

-- ============================================================
-- InvoiceView 테이블 (Post-MVP Phase 2)
-- 공개 견적서 페이지 조회 기록 저장
-- ============================================================

CREATE TABLE IF NOT EXISTS invoice_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id TEXT NOT NULL REFERENCES share_links(share_id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewer_ip TEXT,
  user_agent TEXT
);

-- 인덱스: share_id로 빠른 조회
CREATE INDEX IF NOT EXISTS idx_invoice_views_share_id
  ON invoice_views (share_id);

-- RLS 활성화
ALTER TABLE invoice_views ENABLE ROW LEVEL SECURITY;

-- 공개 INSERT 정책: 누구나 조회 기록 저장 가능 (공개 견적서 페이지)
CREATE POLICY "invoice_views_public_insert"
  ON invoice_views
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 인증된 사용자 SELECT 정책: 로그인한 사용자만 조회 기록 조회 가능 (관리자 대시보드)
CREATE POLICY "invoice_views_authenticated_read"
  ON invoice_views
  FOR SELECT
  TO authenticated
  USING (true);

-- 서비스 롤 전용 정책: Service Role Key로 모든 작업 가능
CREATE POLICY "invoice_views_service_role_all"
  ON invoice_views
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
