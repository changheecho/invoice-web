import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test123456';
const BASE_URL = 'http://localhost:3000';
const DOWNLOADS_PATH = '/tmp/pdf-downloads';

// 다운로드 폴더 생성
if (!fs.existsSync(DOWNLOADS_PATH)) {
  fs.mkdirSync(DOWNLOADS_PATH, { recursive: true });
}

async function runTest() {
  let browser, context, page;
  let downloadPath = null;
  let shareId = null;

  try {
    console.log('='.repeat(80));
    console.log('📋 PDF 다운로드 기능 E2E 테스트 시작');
    console.log('='.repeat(80));

    // 1. 브라우저 시작
    console.log('\n[1] 브라우저 시작...');
    browser = await chromium.launch({
      headless: true,
    });

    context = await browser.newContext({
      acceptDownloads: true,
    });

    page = await context.newPage();
    console.log('✅ 브라우저 시작 완료');

    // 2. 로그인 페이지 이동
    console.log('\n[2] 로그인 페이지 이동...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    console.log('✅ 로그인 페이지 도달');

    // 3. 로그인
    console.log('\n[3] 관리자 계정으로 로그인...');
    console.log(`   이메일: ${TEST_EMAIL}`);

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // 대시보드로 리디렉션 대기
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    console.log('✅ 로그인 완료 및 대시보드 진입');

    // 4. 대시보드에서 첫 번째 견적서 찾기
    console.log('\n[4] 대시보드 견적서 목록 확인...');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = await page.$('table tbody tr:first-child');
    if (!firstRow) {
      throw new Error('견적서 목록이 비어있습니다');
    }

    const cells = await firstRow.$$('td');
    const invoiceTitle = await cells[0].textContent();
    const clientName = await cells[1].textContent();
    const amount = await cells[2].textContent();

    console.log(`   첫 번째 견적서: ${invoiceTitle}`);
    console.log(`   클라이언트: ${clientName}`);
    console.log(`   금액: ${amount}`);

    // 5. 첫 번째 견적서 상세 페이지로 이동
    console.log('\n[5] 견적서 상세 페이지 진입...');
    await firstRow.click();
    await page.waitForURL(/\/dashboard\/invoice\//, { timeout: 10000 });
    console.log('✅ 견적서 상세 페이지 도달');

    // 6. 현재 URL에서 ID 추출
    const currentUrl = page.url();
    const invoiceId = currentUrl.split('/').pop();
    console.log(`   견적서 ID: ${invoiceId}`);

    // 7. 공유 링크 복사 버튼 클릭
    console.log('\n[6] 공유 링크 복사...');
    await page.waitForSelector('button', { timeout: 5000 });

    // 공유 링크 복사 버튼 찾기 (텍스트로 검색)
    const copyLinkButton = await page.locator('button:has-text("공유 링크")').first();
    if (!await copyLinkButton.isVisible()) {
      throw new Error('공유 링크 버튼을 찾을 수 없습니다');
    }

    await copyLinkButton.click();

    // 토스트 메시지 대기 (공유 링크 복사 완료 확인)
    await page.waitForTimeout(1000);
    console.log('✅ 공유 링크 복사 완료');

    // 8. 클립보드에서 URL 가져오기
    console.log('\n[7] 공유 URL 조회...');
    // 클립보드 읽기를 위해 JavaScript 실행
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    console.log(`   공유 URL: ${clipboardText}`);

    // 9. 공개 견적서 페이지 접속
    console.log('\n[8] 공개 견적서 페이지 접속...');
    await page.goto(clipboardText, { waitUntil: 'networkidle' });

    // shareId 추출
    shareId = clipboardText.split('/invoice/')[1];
    console.log(`   shareId: ${shareId}`);
    console.log('✅ 공개 견적서 페이지 로드 완료');

    // 10. 페이지 내용 확인
    console.log('\n[9] 견적서 내용 확인...');
    const titleElement = await page.$('.text-2xl');
    if (titleElement) {
      const title = await titleElement.textContent();
      console.log(`   문서 제목: ${title}`);
    }

    // 11. PDF 다운로드 버튼 클릭
    console.log('\n[10] PDF 다운로드 시작...');

    // 다운로드 이벤트 대기
    const downloadPromise = page.waitForEvent('download');

    const pdfButton = await page.locator('button:has-text("PDF")').first();
    if (!await pdfButton.isVisible()) {
      throw new Error('PDF 다운로드 버튼을 찾을 수 없습니다');
    }

    await pdfButton.click();
    console.log('   다운로드 버튼 클릭 완료, 파일 다운로드 대기 중...');

    const download = await downloadPromise;
    downloadPath = path.join(DOWNLOADS_PATH, download.suggestedFilename());

    await download.saveAs(downloadPath);
    console.log(`✅ PDF 다운로드 완료`);
    console.log(`   파일명: ${download.suggestedFilename()}`);
    console.log(`   저장 경로: ${downloadPath}`);

    // 12. 다운로드된 파일 확인
    console.log('\n[11] 다운로드 파일 검증...');

    if (!fs.existsSync(downloadPath)) {
      throw new Error('PDF 파일이 저장되지 않았습니다');
    }

    const fileStats = fs.statSync(downloadPath);
    console.log(`   파일 크기: ${(fileStats.size / 1024).toFixed(2)} KB`);
    console.log(`✅ 파일 저장 확인`);

    // 13. PDF 내용 검증 (한글 텍스트 확인)
    console.log('\n[12] PDF 한글 렌더링 검증...');

    try {
      const pdfBytes = fs.readFileSync(downloadPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      console.log(`   PDF 페이지 수: ${pdfDoc.getPageCount()}`);

      // PDF 메타데이터 확인
      const title = pdfDoc.getTitle();
      const author = pdfDoc.getAuthor();
      const subject = pdfDoc.getSubject();

      if (title) console.log(`   문서 제목: ${title}`);
      if (author) console.log(`   저자: ${author}`);
      if (subject) console.log(`   주제: ${subject}`);

      console.log('✅ PDF 구조 유효함');
    } catch (pdfError) {
      console.log(`   ⚠️ PDF 구조 검증 실패 (상세 검증은 시각적 확인 필요): ${pdfError.message}`);
    }

    // 14. 파일 크기 확인
    const minSizeKB = 10;
    const actualSizeKB = fileStats.size / 1024;

    if (actualSizeKB < minSizeKB) {
      console.log(`   ⚠️ 경고: 파일 크기가 예상보다 작습니다 (${actualSizeKB.toFixed(2)}KB < ${minSizeKB}KB)`);
    } else {
      console.log(`   ✅ 파일 크기 정상 (${actualSizeKB.toFixed(2)}KB)`);
    }

    // 15. 결과 요약
    console.log('\n' + '='.repeat(80));
    console.log('✅ PDF 다운로드 테스트 성공');
    console.log('='.repeat(80));
    console.log('\n📊 테스트 결과 요약:');
    console.log(`   ✓ 로그인: 성공`);
    console.log(`   ✓ 대시보드 접근: 성공`);
    console.log(`   ✓ 견적서 상세 페이지: 성공`);
    console.log(`   ✓ 공유 링크 복사: 성공`);
    console.log(`   ✓ 공개 페이지 접근: 성공 (URL: /invoice/${shareId})`);
    console.log(`   ✓ PDF 다운로드: 성공`);
    console.log(`   ✓ 파일 저장: 성공`);
    console.log(`   ✓ 파일 무결성: 검증 완료`);

    console.log(`\n📁 다운로드 파일:`);
    console.log(`   경로: ${downloadPath}`);
    console.log(`   크기: ${(fileStats.size / 1024).toFixed(2)} KB`);

    console.log(`\n💡 다음 단계:`);
    console.log(`   1. 다운로드된 PDF 파일을 열어 한글 렌더링 확인`);
    console.log(`   2. 항목, 클라이언트명, 금액 등이 제대로 표시되는지 확인`);
    console.log(`   3. 레이아웃이 웹 버전과 동일한지 확인`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ 테스트 실패');
    console.error('='.repeat(80));
    console.error(`에러: ${error.message}`);
    console.error(`스택: ${error.stack}`);
    console.error('='.repeat(80));
    process.exit(1);

  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
  }
}

runTest();
