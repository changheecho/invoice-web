# Invoice Web - 프로젝트 개발 규칙

> **최종 수정일**: 2026-02-18
> **기준**: CLAUDE.md + docs/PRD.md v1.1.0 + docs/ROADMAP.md v2.0.0
> **목적**: AI Agent용 프로젝트 특정 규칙 (개발자 문서가 아님)

---

## 프로젝트 개요

### 목표
Notion 데이터베이스에 작성된 견적서를 웹에서 조회하고 PDF로 다운로드할 수 있는 경량 SaaS MVP 구축.

### 핵심 가치
- **Notion 단일 진실 공급원**: 별도 CMS 불필요, 항상 최신 데이터 보장
- **클라이언트 로그인 불필요**: 고유 URL로 비로그인 견적서 열람
- **간단한 아키텍처**: ShareLink 테이블 최소화 (notionPageId ↔ shareId만 저장)
- **Vercel 완전 호환**: react-pdf/renderer로 서버사이드 PDF 생성

### 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.x |
| Styling | TailwindCSS + shadcn/ui | v4 |
| Auth | Supabase Auth | 2.95.x |
| Database | PostgreSQL (Supabase) | - |
| Data Source | Notion API | @notionhq/client v5.9.0 |
| PDF | @react-pdf/renderer | 4.3.2 |
| Forms | React Hook Form + Zod | 7.x / 4.x |

---

## 프로젝트 아키텍처

### 디렉토리 구조 (핵심만)

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # 루트 레이아웃 (Header, Footer, ThemeProvider)
│   ├── login/page.tsx                # 로그인 페이지 (Supabase Auth)
│   ├── dashboard/                    # 관리자 전용 (미들웨어 보호)
│   │   ├── page.tsx                  # 견적서 목록 대시보드
│   │   └── invoice/[id]/page.tsx     # 견적서 상세 (관리자)
│   ├── invoice/[shareId]/page.tsx    # 공개 견적서 페이지 (비로그인)
│   └── api/                          # API Routes (서버사이드만)
│       ├── notion/
│       │   ├── invoices/route.ts     # GET: 견적서 목록
│       │   └── invoice/[id]/route.ts # GET: 견적서 상세
│       └── invoice/
│           └── [shareId]/pdf/route.ts# GET: PDF 생성
├── components/                       # React 컴포넌트
│   ├── ui/                           # shadcn/ui 컴포넌트 (Button, Card 등)
│   ├── invoice/                      # 견적서 관련 컴포넌트
│   │   ├── InvoiceViewer.tsx         # 웹 뷰어 (Server)
│   │   ├── InvoiceActions.tsx        # PDF/링크 버튼 (Client)
│   │   └── invoice-pdf-document.tsx  # PDF 문서 구조
│   ├── layout/                       # 레이아웃 (Header, Footer)
│   └── theme/                        # 테마 관련 (ThemeToggle)
├── lib/
│   ├── env.ts                        # 환경 변수 검증
│   ├── constants.ts                  # 상수 정의
│   ├── utils.ts                      # cn() - className 병합
│   ├── notion/
│   │   ├── client.ts                 # Notion API 클라이언트
│   │   └── transform.ts              # Notion → 내부 타입 변환
│   └── supabase/
│       ├── client.ts                 # Supabase 클라이언트 (공개용)
│       ├── server.ts                 # Supabase 서버 (보안)
│       └── share-links.ts            # ShareLink CRUD
├── hooks/                            # 커스텀 React 훅
├── types/                            # TypeScript 타입 정의
│   └── index.ts                      # 중앙 집중식 타입 (Invoice, InvoiceSummary 등)
└── middleware.ts                     # Next.js 미들웨어 (인증)

public/
├── fonts/                            # 폰트 파일
│   ├── NotoSansKR-Regular.ttf        # 한글 Regular (PDF용)
│   └── NotoSansKR-Bold.ttf           # 한글 Bold (PDF용)
```

### 데이터 흐름

```
관리자 플로우:
[로그인] → (Supabase Auth)
  ↓
[대시보드] → /api/notion/invoices (Notion API 호출)
  ↓
[공유 링크 생성] → getOrCreateShareLink() → Supabase INSERT/UPSERT
  ↓
[링크 복사] → URL: https://domain.com/invoice/[shareId]

클라이언트 플로우:
[공유 URL 접속] → /invoice/[shareId]
  ↓
