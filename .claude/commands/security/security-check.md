---
description: '프로젝트의 보안 취약점을 검사하고 개선 방법을 제시하는 종합 보안 점검 커맨드'
allowed-tools:
  [
    'Read',
    'Glob',
    'Grep',
    'Bash(npm:*)',
    'Bash(ls:*)',
    'Edit',
    'AskUserQuestion',
  ]
---

# Claude 명령어: Security Check

프로젝트의 보안 취약점을 종합적으로 검사하고 개선 방법을 제시합니다.

## 사용법

```
/security-check
```

## 주요 기능

1. **자동 보안 스캔**: 프로젝트 전체를 스캔하여 보안 취약점 탐지
2. **우선순위 분류**: Critical, Warning, Info로 위험도 분류
3. **수정 방법 제시**: 각 취약점에 대한 구체적인 해결 방법 안내
4. **대화형 수정**: 사용자 확인 후 코드 자동 수정
5. **상세 주석**: 보안 관련 상세 주석 자동 생성

## 검사 항목

### 🔴 Critical (즉시 수정 필요)

- **Next.js 보안 헤더 미설정**: X-Frame-Options, CSP, X-Content-Type-Options 등
- **환경 변수 하드코딩**: 사이트 URL, API 키 등이 소스 코드에 직접 작성됨
- **XSS 취약점**: dangerouslySetInnerHTML, eval 함수 사용 등
- **npm 패키지 취약점**: npm audit으로 발견된 보안 취약점
- **.env 파일 .gitignore 누락**: 민감한 환경 변수가 깃에 커밋될 위험

### ⚠️ Warning (권장 수정)

- **외부 링크 rel 속성 누락**: target="_blank"에 rel="noopener noreferrer" 미적용
- **API 라우트 인증 미설정**: API 엔드포인트에 인증/권한 검증 부재 (API 존재 시)
- **민감 정보 로깅**: 콘솔에 비밀번호, 토큰 등 로깅
- **CORS 미설정**: 크로스 도메인 요청 제어 부재 (API 존재 시)

### ℹ️ Info (선택적 개선)

- **TypeScript strict 모드 비활성화**: 타입 안정성 강화 권장
- **URL 하드코딩**: robots.ts, sitemap.ts의 URL 환경 변수화
- **Form autoComplete 속성 누락**: 사용성 및 자동완성 기능 개선

## 실행 프로세스

### 1단계: 보안 취약점 검토

프로젝트 전체를 자동으로 스캔하여 보안 취약점을 탐지합니다.

**검사 순서**:
1. 설정 파일 (next.config.ts, .gitignore, tsconfig.json, package.json)
2. 환경 변수 관련 파일 (.env, 하드코딩 검사)
3. 메타데이터 파일 (layout.tsx, robots.ts, sitemap.ts)
4. 컴포넌트 파일 (API 라우트, 보안 패턴 검사)
5. 전역 패턴 검사 (XSS, 외부 링크, 민감 정보 로깅)

### 2단계: 취약점 보고 및 수정 방법 안내

발견된 취약점을 우선순위별로 정리하여 보고합니다.

**보고 형식**:

```
## 보안 점검 결과

### 🔴 Critical (즉시 수정 필요) - N개

1. **Next.js 보안 헤더 미설정**
   - 파일: `next.config.ts`
   - 문제: X-Frame-Options, CSP 등 보안 헤더 미설정
   - 영향: 클릭재킹, XSS 공격에 취약
   - 수정 방법: next.config.ts에 headers() 함수 추가하여 다음 헤더 설정:
     * X-Frame-Options: DENY (클릭재킹 방어)
     * X-Content-Type-Options: nosniff (MIME 스니핑 방지)
     * Referrer-Policy: strict-origin-when-cross-origin
     * Permissions-Policy: camera=(), microphone=(), geolocation=()

2. **메타데이터 URL 하드코딩**
   - 파일: `src/app/layout.tsx:27`, `src/app/robots.ts`, `src/app/sitemap.ts`
   - 문제: 'https://example.com' 하드코딩, 환경 변수 미사용
   - 영향: 배포 환경별 URL 관리 불가, SEO 문제 발생 가능
   - 수정 방법: NEXT_PUBLIC_SITE_URL 환경 변수 사용
     * process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'로 변경

### ⚠️ Warning (권장 수정) - N개
...

### ℹ️ Info (선택적 개선) - N개
...

수정 권장 우선순위: Critical → Warning → Info
```

