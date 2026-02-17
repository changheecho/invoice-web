# Invoice Web MVP

Notion 데이터베이스와 연동하여 견적서를 웹에서 조회하고, PDF 다운로드 및 링크 공유 기능을 제공하는 시스템입니다.

## 기술 스택

- **Framework**: Next.js 16.1 (App Router)
- **언어**: TypeScript 5
- **스타일링**: TailwindCSS v4 + shadcn/ui
- **인증**: Supabase Auth
- **데이터베이스**: Supabase (PostgreSQL) - ShareLink 테이블
- **데이터 소스**: Notion API (@notionhq/client v5)
- **PDF 생성**: react-pdf/renderer
- **폼 관리**: React Hook Form + Zod
- **배포**: Vercel

## 주요 기능

- Notion 데이터베이스 실시간 견적서 조회
- 견적서 웹 뷰어 (반응형, 다크모드 지원)
- PDF 생성 및 다운로드 (한글 지원)
- 공유 링크 생성 (비로그인 클라이언트 접근)
- 관리자 인증 (Supabase Auth 이메일/비밀번호)

## 시작하기

### 1. 의존성 설치

\`\`\`bash
npm install
\`\`\`

### 2. 환경 변수 설정

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

`.env.local`을 열고 실제 값을 입력합니다:

| 변수명 | 설명 |
|--------|------|
| `NEXT_PUBLIC_APP_URL` | 앱 배포 URL (로컬: http://localhost:3000) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 롤 키 (서버 전용) |
| `NOTION_API_KEY` | Notion 통합 시크릿 키 (서버 전용) |
| `NOTION_DATABASE_ID` | Notion 견적서 데이터베이스 ID |

### 3. Supabase 데이터베이스 설정

Supabase SQL Editor에서 `docs/supabase-schema.sql` 스크립트를 실행합니다.

### 4. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 개발 명령어

\`\`\`bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm start        # 빌드 결과물 실행
npm run lint     # ESLint 검사
\`\`\`

## 프로젝트 구조

\`\`\`
src/
├── app/
│   ├── api/
│   │   ├── notion/
│   │   │   ├── invoices/route.ts        # GET: 견적서 목록
│   │   │   └── invoice/[id]/route.ts    # GET: 견적서 상세
│   │   └── invoice/
│   │       └── [shareId]/pdf/route.ts   # GET: PDF 생성
│   ├── dashboard/
│   │   ├── layout.tsx                   # 대시보드 레이아웃
│   │   ├── page.tsx                     # 견적서 목록
│   │   └── invoice/[id]/page.tsx        # 관리자용 상세
│   ├── invoice/
│   │   └── [shareId]/page.tsx           # 클라이언트용 공개 견적서
│   ├── login/page.tsx                   # 로그인 페이지
│   └── page.tsx                         # 홈 페이지
├── components/
│   ├── invoice/
│   │   └── invoice-pdf-document.tsx     # PDF 문서 컴포넌트
│   ├── layout/
│   │   ├── header.tsx                   # 대시보드 헤더
│   │   └── footer.tsx                   # 푸터
│   └── ui/                              # shadcn/ui 컴포넌트
├── lib/
│   ├── notion/
│   │   ├── client.ts                    # Notion API 클라이언트
│   │   └── transform.ts                 # Notion → 앱 타입 변환
│   ├── supabase/
│   │   ├── client.ts                    # 브라우저 클라이언트
│   │   ├── server.ts                    # 서버 클라이언트
│   │   └── share-links.ts               # ShareLink CRUD
│   ├── constants.ts                     # 라우트, 상수 정의
│   ├── env.ts                           # 환경 변수 관리
│   └── utils.ts                         # cn() 등 유틸리티
├── middleware.ts                         # 인증 보호 미들웨어
├── providers/
│   └── theme-provider.tsx               # 다크모드 Provider
└── types/
    └── index.ts                         # TypeScript 타입 정의
\`\`\`

## Notion 데이터베이스 필드 구조

| 필드명 | 타입 | 설명 |
|--------|------|------|
| Title (제목) | Title | 견적서 제목 |
| Client Name (클라이언트명) | Text | 클라이언트명 |
| Invoice Date (견적 일자) | Date | 견적 발행 날짜 |
| Status (상태) | Select | 초안/발송됨/확인됨/완료/취소됨 |
| Total Amount (총 금액) | Number | 총 견적 금액 |
| Items (항목) | Text | JSON 형식 항목 배열 |
| Due Date (만료일) | Date | 만료일 (선택) |
| Notes (메모) | Text | 내부 메모 (선택) |

Items 필드 JSON 형식 예시:
\`\`\`json
[
  {"name": "웹사이트 개발", "quantity": 1, "unitPrice": 3000000, "subtotal": 3000000},
  {"name": "유지보수", "quantity": 12, "unitPrice": 100000, "subtotal": 1200000}
]
\`\`\`

## 문서

- [PRD (제품 요구사항 문서)](docs/PRD.md)
- [Supabase 스키마](docs/supabase-schema.sql)
