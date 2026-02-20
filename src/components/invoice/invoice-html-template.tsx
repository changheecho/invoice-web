/**
 * 견적서 HTML 템플릿 (Puppeteer PDF 생성용)
 *
 * Google Fonts Noto Sans KR을 사용하여 한글을 완벽하게 렌더링합니다.
 * 이 컴포넌트는 React 컴포넌트가 아니며, 순수 HTML 문자열을 반환합니다.
 */

import type { Invoice } from '@/types'
import { INVOICE_STATUS_LABELS, CURRENCY_FORMAT } from '@/lib/constants'

/**
 * 금액을 한국 원화 형식으로 포맷합니다.
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', CURRENCY_FORMAT).format(amount)
}

/**
 * 날짜 문자열을 'YYYY-MM-DD' 형식으로 포맷합니다.
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  } catch {
    return dateString
  }
}

/**
 * Invoice 데이터를 HTML 문자열로 변환합니다.
 * Puppeteer가 이 HTML을 PDF로 렌더링합니다.
 *
 * @param invoice - 렌더링할 Invoice 데이터
 * @returns HTML 문자열
 */
export function generateInvoiceHtml(invoice: Invoice): string {
  const statusLabel = INVOICE_STATUS_LABELS[invoice.status] || '미정'

  // 상태별 색상 정의
  const statusColors: Record<string, string> = {
    pending: '#10b981', // 초록색
    draft: '#6b7280', // 회색
    sent: '#3b82f6', // 파랑색
    confirmed: '#8b5cf6', // 보라색
    completed: '#059669', // 진한 초록색
    cancelled: '#ef4444', // 빨강색
  }

  const statusColor = statusColors[invoice.status] || '#6b7280'

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${invoice.title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1f2937;
          background: white;
        }

        .container {
          max-width: 8.5in;
          height: 11in;
          margin: 0 auto;
          padding: 40pt 40pt;
          background: white;
          position: relative;
        }

        /* 헤더 */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32pt;
          padding-bottom: 16pt;
          border-bottom: 2pt solid #1f2937;
        }

        .header-left h1 {
          font-size: 24pt;
          font-weight: 700;
          margin-bottom: 4pt;
        }

        .header-left p {
          font-size: 10pt;
          color: #6b7280;
        }

        .header-right {
          text-align: right;
        }

        .meta-label {
          font-size: 8pt;
          color: #6b7280;
          margin-bottom: 2pt;
          text-transform: uppercase;
          letter-spacing: 0.5pt;
        }

        .meta-value {
          font-size: 10pt;
          margin-bottom: 6pt;
        }

        .status-badge {
          display: inline-block;
          padding: 3pt 8pt;
          background-color: ${statusColor};
          color: white;
          border-radius: 4pt;
          font-size: 9pt;
          font-weight: 700;
          margin-top: 8pt;
        }

        /* 클라이언트 정보 */
        .client-section {
          margin-bottom: 24pt;
        }

        .section-label {
          font-size: 9pt;
          color: #6b7280;
          margin-bottom: 4pt;
          text-transform: uppercase;
          letter-spacing: 0.5pt;
          font-weight: 700;
        }

        .client-name {
          font-size: 14pt;
          font-weight: 700;
          margin-bottom: 2pt;
        }

        .client-details {
          font-size: 10pt;
          color: #4b5563;
        }

        /* 항목 테이블 */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24pt;
        }

        .items-table thead {
          background-color: #f9fafb;
          border-top: 1pt solid #e5e7eb;
          border-bottom: 1pt solid #e5e7eb;
        }

        .items-table th {
          padding: 8pt;
          text-align: left;
          font-weight: 700;
          color: #374151;
          font-size: 9pt;
        }

        .items-table th.col-qty,
        .items-table th.col-price,
        .items-table th.col-subtotal {
          text-align: right;
        }

        .items-table td {
          padding: 8pt;
          border-bottom: 1pt solid #f3f4f6;
          font-size: 9pt;
        }

        .items-table td.col-qty,
        .items-table td.col-price,
        .items-table td.col-subtotal {
          text-align: right;
        }

        .items-table tbody tr:hover {
          background-color: #f9fafb;
        }

        /* 합계 섹션 */
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 32pt;
        }

        .totals {
          min-width: 200pt;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4pt;
          font-size: 10pt;
        }

        .total-row .label {
          flex: 1;
          padding-right: 16pt;
          color: #6b7280;
        }

        .total-row .value {
          min-width: 80pt;
          text-align: right;
        }

        .grand-total-row {
          display: flex;
          justify-content: space-between;
          padding-top: 8pt;
          border-top: 2pt solid #1f2937;
          margin-top: 4pt;
          font-size: 12pt;
          font-weight: 700;
        }

        .grand-total-row .label {
          flex: 1;
          padding-right: 16pt;
        }

        .grand-total-row .value {
          min-width: 80pt;
          text-align: right;
        }

        /* 메모 섹션 */
        .notes-section {
          background-color: #f9fafb;
          padding: 12pt;
          border-radius: 4pt;
          margin-bottom: 24pt;
        }

        .notes-section .label {
          font-size: 9pt;
          color: #6b7280;
          margin-bottom: 4pt;
          text-transform: uppercase;
          letter-spacing: 0.5pt;
          font-weight: 700;
        }

        .notes-section p {
          font-size: 9pt;
          color: #4b5563;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        /* 푸터 */
        .footer {
          position: absolute;
          bottom: 30pt;
          left: 40pt;
          right: 40pt;
          text-align: center;
          color: #9ca3af;
          font-size: 8pt;
          border-top: 1pt solid #e5e7eb;
          padding-top: 8pt;
        }

        /* 항목 없음 */
        .empty-items {
          padding: 16pt 8pt;
          text-align: center;
          color: #9ca3af;
          font-size: 9pt;
        }

        /* 유틸리티 */
        .col-name {
          width: 50%;
        }

        .col-qty {
          width: 10%;
          text-align: right;
        }

        .col-price {
          width: 20%;
          text-align: right;
        }

        .col-subtotal {
          width: 20%;
          text-align: right;
        }

        /* 인쇄 최적화 */
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 100%;
            height: 100%;
            margin: 0;
            padding: 40pt 40pt;
            page-break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- 헤더 -->
        <div class="header">
          <div class="header-left">
            <h1>견적서</h1>
            <p>${invoice.title}</p>
          </div>
          <div class="header-right">
            <div class="meta-label">견적 일자</div>
            <div class="meta-value">${formatDate(invoice.invoiceDate)}</div>
            ${
              invoice.dueDate
                ? `
              <div class="meta-label">만료일</div>
              <div class="meta-value">${formatDate(invoice.dueDate)}</div>
            `
                : ''
            }
            <div class="status-badge">${statusLabel}</div>
          </div>
        </div>

        <!-- 클라이언트 정보 -->
        <div class="client-section">
          <div class="section-label">수신</div>
          <div class="client-name">${invoice.clientName}</div>
        </div>

        <!-- 항목 테이블 -->
        <table class="items-table">
          <thead>
            <tr>
              <th class="col-name">항목명</th>
              <th class="col-qty">수량</th>
              <th class="col-price">단가</th>
              <th class="col-subtotal">소계</th>
            </tr>
          </thead>
          <tbody>
            ${
              invoice.items && invoice.items.length > 0
                ? invoice.items
                    .map(
                      (item) => `
                  <tr>
                    <td class="col-name">${item.name}</td>
                    <td class="col-qty">${item.quantity}</td>
                    <td class="col-price">${formatCurrency(item.unitPrice)}</td>
                    <td class="col-subtotal">${formatCurrency(item.subtotal)}</td>
                  </tr>
                `
                    )
                    .join('')
                : '<tr><td colspan="4" class="empty-items">항목 정보가 없습니다.</td></tr>'
            }
          </tbody>
        </table>

        <!-- 합계 -->
        <div class="totals-section">
          <div class="totals">
            <div class="grand-total-row">
              <div class="label">총 금액</div>
              <div class="value">${formatCurrency(invoice.totalAmount)}</div>
            </div>
          </div>
        </div>

        <!-- 메모 -->
        ${
          invoice.notes
            ? `
          <div class="notes-section">
            <div class="label">메모</div>
            <p>${invoice.notes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
        `
            : ''
        }

        <!-- 푸터 -->
        <div class="footer">
          본 견적서는 자동 생성된 문서입니다. 문의사항은 발신자에게 연락하세요.
        </div>
      </div>
    </body>
    </html>
  `
}
