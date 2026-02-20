# Puppeteer PDF 생성 배포 가이드

## 개요

이 프로젝트는 Puppeteer를 사용하여 한글을 완벽하게 지원하는 PDF를 생성합니다. 로컬 개발과 Vercel 배포 환경 모두에서 작동합니다.

## 로컬 개발 환경 설정

### 1. 필수 요구사항

- Node.js 18+
- 시스템에 설치된 Chrome/Chromium 브라우저

**Mac:**
```bash
# Chrome이 설치되어 있어야 함
# /Applications/Google Chrome.app 경로에 설치되어 있으면 자동으로 감지됨
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
```

**Windows:**
- Chrome 또는 Chromium이 설치되어 있어야 함
- Puppeteer가 자동으로 감지함

### 2. 환경 변수 설정 (.env.local)

```env
# Puppeteer 설정 (로컬 개발용)
# 시스템 Chrome을 사용하고 Chromium 자동 다운로드 비활성화
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### 3. 로컬 실행

```bash
# 필수 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# PDF 생성 테스트
curl http://localhost:3000/api/invoice/[shareId]/pdf --output test.pdf
```

## Vercel 배포

### 1. 필수 설정

#### next.config.js 확인
```javascript
serverExternalPackages: ['puppeteer', 'puppeteer-core']
```

#### Vercel 환경 변수 설정

Vercel 대시보드 → Project Settings → Environment Variables에서:

```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### 2. 배포 방법

**Option 1: GitHub 연동 (권장)**
```bash
git push origin main  # Vercel이 자동으로 감지하고 배포
```

**Option 2: Vercel CLI**
```bash
npm i -g vercel
vercel deploy
```

### 3. Vercel에서 Puppeteer 동작 원리

Vercel은 serverless 환경에서 Puppeteer가 동작하도록 지원합니다:

1. Vercel 내장 Chromium 사용 (자동 제공)
2. `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` 설정으로 번들 크기 감소
3. Node.js Runtime은 최대 10초 timeout이므로 PDF 생성은 충분히 빨라야 함

### 4. 배포 후 테스트

```bash
# 프로덕션 URL에서 PDF 생성 테스트
curl https://your-domain.com/api/invoice/[shareId]/pdf --output prod-test.pdf
```

## 문제 해결

### 1. "Failed to launch browser"

**원인**: Chrome/Chromium이 설치되어 있지 않거나 경로가 잘못됨

**해결책 (로컬)**:
```bash
# 시스템 Chrome 설치 확인
which google-chrome  # Linux
which chromium  # macOS (Homebrew)
```

**해결책 (Vercel)**:
- `.vercelignore`에 `node_modules/puppeteer/.local-chromium/*` 추가 안 함 (Vercel이 자동 처리)

### 2. "Timeout waiting for navigation"

**원인**: Google Fonts 로드 시간 초과 또는 네트워크 느림

**해결책**:
- `waitUntil: 'networkidle0'` 30초 timeout 확인
- Puppeteer의 `setDefaultNavigationTimeout()` 증가

```typescript
await page.setDefaultNavigationTimeout(40000)  // 40초
```

### 3. 한글이 깨져서 보임

**원인**: Google Fonts CDN이 로드되지 않음

**해결책**:
- 인터넷 연결 확인
- Google Fonts URL이 정상인지 확인: https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700

### 4. PDF 크기가 너무 큼

**원인**: HTML에 불필요한 리소스나 이미지 포함

**해결책**:
- `invoice-html-template.tsx`에서 이미지 제거 또는 최소화
- `printBackground: true` 대신 `printBackground: false` 고려

## 성능 최적화

### 1. Puppeteer 브라우저 인스턴스 재사용

현재 구현 (`generator.ts`):
```typescript
let browserInstance: ... | null = null

async function getBrowser() {
  if (browserInstance) return browserInstance
  // ... 초기화 코드
}
```

싱글톤 패턴으로 브라우저 재사용 → 성능 향상

### 2. 캐싱 고려사항

PDF 생성은 요청마다 새로 생성됩니다. 캐싱이 필요한 경우:

- **Redis 캐싱**: Vercel KV 사용
- **파일 캐싱**: 생성된 PDF를 S3 등에 저장
- **Supabase Storage**: 프로젝트 기존 셋업 활용

### 3. 병렬 처리

현재 구현은 단일 브라우저 인스턴스로 요청을 순차 처리합니다.
대량 요청이 예상되는 경우 브라우저 풀 구현 고려:

```typescript
// 추후 구현 예시
const browserPool = new BrowserPool({ poolSize: 3 })
```

## 모니터링

### Vercel 로그 확인

```bash
vercel logs  # 실시간 로그
```

### 중요 로그 메시지

- `[PDF Generator] Puppeteer 초기화 실패` → 브라우저 실행 실패
- `Failed to compile` → 코드 오류 (배포 전에 로컬에서 `npm run build` 확인)

## 마이그레이션 히스토리

### react-pdf/renderer → Puppeteer

**이전 방식 (react-pdf/renderer)**:
- ❌ 한글 폰트 지원 미흡 (TTF, WOFF2 폰트 등록 복잡)
- ✅ 경량 (~200KB)
- ✅ 설정 간단

**현재 방식 (Puppeteer)**:
- ✅ 한글 완벽 지원 (Google Fonts)
- ⚠️ 용량 큼 (하지만 `serverExternalPackages`로 번들 제외)
- ✅ 실제 브라우저 렌더링

## 파일 구조

```
src/
├── components/
│   └── invoice/
│       ├── invoice-html-template.tsx    # HTML 템플릿 (Google Fonts)
│       └── invoice-pdf-document.tsx     # 사용 중단 (react-pdf/renderer)
├── lib/
│   └── pdf/
│       └── generator.ts                 # Puppeteer 유틸리티
└── app/
    └── api/
        └── invoice/
            └── [shareId]/
                └── pdf/
                    └── route.tsx        # PDF 생성 API
```

## 참고 자료

- [Puppeteer 공식 문서](https://pptr.dev/)
- [Vercel Puppeteer 지원](https://vercel.com/docs/functions/serverless-functions/node-js#chromium)
- [Google Fonts API](https://fonts.google.com/metadata/fonts)
- [Noto Sans KR 폰트](https://fonts.google.com/noto/specimen/Noto+Sans+KR)

## 예상 성능

| 환경 | PDF 생성 시간 | 파일 크기 |
|------|-------------|---------|
| 로컬 | 1-2초 | 50-150KB |
| Vercel | 2-3초 | 50-150KB |

> 첫 요청이 더 오래 걸릴 수 있음 (Cold Start)

---

**마지막 수정**: 2026-02-20
**상태**: ✅ 프로덕션 준비 완료
