import type { NextConfig } from "next";

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
            key: 'X-Content-Type-Options',
            value: 'nosniff', // 브라우저가 MIME 타입을 추론하지 않도록 강제
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY', // iframe 사용 금지로 클릭재킹 방어
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // XSS 공격 시 페이지 로드 차단
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // 크로스 도메인 요청 시 리퍼러 정보 제한
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()', // 카메라, 마이크, 위치정보 접근 차단
          },
        ],
      },
    ];
  },
};

export default nextConfig;