[공개 페이지] → getShareLinkByShareId() → 유효성 검증
  ↓
[견적서 렌더링] → /api/notion/invoice/[notionPageId] (비밀번호 안 사용)
  ↓
[PDF 다운로드] → /api/invoice/[shareId]/pdf (react-pdf/renderer)
```

### 핵심 모듈 책임 분할

| 모듈 | 책임 | 특징 |
|------|------|------|
| `notion/client.ts` | Notion API 호출 | 서버사이드만, 재시도 로직 포함 |
| `notion/transform.ts` | 필드명 변환 | 한글/영문 양방향 폴백 |
| `supabase/share-links.ts` | ShareLink CRUD | nanoid 자동 생성, UPSERT 중복 방지 |
| `api/notion/*` | 데이터 조회 API | 모든 요청을 재검증, 캐싱 가능 |
| `components/invoice/*` | UI 렌더링 | 공통 컴포넌트, 다크모드 지원 |

---

## 코드 표준

### 명명 규칙

**필수 규칙**:
- **파일명**: kebab-case (예: `invoice-viewer.tsx`, `share-links.ts`)
- **변수/함수**: camelCase (예: `getInvoices()`, `shareId`)
- **상수**: UPPER_SNAKE_CASE (예: `DEFAULT_TIMEOUT`)
- **타입/인터페이스**: PascalCase (예: `Invoice`, `InvoiceSummary`)
- **컴포넌트**: PascalCase (예: `InvoiceViewer`)

**절대 하면 안 되는 것**:
- 변수명에 숫자 시작 (`2023data` ❌)
- 동적 클래스명 구성 (`bg-${color}-500` ❌)
- 약자 사용 (`getTxList` ❌, `getTransactionList` ✅)
- 단일 문자 변수 (`i`, `x` ❌, 루프 제외)

### 타입 정의

**모든 함수는 입출력 타입 명시**:
```typescript
// ✅ 좋음
async function getInvoices(): Promise<InvoiceSummary[]>
function transformNotionData(data: unknown): Invoice

// ❌ 나쁨
async function getInvoices() // 반환 타입 없음
function transformNotionData(data: any) // any 사용
```

**중앙 집중식 타입**: `src/types/index.ts`에 모든 주요 타입 정의
```typescript
// ✅ 좋음
import { Invoice, InvoiceSummary } from '@/types'

// ❌ 나쁨
import { Invoice } from '@/lib/notion/types'
import { InvoiceSummary } from '@/app/api/types'
```

### 주석 규칙

**필수**:
- 모든 클래스 및 함수에 주석 (한국어)
- 복잡한 로직에 라인별 설명

**형식**:
```typescript
/**
 * Notion 데이터베이스에서 모든 견적서를 조회한다.
 * @returns 견적서 목록 배열
 * @throws {NotionError} API 오류 시
 */
async function getInvoices(): Promise<InvoiceSummary[]>
```

**절대 하면 안 되는 것**:
- 자명한 코드의 설명 (`const id = 1; // id 설정`)
- 주석으로 된 코드 삭제 (`// const old = ...`)
- 영문 주석 (프로젝트 규칙상 한국어 필수)

---

## 기능 구현 표준

### Server Components vs Client Components

**Server Components (기본값)**:
- 모든 페이지 컴포넌트
- 데이터 조회 함수
- API Routes

**Client Components ('use client')**:
- 상호작용 필요 (버튼 클릭 등)
- 상태 관리 (useState, useRef)
- 브라우저 API 사용 (localStorage, clipboard)
- 이벤트 리스너

**예제**:
```typescript
// ✅ Server Component
// src/app/dashboard/page.tsx
export default async function DashboardPage() {
  const invoices = await getInvoices() // 서버사이드 데이터 조회
  return <DashboardContent invoices={invoices} />
}

// ✅ Client Component (Server에서만 사용)
'use client'
export function DashboardContent({ invoices }: Props) {
  const [filtered, setFiltered] = useState(invoices)
  // ...
}

// ❌ 나쁨: Server에서 useState 사용
export default async function Page() {
  const [data, setData] = useState([]) // 불가능
}
```

### API Routes 책임 범위

**각 API Route의 책임**:

| 엔드포인트 | 책임 | 주의사항 |
|-----------|------|---------|
| `/api/notion/invoices` | Notion API 호출 + 변환 | 클라이언트 API 키 절대 노출 금지 |
| `/api/notion/invoice/[id]` | 개별 견적서 조회 | Items 필드 JSON 파싱 필수 |
| `/api/invoice/[shareId]/pdf` | PDF 생성 + 다운로드 | Node.js Runtime 명시, TTF 폰트만 사용 |

