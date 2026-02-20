/** @type {import('next').NextConfig} */
const nextConfig = {
  // Puppeteer와 Chromium을 serverless 환경에서 사용하도록 설정
  // @sparticuz/chromium: Vercel 최적화 Chromium
  // puppeteer: 브라우저 자동화
  serverExternalPackages: [
    'puppeteer',
    'puppeteer-core',
    '@sparticuz/chromium',
  ],

  // 환경 변수
  env: {
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
  },

  // Turbopack 설정 (Next.js 16에서 기본값)
  turbopack: {},
}

module.exports = nextConfig
