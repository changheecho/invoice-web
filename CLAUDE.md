# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개요

Next.js 16 기반의 모던 웹 스타터킷입니다. TypeScript, TailwindCSS v4, shadcn/ui를 활용한 프로덕션 레디 프로젝트입니다.

## 주요 기술 스택

- **Framework**: Next.js 16.1 (App Router)
- **언어**: TypeScript 5
- **스타일링**: TailwindCSS 4, class-variance-authority
- **UI 컴포넌트**: shadcn/ui (Radix UI 기반)
- **테마**: next-themes (라이트/다크 모드)
- **아이콘**: Lucide React
- **폰트**: Geist (Next.js 최적화 폰트)

## 개발 명령어

```bash
# 개발 서버 실행 (localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물 실행
npm start

# 린트 검사
npm run lint
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── layout.tsx         # 루트 레이아웃 (Header, Footer, ThemeProvider)
│   ├── page.tsx           # 홈페이지
│   ├── examples/          # 예제 페이지
│   ├── robots.ts          # robots.txt 생성
│   ├── sitemap.ts         # sitemap.xml 생성
│   └── globals.css        # 글로벌 스타일 (TailwindCSS)
├── components/
│   ├── ui/                # shadcn/ui 컴포넌트 (Button, Input, Dialog 등)
│   ├── layout/            # 레이아웃 컴포넌트 (Header, Footer, MobileNav)
│   ├── sections/          # 페이지 섹션 (Hero, Features, CTA)
│   ├── common/            # 공통 컴포넌트 (Container, Section)
│   ├── theme/             # 테마 관련 컴포넌트 (ThemeToggle)
│   └── examples/          # 예제 컴포넌트 (FormSection)
├── providers/             # React Context Providers (ThemeProvider)
├── lib/
│   ├── constants.ts       # 앱 전체 상수
│   ├── constants/         # 카테고리별 상수 파일
│   └── utils.ts           # 유틸리티 함수 (cn() - className 병합)
├── hooks/                 # 커스텀 React 훅 (useScroll 등)
└── types/                 # TypeScript 타입 정의
```

## 핵심 아키텍처 패턴

### 1. 클라이언트/서버 컴포넌트 분리

- **Server Components** (기본값): 대부분의 컴포넌트
  - 데이터 페칭, 보안 정보 처리에 사용
  - `src/app/` 페이지 컴포넌트
  - 레이아웃 컴포넌트

- **Client Components** (`'use client'`):
  - `ThemeProvider` - next-themes 사용 (브라우저 상호작용)
  - 향후 상호작용 추가 시 필요에 따라 마킹

### 2. 디렉토리 구조 컨벤션

- **UI 컴포넌트** (`components/ui/`): shadcn/ui에서 복사한 재사용 가능한 저수준 컴포넌트
  - Button, Input, Dialog, Card, Label, Badge, Tooltip 등
  - 스타일 기반의 조합 가능한 컴포넌트

- **도메인 컴포넌트** (`components/sections/`, `components/layout/`): 페이지 구성용 고수준 컴포넌트
  - 스타일이 포함된 비즈니스 로직 컴포넌트
  - 한 번만 사용하거나 특정 페이지에서만 재사용

- **공통 컴포넌트** (`components/common/`): 여러 곳에서 재사용되는 보조 컴포넌트
  - Container, Section 같은 레이아웃 래퍼

### 3. 스타일링 시스템

- **Tailwind CSS**: 유틸리티 기반 스타일링
- **className 병합**: `cn()` 함수 사용 (lib/utils.ts)
  - `clsx` + `tailwind-merge` 조합
  - 조건부 스타일과 Tailwind 클래스 충돌 방지
- **CSS 변수**: `components.json`의 `cssVariables: true` 설정
  - 테마 색상이 CSS 변수로 정의됨

### 4. 테마 시스템

- **next-themes** 라이브트 사용
- `attribute="class"` - html 요소의 class 속성으로 테마 관리
- `defaultTheme="system"` - 시스템 설정 따름
- TailwindCSS의 `dark:` 프리픽스로 다크모드 스타일 정의

### 5. shadcn/ui 통합

- `components.json`에서 설정된 경로로 컴포넌트 설치
- `icons`: Lucide React
- `baseColor`: neutral (회색 기반 테마)
- 설치된 컴포넌트는 프로젝트 소유 - 커스터마이징 가능

## 주요 파일 역할

### src/lib/

- **constants.ts**: 전체 앱에서 사용하는 상수 (네비게이션, 기능 목록 등)
- **constants/**: 카테고리별 상수 분류
- **utils.ts**: `cn()` 함수만 포함 - className 병합 유틸리티

### src/providers/

- **ThemeProvider**: next-themes를 래핑한 테마 프로바이더
  - 모든 다크모드 기능을 담당

### src/hooks/

- **use-scroll.ts**: 스크롤 감지 훅 (헤더 배경색 변경 등에 사용)

### src/app/

- **layout.tsx**:
  - 루트 레이아웃
  - Header와 Footer를 모든 페이지에 적용
  - ThemeProvider로 감싸서 다크모드 지원
  - Font 로딩 설정

- **globals.css**:
  - Tailwind 기본 지시어 포함
  - CSS 변수 정의 (테마 색상)
  - 글로벌 스타일

## 코드 작성 가이드

### 컴포넌트 작성 시

1. **타입 정의**: Props 인터페이스 명시
2. **주석**: 컴포넌트 목적을 JSDoc 스타일로 작성
3. **className**: `cn()` 함수로 조건부 클래스 병합
4. **접근성**: Form 요소에 `autoComplete`, `aria-*` 속성 추가

### Tailwind 클래스 작성 시

```tsx
// 좋은 예: cn() 사용으로 충돌 방지
className={cn(
  'px-4 py-2 rounded-md',
  variant === 'primary' && 'bg-blue-500 text-white',
  variant === 'secondary' && 'bg-gray-200 text-black'
)}

// 피해야 할 것: 동적 클래스명
className={`px-4 py-2 bg-${color}-500`} // ❌ Tailwind가 인식 못함
```

### 다크모드 지원

```tsx
// TailwindCSS dark: 프리픽스 사용
<div className="bg-white dark:bg-slate-950 text-black dark:text-white">
  {children}
</div>
```

## 주의사항

### shadcn/ui 컴포넌트 커스터마이징

- `components/ui/` 파일은 프로젝트 소유
- 필요시 자유롭게 수정 가능 (라이브러리 컴포넌트가 아님)
- 원본 shadcn/ui 컴포넌트 스타일은 재사용성을 위해 최소한으로 유지

### 새로운 shadcn/ui 컴포넌트 추가

```bash
# shadcn-ui CLI로 컴포넌트 추가
npx shadcn-ui@latest add [component-name]
```

### 성능 최적화

- Server Components 기본 사용 (클라이언트 JS 최소화)
- 필요한 부분만 `'use client'` 마킹
- Image 최적화 (next/image 사용)
- Dynamic imports (필요시 코드 분할)

## Playwright MCP 설정

- `.mcp.json`에 Playwright MCP 서버 설정
- 웹 애플리케이션 자동화 테스트 및 오류 수집 가능
- Claude Code에서 브라우저 자동화 기능 활용 가능

## TypeScript 설정

- **strict mode**: 활성화 (tsconfig.json)
- **Path alias**: `@/*` → `./src/*` (절대 경로 사용)
- **Node types**: `@types/node`, `@types/react` 포함

# Project Context
- PRD 문서: @docs/PRD.md
- 개발 로드맵: @docs/ROADMAP.md