**필수 구현**:
```typescript
// ✅ API Route 기본 구조
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 입력값 검증
    if (!params.id) {
      return NextResponse.json(
        { error: '아이디가 필요합니다' },
        { status: 400 }
      )
    }

    // 2. 서버사이드 처리
    const data = await getInvoiceById(params.id)
    if (!data) {
      return NextResponse.json(
        { error: '견적서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 3. 응답 반환
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
```

### Notion 데이터 처리

**필수 원칙**:
1. **필드명 양방향 대응**: `transform.ts`에서 한글/영문 폴백 처리
2. **에러 스로우 금지**: 필드 누락 시 기본값 사용
3. **JSON 파싱**: Items 필드는 반드시 try-catch로 보호

**예제**:
```typescript
// ✅ 폴백 처리 (필드 누락해도 크래시 안 함)
const title = properties['Title']?.title?.[0]?.plain_text
  ?? properties['제목']?.title?.[0]?.plain_text
  ?? '제목 없음'

// ❌ 에러 스로우 (위험)
const title = properties['Title'].title[0].plain_text // 필드 없으면 크래시

// ✅ JSON 파싱 (try-catch)
let items = []
try {
  items = JSON.parse(properties['Items']?.rich_text?.[0]?.plain_text ?? '[]')
} catch {
  items = [] // 파싱 실패해도 빈 배열 사용
}
```

### 인증 및 보안

**필수**:
- 모든 관리자 API (`/dashboard/*`, `/api/invoice/[shareId]/pdf`)에 `getUser()` 호출
- Notion API Key는 서버사이드만 사용
- Supabase Service Role Key는 절대 클라이언트 번들에 포함 금지

**예제**:
```typescript
// ✅ 보호된 API Route
export async function POST(request: Request) {
  const supabase = createServerClient() // 서버용
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  // 인증된 사용자만 진행
}

// ❌ Notion API Key 노출
export const runtime = 'nodejs'
const apiKey = process.env.NOTION_API_KEY // 클라이언트에 노출 가능
```

### UI 컴포넌트 작성

**shadcn/ui 우선 사용**:
```typescript
// ✅ shadcn/ui 사용
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// ❌ 직접 구현 (shadcn/ui로 충분하면)
const CustomButton = styled.button`...`
```

**다크모드 필수 지원**:
```typescript
// ✅ 다크모드 지원
<div className="bg-white dark:bg-slate-950 text-black dark:text-white">
  콘텐츠
</div>

// ❌ 라이트 모드만
<div className="bg-white text-black">콘텐츠</div>
```

**로딩 상태**:
```typescript
// ✅ Suspense + Skeleton
<Suspense fallback={<InvoiceSkeleton />}>
  <InvoiceContent />
</Suspense>

// ❌ 로딩 표시 없음
<InvoiceContent />
```

---

## 외부 라이브러리 사용 표준

### Notion API

**사용 패턴**:
```typescript
// ✅ 올바른 사용
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const response = await notion.databases.query({
  database_id: process.env.NOTION_DATABASE_ID,
})

// ❌ 잘못된 패턴
const response = await notion.dataSources.query() // v5 미지원
```

**필수 검증 사항**:
- `@notionhq/client` v5.9.0 API 호환성 (메서드 변경 주의)
- Rate Limit: 초당 3회 요청 제한 → 수동 새로고침으로 제어

### Supabase

**서버/클라이언트 분리**:
```typescript
// ✅ 클라이언트 (공개 정보만)
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ✅ 서버 (민감 정보)
import { createServerClient } from '@supabase/ssr'
const supabase = createServerClient(
  cookies().getAll()
)
```

### react-pdf/renderer

**필수 제약**:
- TTF 폰트만 지원 (woff2 불가)
- 폰트는 `public/fonts/*.ttf`에만 저장
- Node.js Runtime 필수: `export const runtime = 'nodejs'`

```typescript
// ❌ woff2 사용 금지 (PDF 생성 실패)
const fontUrl = 'https://fonts.gstatic.com/...woff2'

// ✅ TTF 사용
const fontUrl = `${process.env.NEXT_PUBLIC_APP_URL}/fonts/NotoSansKR-Regular.ttf`
```