### 3단계: 사용자 확인 요청

수정 범위를 선택하도록 사용자에게 요청합니다.

```
어떤 취약점을 수정하시겠습니까?

1. Critical만 수정 (즉시 필요한 항목만)
2. Critical + Warning 수정 (권장)
3. 모두 수정 (Critical + Warning + Info)
4. 개별 선택 (각 항목별로 확인)
5. 수정하지 않고 보고서만 받기

선택하세요:
```

### 4단계: 코드 수정 + 상세 주석 추가

선택된 항목에 대해 자동으로 코드를 수정합니다.

모든 보안 수정에는 다음 형식의 상세한 주석이 추가됩니다:

```typescript
/**
 * [보안] 간단한 한 줄 설명
 *
 * @security 보안 카테고리 (XSS, CSRF, Clickjacking, Information Disclosure 등)
 * @issue 해결하려는 보안 문제의 상세 설명
 *        - 어떤 보안 취약점인지
 *        - 왜 문제인지
 *        - 실제 공격 시나리오
 * @reference 관련 공식 문서 및 보안 가이드
 *           - Next.js 공식 문서
 *           - OWASP 보안 가이드
 *           - 관련 보안 표준
 * @updated YYYY-MM-DD
 */
```

#### 주석 예시

**예시 1: Next.js 보안 헤더 설정**

```typescript
/**
 * [보안] Next.js 보안 헤더 설정
 *
 * @security Clickjacking, XSS, MIME Sniffing 방어
 * @issue 웹 애플리케이션의 기본 보안 헤더가 설정되지 않아 다음 보안 위협에 노출됨:
 *        - 클릭재킹(Clickjacking): 투명한 iframe으로 클릭 가로채기
 *        - XSS(Cross-Site Scripting): 악의적인 스크립트 주입
 *        - MIME 스니핑: 잘못된 MIME 타입으로 파일 해석
 * @reference https://nextjs.org/docs/app/api-reference/next-config-js/headers
 * @reference https://owasp.org/www-project-secure-headers/
 * @updated 2026-02-07
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // iframe 사용 금지로 클릭재킹 방어
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // 브라우저가 MIME 타입을 추론하지 않도록 강제
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // 크로스 도메인 요청 시 리퍼러 정보 제한
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()', // 카메라, 마이크, 위치정보 접근 차단
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // XSS 공격 시 페이지 로드 차단 (레거시 브라우저용)
          },
        ],
      },
    ];
  },
};
```

**예시 2: 환경 변수 적용**

```typescript
/**
 * [보안] 환경 변수를 통한 URL 관리
 *
 * @security Information Disclosure 방어
 * @issue 메타데이터 URL이 소스 코드에 하드코딩되어 다음 문제 발생:
 *        - 개발/스테이징/프로덕션 환경별 URL을 일일이 수정해야 함
 *        - 실수로 내부 URL(로컬호스트)이 프로덕션에 배포될 위험
 *        - 환경 변수가 없으면 배포 자동화가 어려움
 * @reference https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 * @updated 2026-02-07
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  // ...
  openGraph: {
    // ...
    url: siteUrl, // 환경별로 자동으로 올바른 URL 사용
  },
};
```

**예시 3: 외부 링크 보안**

