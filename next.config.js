/** @type {import('next').NextConfig} */
const nextConfig = {
  // Puppeteer가 serverless 환경에서 작동하도록 설정
  // Vercel에서는 자동으로 /chrome/linux-[VERSION]/chrome-linux/chrome이 제공됨
  serverExternalPackages: ['puppeteer', 'puppeteer-core'],

  // 환경 변수
  env: {
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
  },
}

module.exports = nextConfig
