/**
 * Puppeteer 기반 PDF 생성 유틸리티
 *
 * Google Fonts를 사용하여 한글을 완벽하게 지원하는 PDF 생성 함수를 제공합니다.
 */

import puppeteer from 'puppeteer'

/**
 * Puppeteer 브라우저 인스턴스 (싱글톤)
 */
let browserInstance: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

/**
 * Puppeteer 브라우저 인스턴스를 가져옵니다.
 * 로컬 개발과 Vercel 배포 모두에서 작동합니다.
 *
 * 로컬 개발: `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` 설정하고 시스템 Chrome 사용
 * Vercel: Vercel 내장 Chromium 사용
 *
 * @returns Puppeteer 브라우저 인스턴스
 */
async function getBrowser() {
  if (browserInstance) {
    return browserInstance
  }

  try {
    // Vercel 배포 환경 또는 로컬 시스템 Chrome
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined

    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Vercel 배포 메모리 제한 대응
      ],
    })

    return browserInstance
  } catch (error) {
    console.error('[PDF Generator] Puppeteer 초기화 실패:', error)
    throw new Error('PDF 생성 환경을 초기화할 수 없습니다.')
  }
}

/**
 * HTML 문자열을 PDF Buffer로 변환합니다.
 *
 * @param htmlContent - HTML 문자열
 * @returns PDF Buffer
 *
 * @example
 * const html = '<html>...</html>'
 * const pdfBuffer = await htmlToPdf(html)
 */
export async function htmlToPdf(htmlContent: string): Promise<Buffer> {
  let page = null

  try {
    const browser = await getBrowser()
    page = await browser.newPage()

    // HTML 콘텐츠 로드
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0', // 네트워크 요청이 모두 완료될 때까지 대기 (Google Fonts 로드)
      timeout: 30000, // 30초 타임아웃
    })

    // PDF 생성 (A4 용지, 마진 0)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0',
        bottom: '0',
        left: '0',
        right: '0',
      },
      printBackground: true,
    })

    return pdfBuffer as Buffer
  } catch (error) {
    console.error('[PDF Generator] PDF 생성 실패:', {
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined,
    })

    throw new Error('PDF 생성에 실패했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    if (page) {
      try {
        await page.close()
      } catch (error) {
        console.warn('[PDF Generator] 페이지 종료 중 에러:', error)
      }
    }
  }
}

/**
 * @deprecated invoiceToPdf는 더 이상 사용되지 않습니다.
 * 대신 API 라우트에서 generateInvoiceHtml()과 htmlToPdf()를 직접 사용하세요.
 */
export async function invoiceToPdf(): Promise<Buffer> {
  throw new Error('invoiceToPdf는 더 이상 지원되지 않습니다. generateInvoiceHtml + htmlToPdf를 사용하세요.')
}

/**
 * 브라우저 인스턴스를 종료합니다.
 * 서버 셧다운 시에만 호출하세요.
 */
export async function closeBrowser() {
  if (browserInstance) {
    try {
      await browserInstance.close()
      browserInstance = null
    } catch (error) {
      console.error('[PDF Generator] 브라우저 종료 중 에러:', error)
    }
  }
}