```tsx
/**
 * [보안] 외부 링크 rel 속성 추가
 *
 * @security Tabnabbing 공격 방어
 * @issue target="_blank"로 새 탭에서 열리는 외부 링크가 rel 속성 없이 사용되면:
 *        - window.opener 참조로 원본 페이지에 접근 가능
 *        - 악의적인 사이트가 원본 페이지를 피싱 페이지로 변조 가능
 *        - 사용자가 원래 사이트로 돌아왔을 때 피싱 페이지를 보게 됨 (Tabnabbing 공격)
 * @reference https://owasp.org/www-community/attacks/Reverse_Tabnabbing
 * @reference https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
 * @updated 2026-02-07
 */
<a
  href={externalLink}
  target="_blank"
  rel="noopener noreferrer" // noopener: window.opener 차단 / noreferrer: 리퍼러 정보 제거
  className="..."
>
  외부 링크
</a>
```

### 5단계: 수정 결과 요약

수정 완료 후 결과를 요약하여 보고합니다.

```markdown
## 보안 수정 완료

### 수정된 파일 (3개)
1. ✅ `next.config.ts` - 보안 헤더 추가
2. ✅ `src/app/layout.tsx` - 환경 변수 적용
3. ✅ `src/components/layout/footer.tsx` - rel 속성 추가

### 추가 조치 필요
- [ ] `.env.local` 파일 생성하여 `NEXT_PUBLIC_SITE_URL` 설정
  ```
  NEXT_PUBLIC_SITE_URL=https://yourdomain.com
  ```
- [ ] 프로덕션 배포 시 환경 변수 설정 (Vercel, Netlify, AWS 등)
- [ ] README.md에 환경 변수 설정 문서 추가

### 다음 단계
1. `npm run dev`로 개발 서버 시작하여 정상 동작 확인
2. 브라우저 개발자 도구에서 Response Headers 확인
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
3. `/commit` 커맨드로 보안 개선 커밋 생성
   - 커밋 메시지: `🔒️ security: 보안 취약점 수정`
```

## 보안 주석 형식

### 기본 구조

```typescript
/**
 * [보안] 간단한 한 줄 설명
 *
 * @security 보안 카테고리
 * @issue 보안 문제 상세 설명
 * @reference 참고 자료 URL
 * @updated YYYY-MM-DD
 */
```

### 보안 카테고리

- **XSS (Cross-Site Scripting)**: 악성 스크립트 주입 및 실행 방지
- **CSRF (Cross-Site Request Forgery)**: 위조된 요청 방지
- **Clickjacking**: iframe을 통한 클릭 가로채기 방지
- **Injection**: SQL, NoSQL, Command 주입 공격 방지
- **Information Disclosure**: 민감한 정보 노출 방지
- **Authentication**: 사용자 인증 및 검증
- **Authorization**: 권한 기반 접근 제어
- **MIME Sniffing**: MIME 타입 추론 공격 방지
- **Tabnabbing**: 탭 가로채기 공격 방지
- **Data Validation**: 입력 데이터 검증

### @issue 작성 가이드

- **무엇이 문제인가**: 보안 취약점의 정의
- **왜 문제인가**: 왜 이것이 보안 위협이 되는지
- **어떤 영향이 있나**: 공격 성공 시 발생할 수 있는 피해
- **실제 공격 시나리오**: 구체적인 공격 예시 (선택적)

## 예외 처리

의도적으로 남긴 코드는 주석으로 표시하여 검사에서 제외할 수 있습니다:

```typescript
/**
 * @security-ignore XSS
 * @reason 관리자 전용 기능으로 입력 데이터가 이미 서버에서 검증됨
 */
<div dangerouslySetInnerHTML={{ __html: adminContent }} />
```

## 지원 프로젝트 타입

현재 지원:
- ✅ Next.js 정적 사이트 (현재 프로젝트)
- ✅ Next.js + API Routes
- ✅ Next.js + 데이터베이스 (Prisma, Mongoose 등)

## 참고 사항

- 거짓 양성 최소화를 위해 컨텍스트 기반으로 판단
- 자동 수정 전 항상 사용자 확인 요청
- 수정 후에는 `npm run dev`로 정상 동작 확인 권장
- 보안 개선 사항은 별도 커밋으로 관리하여 변경 사항을 명확하게 기록
- 주석은 한국어로 작성하여 팀원 모두가 이해하기 쉽게 함