---

## 워크플로우 표준

### 인증 플로우

```
1. 사용자 로그인
   ↓ (이메일/비밀번호)
2. Supabase Auth 검증
   ↓
3. JWT 토큰 생성 (자동)
   ↓
4. httpOnly 쿠키 저장
   ↓
5. Middleware가 쿠키 검증
   ↓
6. getUser()로 현재 사용자 확인
```

**구현**:
- 로그인: `signInWithPassword()`
- 로그아웃: `signOut()`
- 보호: `middleware.ts` + `getUser()` 검증

### 견적서 조회 플로우

```
1. 관리자 대시보드 진입
   ↓
2. getInvoices() 호출 (Notion API)
   ↓
3. 필드명 변환 (transform.ts)
   ↓
4. InvoiceSummary[] 반환
   ↓
5. UI 렌더링 (테이블/카드)
```

**캐싱 전략** (Stage 4 이후):
- 초기: 캐싱 없음 (수동 새로고침)
- 향후: Vercel KV 또는 메모리 캐싱 (Rate Limit 대응)

### 공유 링크 생성 플로우

```
1. "공유 링크 복사" 버튼 클릭
   ↓
2. getOrCreateShareLink(notionPageId) 호출
   ↓
3. 기존 레코드 있으면 반환, 없으면 생성
   ↓
4. shareId 포함 URL 생성
   ↓
5. 클립보드에 복사
   ↓
6. Toast 알림 표시
```

**구현 시 주의**:
- nanoid 중복 방지 (UPSERT 사용)
- `NEXT_PUBLIC_APP_URL` 환경 변수 필수

---

## 핵심 파일 상호작용 표준

### 새로운 필드 추가 시

1. **Notion 데이터베이스에 필드 추가**
2. **`src/types/index.ts`에 타입 추가**
   ```typescript
   export interface Invoice {
     // ...
     newField: string // 새 필드
   }
   ```
3. **`src/lib/notion/transform.ts`에 변환 로직 추가** (양방향 폴백)
4. **`src/components/invoice/InvoiceViewer.tsx`에 UI 추가**
5. **PDF 문서(`invoice-pdf-document.tsx`)에도 동일 필드 추가**

### 새로운 API Route 추가 시

1. **`src/app/api/[domain]/[resource]/route.ts` 파일 생성**
2. **요청/응답 타입 `src/types/index.ts`에 추가**
3. **필요 시 에러 처리 강화**
4. **관리자 전용이면 `getUser()` 검증 추가**

### 새로운 컴포넌트 추가 시

1. **`src/components/[category]/ComponentName.tsx` 생성**
2. **타입 명시 + 주석 필수**
3. **다크모드 지원 추가** (모든 배경색/텍스트색에 `dark:` 클래스)
4. **Suspense/로딩 상태 고려**

---

## AI 의사결정 기준

### 우선순위 결정 트리

```
상황: 구현 방법이 여럿 있을 때

1. "Notion에서 데이터를 조회해야 하는가?"
   YES → 서버사이드 API Route 필수 (client.ts 사용)
   NO  → 다음으로

2. "사용자 상호작용이 필요한가?" (클릭, 입력 등)
   YES → Client Component 필수 ('use client')
   NO  → Server Component (기본값)

3. "UI 컴포넌트인가?"
   YES → shadcn/ui 우선 선택
   NO  → 유틸리티 함수

4. "에러 가능성이 있는가?"
   YES → try-catch + 사용자 피드백 (Toast)
   NO  → 기본 에러 처리만
```

### 에러 처리 원칙

**필드 누락**:
```typescript
// ✅ 기본값으로 폴백
const value = data.field ?? defaultValue

// ❌ 에러 스로우 (MVP에서 금지)
const value = data.field // null이면 크래시
```

**네트워크 에러**:
```typescript
// ✅ 재시도 + 사용자 피드백
try {
  const data = await fetchData()
} catch (error) {
  toast.error('데이터 조회 실패. 다시 시도해주세요.')
}

// ❌ 침묵 실패
try {
  const data = await fetchData()
} catch (error) {
  // 아무것도 안 함
}
```

**인증 오류**:
```typescript
// ✅ 로그인 페이지로 리디렉션
if (!user) {
  return redirect('/login')
}

// ❌ 에러 메시지만 표시
if (!user) {
  return <div>접근 권한 없음</div>
}
```

### 성능 최적화 우선순위

