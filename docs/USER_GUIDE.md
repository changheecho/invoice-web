# Invoice Web MVP 사용자 가이드

> **현재 버전**: 1.0.0 (MVP)
> **최종 수정일**: 2026-02-18
> **지원 대상**: 관리자 및 클라이언트 사용자

---

## 📖 목차

1. [개요](#개요)
2. [사전 준비](#사전-준비)
3. [관리자 가이드](#관리자-가이드)
4. [클라이언트 가이드](#클라이언트-가이드)
5. [배포 방법](#배포-방법)
6. [자주 묻는 질문 (FAQ)](#자주-묻는-질문-faq)

---

## 개요

### Invoice Web이란?

Invoice Web은 **Notion 데이터베이스**에서 관리하는 견적서를 웹에서 조회하고 PDF로 다운로드할 수 있는 경량 SaaS입니다.

### 주요 특징

- ✅ **Notion 연동**: Notion을 단일 진실 공급원으로 활용
- ✅ **로그인 없는 공유**: 클라이언트는 고유 URL로 접근 (로그인 불필요)
- ✅ **PDF 다운로드**: 견적서를 PDF 파일로 다운로드
- ✅ **다크 모드**: 라이트/다크 모드 자동 지원
- ✅ **반응형 디자인**: 모바일/태블릿/데스크톱 모두 지원

### 사용자 역할

| 역할 | 기능 | 접근 방식 |
|------|------|-----------|
| **관리자** | 견적서 목록 조회, 공유 링크 생성, PDF 다운로드 | 로그인 필수 (`/dashboard`) |
| **클라이언트** | 견적서 열람, PDF 다운로드 | 공유 URL로 접근 (로그인 불필요) |

---

## 사전 준비

### 필수 요구사항

1. **Notion 계정**
   - Notion 워크스페이스에 관리자 권한

2. **Supabase 계정**
   - 프리 플랜으로도 충분함
   - PostgreSQL 데이터베이스 자동 포함

3. **호스팅 환경** (배포 시에만)
   - Vercel (추천)
   - 또는 Docker 지원 호스팅 (예: Render, Railway 등)

### 선택 요구사항

- 커스텀 도메인 (예: invoices.yourcompany.com)
- SMTP 메일 서버 (이메일 자동 발송 기능 추가 시)

---

## 관리자 가이드

### 1단계: Notion 설정

#### 1-1. Notion 통합(Integration) 생성

1. [Notion My Integrations](https://www.notion.so/profile/integrations) 접속
2. **"Create new integration"** 클릭
3. 다음 정보 입력:
   - **Name**: `Invoice Web` (또는 선호하는 이름)
   - **Logo**: (선택 사항)
   - **Associated workspace**: 현재 워크스페이스 선택

4. **"Submit"** 클릭
5. 생성된 페이지에서 **"Internal Integration Token"** 복사
   - 이 토큰이 `NOTION_API_KEY`입니다
   - **⚠️ 토큰을 안전하게 보관하세요**

#### 1-2. 견적서 데이터베이스 생성

Notion에서 새 데이터베이스를 생성합니다:

1. Notion 워크스페이스에서 **"+ Add a page"** → **"Database"** → **"Table"** 선택
2. 데이터베이스 이름: **"견적서"** (또는 선호하는 이름)

3. 다음 필드를 추가합니다:

| 필드명 | 타입 | 설명 | 필수 |
|--------|------|------|------|
| **제목** | Title | 견적서 번호 또는 제목 | ✅ |
| **클라이언트명** | Text | 견적서를 받을 고객명 | ✅ |
| **견적 일자** | Date | 견적서 발행 날짜 | ✅ |
| **상태** | Select | 상태 옵션 선택 | ✅ |
| **총 금액** | Number | 견적 총액 (숫자) | ✅ |
| **항목** | Relation | Items 데이터베이스 연결 | ⭕ |
| **만료일** | Date | 견적 유효 기간 | ⭕ |
| **메모** | Text | 내부 메모 | ⭕ |

4. **상태** 필드의 옵션 설정:
   - `대기` (pending)
   - `초안` (draft)
   - `발송` (sent)
   - `확인됨` (confirmed)
   - `완료` (completed)
   - `취소` (cancelled)

#### 1-3. (선택) 항목 데이터베이스 생성

라인 아이템을 별도로 관리하려면:

1. 새 데이터베이스 **"항목"** 생성
2. 다음 필드 추가:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| **항목명** | Title | 제품/서비스명 |
| **수량** | Number | 수량 |
| **단가** | Number | 개당 가격 |
| **소계** | Formula | `prop("수량") * prop("단가")` |
| **견적서** | Relation | 견적서 DB 연결 |

3. 견적서 DB의 **항목** 필드를 이 DB와 연결

#### 1-4. Integration 권한 설정

생성한 Notion 통합에 데이터베이스 접근 권한 부여:

1. 견적서 데이터베이스 열기
2. **"..."** (더보기) → **"+ Add connections"**
3. 생성한 Integration (예: "Invoice Web") 선택 → 체크

### 2단계: Supabase 설정

#### 2-1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com/) 접속 및 로그인
2. **"New Project"** 클릭
3. 프로젝트 정보 입력:
   - **Project Name**: `invoice-web` (또는 선호하는 이름)
   - **Database Password**: 안전한 비밀번호 설정 (자동 생성 가능)
   - **Region**: 가장 가까운 지역 선택

4. **"Create new project"** 클릭 (약 2분 소요)

#### 2-2. 데이터베이스 초기화

1. Supabase 대시보드에서 **"SQL Editor"** 메뉴 열기
2. **"New Query"** 클릭
3. 다음 SQL을 복사하여 붙여넣기:

```sql
-- ShareLink 테이블 생성
CREATE TABLE IF NOT EXISTS share_links (
  id BIGSERIAL PRIMARY KEY,
  notion_page_id TEXT NOT NULL UNIQUE,
  share_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_share_links_share_id ON share_links(share_id);
CREATE INDEX IF NOT EXISTS idx_share_links_notion_page_id ON share_links(notion_page_id);

-- Row Level Security (RLS) 정책 설정
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (누구나 공유 링크로 조회 가능)
CREATE POLICY "Allow public read" ON share_links
  FOR SELECT USING (true);

-- 인증된 사용자만 쓰기 가능 (관리자)
CREATE POLICY "Allow authenticated users to insert" ON share_links
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 서비스 롤 전체 접근 (백엔드)
CREATE POLICY "Allow service role full access" ON share_links
  USING (true) WITH CHECK (true)
  AS PERMISSIVE
  FOR ALL
  TO service_role;
```

4. **"Run"** 버튼 클릭 (실행)

#### 2-3. 관리자 계정 생성

1. Supabase 대시보드에서 **"Authentication"** → **"Users"**
2. **"Create a new user"** 클릭
3. 정보 입력:
   - **Email**: 관리자 이메일 (예: `admin@yourcompany.com`)
   - **Password**: 안전한 비밀번호 설정
   - **Auto Confirm**: 체크 (이메일 인증 생략)

4. **"Create user"** 클릭

#### 2-4. 환경 변수 복사

Supabase 대시보드 **"Project Settings"**에서:

1. **"API"** 탭 열기
2. 다음 정보 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **"Service role secret"** 복사 → `SUPABASE_SERVICE_ROLE_KEY`

### 3단계: 로컬 개발 환경 설정

#### 3-1. 코드 준비

```bash
# 리포지토리 클론
git clone https://github.com/your-repo/invoice-web.git
cd invoice-web

# 의존성 설치
npm install
```

#### 3-2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
# Notion
NOTION_API_KEY=secret_xxxxxxxxxxxx          # Step 1-1에서 복사
NOTION_DATABASE_ID=30b8017e-xxxx-xxxx-xxxx  # Notion DB 고유 ID

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co         # Step 2-4에서 복사
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...                   # Step 2-4에서 복사
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...                       # Step 2-4에서 복사

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000   # 로컬 개발
```

#### Notion 데이터베이스 ID 찾는 방법

1. Notion에서 견적서 DB 열기
2. 브라우저 주소창 URL 확인:
   ```
   https://www.notion.so/workspace/XXXXX?v=YYYYY
   # 여기서 XXXXX가 Database ID입니다.
   ```

#### 3-3. 로컬 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 확인

### 4단계: 견적서 작성 및 테스트

#### 4-1. 첫 견적서 작성

Notion의 견적서 DB에서:

1. **"New"** 버튼 → 새 행 추가
2. 정보 입력:
   - **제목**: "견적서-2026-001"
   - **클라이언트명**: "테스트 클라이언트"
   - **견적 일자**: 2026-02-18
   - **상태**: "발송"
   - **총 금액**: 1,000,000

3. 저장 (Notion이 자동 저장함)

#### 4-2. 관리자 페이지 접속

1. `http://localhost:3000/login` 접속
2. 관리자 계정 로그인:
   - 이메일: Supabase에서 설정한 이메일
   - 비밀번호: 설정한 비밀번호

3. **"대시보드"** 페이지에서 작성한 견적서 확인
4. 견적서 클릭 → 상세 페이지 접속

#### 4-3. 공유 링크 생성 및 복사

1. 상세 페이지에서 **"공유 링크 복사"** 버튼 클릭
2. 토스트 알림으로 "복사되었습니다" 표시 확인
3. 클립보드에 URL 저장됨

#### 4-4. 클라이언트 페이지 테스트

복사한 URL을 **새 Incognito 창**에서 열어 테스트:

1. 로그인 없이 견적서 열람 가능 확인
2. **"PDF 다운로드"** 버튼 클릭
3. 파일 다운로드 확인

---

## 클라이언트 가이드

### 견적서 조회 방법

#### Step 1: 링크 접속

관리자로부터 받은 링크를 클릭하거나 URL 창에 붙여넣기

#### Step 2: 견적서 확인

- 견적서 내용 전체 확인 가능
- **회사 정보**: 상단에 표시
- **항목 목록**: 중간 테이블에 표시
- **총 금액**: 하단에 표시

#### Step 3: PDF 다운로드

1. **"PDF 다운로드"** 버튼 클릭
2. 파일이 자동으로 다운로드됨
   - 파일명: `견적서_[클라이언트명]_[날짜].pdf`
   - 예: `견적서_테스트클라이언트_2026-02-18.pdf`

3. 다운로드한 PDF를 저장 또는 인쇄

### 자주 묻는 질문 (클라이언트)

**Q: 로그인이 필요한가요?**
A: 아니요. 공유받은 링크로 바로 접속 가능합니다.

**Q: 인터넷 연결 없이 볼 수 있나요?**
A: 다운로드한 PDF는 오프라인에서도 볼 수 있습니다.

**Q: 링크가 만료되나요?**
A: 아니요. 생성된 링크는 유효기간이 없습니다 (현재 버전).

---

## 배포 방법

### Vercel을 이용한 배포 (권장)

#### Step 1: GitHub에 코드 푸시

```bash
# GitHub 리포지토리 생성 (GitHub.com)

# 로컬 리포지토리 설정
git remote add origin https://github.com/your-username/invoice-web.git
git branch -M main
git push -u origin main
```

#### Step 2: Vercel 프로젝트 생성

1. [Vercel](https://vercel.com/) 접속
2. **"Add New..."** → **"Project"**
3. GitHub 리포지토리 선택 (`invoice-web`)
4. 프로젝트 설정:
   - **Framework**: Next.js
   - **Root Directory**: `./`
5. **"Deploy"** 클릭

#### Step 3: 환경 변수 설정

Vercel 대시보드 **"Settings"** → **"Environment Variables"**:

```env
NOTION_API_KEY=secret_xxxxxxxxxxxx
NOTION_DATABASE_ID=30b8017e-xxxx-xxxx-xxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app  # Vercel 배포 URL
```

#### Step 4: 재배포

환경 변수 설정 후 자동으로 재배포되거나, 수동으로:

```bash
git commit -m "chore: update environment variables"
git push origin main
```

### 커스텀 도메인 설정 (선택)

1. Vercel 대시보드 **"Settings"** → **"Domains"**
2. **"Add Domain"** → 도메인 입력
3. DNS 레코드 설정 (도메인 제공업체에서)
4. Vercel이 SSL 인증서 자동 발급

---

## 자주 묻는 질문 (FAQ)

### 설정 관련

**Q: Notion API 키는 어디서 찾나요?**
A: [Notion My Integrations](https://www.notion.so/profile/integrations)에서 생성한 Integration의 "Internal Integration Token"을 복사하면 됩니다.

**Q: Notion 데이터베이스 ID는 어디서 찾나요?**
A: Notion에서 데이터베이스를 열었을 때 URL에서 찾을 수 있습니다:
- URL: `https://www.notion.so/workspace/DATABASE_ID?v=VIEW_ID`
- 첫 번째 긴 문자열이 DATABASE_ID입니다.

**Q: Supabase는 비용이 드나요?**
A: 프리 플랜으로 충분합니다. MVP 범위 내에서 무료입니다.

### 기능 관련

**Q: 견적서를 수정하려면?**
A: Notion에서 직접 수정하면 웹에 자동으로 반영됩니다.

**Q: 여러 클라이언트에게 다른 견적서를 공유할 수 있나요?**
A: 네. 각 견적서마다 고유한 공유 링크가 생성됩니다.

**Q: 견적서에서 금액을 숨길 수 있나요?**
A: 현재 버전에서는 불가능합니다 (향후 기능 예정).

### 문제 해결

**Q: "인증이 필요합니다" 오류가 나요.**
A: 관리자 페이지에 로그인하지 않은 상태입니다. `/login`에서 로그인하세요.

**Q: "견적서를 찾을 수 없습니다" 오류가 나요.**
A: 공유 링크가 유효하지 않거나 Notion에서 견적서가 삭제되었을 수 있습니다.

**Q: PDF가 다운로드되지 않아요.**
A: 다음을 확인하세요:
- 브라우저가 최신 버전인지 확인
- 팝업 차단이 해제되어 있는지 확인
- 네트워크 연결 확인

**Q: 한글이 깨져서 보여요.**
A: TTF 폰트 파일이 문제일 수 있습니다. 개발팀에 연락하세요.

### 보안 관련

**Q: API 키가 노출되면?**
A: Supabase 대시보드에서 즉시 새 키를 생성하세요. 환경 변수를 업데이트하면 됩니다.

**Q: 공유 링크가 다른 사람과 공유되면?**
A: 현재 버전에서는 링크를 아는 누구나 접속 가능합니다. 향후 만료일 설정 기능을 추가할 예정입니다.

**Q: 데이터가 안전한가요?**
A: 모든 데이터는 Notion과 Supabase의 보안 서버에 저장됩니다.

---

## 지원

### 기술 지원

- **버그 리포트**: GitHub Issues에 상세히 작성
- **기능 요청**: GitHub Discussions에서 논의
- **문의**: 프로젝트 개발팀에 연락

### 유용한 링크

- [Notion API 문서](https://developers.notion.com/)
- [Supabase 문서](https://supabase.com/docs)
- [Next.js 문서](https://nextjs.org/docs)
- [프로젝트 GitHub](https://github.com/your-repo/invoice-web)

---

**문서 버전**: 1.0.0
**최종 수정일**: 2026-02-18
**작성자**: 개발팀