1. **Server Components 기본** (클라이언트 JS 최소화)
2. **필요한 부분만 Client Components** ('use client')
3. **이미지 최적화** (`next/image` 사용)
4. **동적 Import** (코드 분할 필요 시)

---

## 금지된 행동

### 절대 하면 안 되는 것들

| 항목 | 이유 | 대안 |
|------|------|------|
| Notion API Key 클라이언트 노출 | 보안 위험 | 항상 서버사이드만 사용 |
| woff2 폰트 PDF 사용 | PDF 생성 실패 | TTF 파일 사용 (public/fonts/) |
| 에러를 throw만 함 | UX 악화 | try-catch + Toast 피드백 |
| 동적 클래스명 | Tailwind 미인식 | cn() + 정적 클래스 조합 |
| any 타입 | 타입 안전성 상실 | unknown + 타입가드 사용 |
| 하드코딩된 환경값 | 배포 실패 | 항상 process.env 사용 |
| 영문 주석 | 프로젝트 규칙 위반 | 한국어 주석 필수 |
| 로직 없는 컴포넌트 | 유지보수 어려움 | 명확한 책임 분할 |
| `npm install` 없이 추가 | 의존성 관리 실패 | package.json에서 설치 |
| `.env.local` 깃 커밋 | 민감 정보 유출 | .gitignore 확인 |

### 코드 리뷰 체크리스트

새 기능 구현 시 반드시 확인:

- [ ] 모든 함수에 입출력 타입 명시
- [ ] 모든 함수/클래스에 한국어 주석
- [ ] Notion 데이터 처리에 필드명 양방향 폴백
- [ ] 에러는 사용자에게 Toast로 피드백
- [ ] 다크모드 지원 (dark: 클래스)
- [ ] 로딩 상태 Suspense 처리
- [ ] API Key/민감 정보 로그 제거
- [ ] TypeScript strict mode 준수
- [ ] 불필요한 의존성 추가 안 함

---

## 환경 변수 필수 항목

### 개발 환경 (.env.local)

```bash
# Notion
NOTION_API_KEY=secret_xxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 필수 조건

- `NOTION_API_KEY`: Notion Integration 생성 필수
- `NOTION_DATABASE_ID`: Notion 데이터베이스 ID
- `SUPABASE_*`: Supabase 프로젝트 필수
- `NEXT_PUBLIC_APP_URL`: 공유 링크 URL 생성에 사용

**누락 시**:
- 서버 시작 실패 또는 기능 오류
- `src/lib/env.ts`의 검증 에러 메시지 확인

---

## 개발 단계별 주의사항

### Stage 1-2 (환경 설정, 공통 모듈)

- [ ] Notion API v5 `databases.query()` 메서드 확인
- [ ] Supabase `share_links` 테이블 생성 완료
- [ ] 환경 변수 `.env.local` 설정 완료

### Stage 3 (핵심 기능)

- [ ] `InvoiceViewer` 컴포넌트 다크모드 지원
- [ ] 대시보드 검색/필터링 SearchParams 기반
- [ ] 공유 링크 복사 클립보드 API 사용

### Stage 4 (PDF 생성)

- **⚠️ 필수**: `public/fonts/NotoSansKR-Regular.ttf` 파일 존재 확인
- [ ] TTF 파일 프로젝트 빌드에 포함 확인
- [ ] PDF 한글 렌더링 테스트 필수

### Stage 5 (배포)

- [ ] `.env.local` `.gitignore` 포함 최종 확인
- [ ] `npm run build` 로컬 검증 완료
- [ ] Vercel 환경 변수 모두 입력 확인
- [ ] Supabase RLS 정책 프로덕션 적용 확인

---

## 버전 정보

| 항목 | 버전 | 비고 |
|------|------|------|
| 문서 버전 | 1.0.0 | 프로젝트 표준 규칙 초안 |
| Next.js | 16.1.6 | App Router 필수 |
| TypeScript | 5.x | strict mode 활성화 |
| @notionhq/client | 5.9.0 | v5 API 호환성 필수 |
| react-pdf/renderer | 4.3.2 | TTF 폰트 지원 |

---

**문서 작성일**: 2026-02-18
**기준 문서**: CLAUDE.md, PRD.md v1.1.0, ROADMAP.md v2.0.0
**담당 범위**: Invoice Web MVP 전체 기능
**대상 대상**: AI Coding Agent (Claude Code)
