/**
 * API Route: GET /api/invoice/[shareId]/pdf
 *
 * 공유 링크 ID(shareId)로 견적서 데이터를 조회하고
 * pdfkit을 사용하여 한글을 완벽히 지원하는 PDF를 생성합니다.
 *
 * @param params.shareId - 공개 공유 링크 ID (nanoid)
 *
 * 처리 흐름:
 * 1. shareId → ShareLink 레코드 조회 (Supabase)
 * 2. notionPageId → Invoice 데이터 조회 (Notion API)
 * 3. Invoice 데이터 → pdfkit PDFDocument로 렌더링
 * 4. PDFDocument → PDF Buffer 생성
 * 5. PDF Buffer 반환 (Content-Disposition: attachment)
 */
import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { getShareLinkByShareId } from '@/lib/supabase/share-links'
import { transformToInvoice, extractItemIds } from '@/lib/notion/transform'
import { getInvoiceItems } from '@/lib/notion/items'
import { buildPdfFilename } from '@/lib/constants'
import { NOTION_API_KEY } from '@/lib/env'
import type { ApiResponse } from '@/types'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import type { Invoice, InvoiceItem } from '@/types'

/**
 * PDF 생성 및 다운로드 핸들러
 *
 * @param _request - Next.js 요청 객체 (미사용)
 * @param params.shareId - 공유 링크 ID (URL 파라미터)
 * @returns PDF 파일 스트림 (application/pdf)
 * @returns 404 - 공유 링크 또는 견적서를 찾을 수 없는 경우
 * @returns 500 - PDF 생성 오류
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params

  if (!shareId) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: '공유 ID가 필요합니다.' },
      { status: 400 }
    )
  }

  try {
    // 1단계: shareId로 ShareLink 레코드 조회
    const shareLink = await getShareLinkByShareId(shareId)

    if (!shareLink) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '유효하지 않은 공유 링크입니다.' },
        { status: 404 }
      )
    }

    // 2단계: Notion에서 견적서 상세 데이터 조회 (fetch 사용)
    const response = await fetch(`https://api.notion.com/v1/pages/${shareLink.notionPageId}`, {
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
      },
    })

    if (!response.ok) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '견적서 데이터를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const page = await response.json() as PageObjectResponse

    if (!('properties' in page)) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '견적서 데이터를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    let invoice = transformToInvoice(page)

    // Items Relation ID 추출 및 조회
    const itemIds = extractItemIds(page)
    if (itemIds.length > 0) {
      const items = await getInvoiceItems(itemIds, shareLink.notionPageId)
      invoice = { ...invoice, items }
    } else {
      const items = await getInvoiceItems([], shareLink.notionPageId)
      if (items.length > 0) {
        invoice = { ...invoice, items }
      }
    }

    // 3단계: pdfkit으로 PDF 생성
    const pdfBuffer = await generatePdfBuffer(invoice)

    // 4단계: PDF 파일명 설정 및 응답 반환
    const filename = buildPdfFilename(invoice.clientName, invoice.invoiceDate)

    // ASCII 호환 파일명 생성 (Invoice_[고객사명]_[날짜] 형식)
    const asciiClientName = invoice.clientName
      .replace(/[가-힣]/g, '') // 한글 제거
      .trim() || 'Invoice' // 결과가 비어있으면 'Invoice' 사용
    const asciiFilename = `Invoice_${asciiClientName}_${invoice.invoiceDate}.pdf`
      .replace(/\s+/g, '_') // 공백을 언더스코어로 변경
      .replace(/[^\w\-.]/g, '_') // 특수문자를 언더스코어로 변경

    // RFC 5987 준수: filename*=UTF-8''... 형식으로 UTF-8 인코딩
    const rfc5987Filename = Buffer.from(filename, 'utf8')
      .toString('binary')
      .split('')
      .map(char => {
        const code = char.charCodeAt(0)
        // 허용된 문자 (RFC 5987): ALPHA / DIGIT / "!" / "#" / "$" / "&" / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
        if (/^[A-Za-z0-9!#$&+\-.^_`|~]$/.test(char)) {
          return char
        }
        // 그 외 문자는 percent-encoding (각 바이트를 %XX로)
        return '%' + code.toString(16).toUpperCase().padStart(2, '0')
      })
      .join('')

    // Buffer를 Uint8Array로 변환 (Web API Response 호환)
    const uint8Array = new Uint8Array(pdfBuffer)

    return new Response(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        // RFC 6266 준수: filename (ASCII용) + filename* (UTF-8용)
        // 브라우저는 filename*를 우선하고, 미지원 시 filename 사용
        'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${rfc5987Filename}`,
        'Content-Length': String(pdfBuffer.length),
      },
    })
  } catch (error) {
    console.error(`[API] /api/invoice/${shareId}/pdf 오류:`, error)

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: 'PDF 생성 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

/**
 * 한글을 완벽히 지원하는 PDF Buffer 생성
 * pdfkit 라이브러리를 사용하여 시스템 폰트로 한글 렌더링
 *
 * @param invoice - 견적서 데이터
 * @returns PDF 파일 Buffer
 */
async function generatePdfBuffer(invoice: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      bufferPages: true,
      margin: 40,
      size: 'A4',
    })

    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    doc.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    doc.on('error', (error: Error) => {
      reject(error)
    })

    try {
      // 시스템 폰트 설정 (macOS는 AppleSDGothicNeo, Linux/Windows는 기본 폰트)
      const fontName = process.platform === 'darwin' ? 'AppleSDGothicNeo' : 'Courier'

      // 페이지 배경색 (화이트)
      doc.fillColor('#FFFFFF').rect(0, 0, doc.page.width, doc.page.height).fill()

      // 제목
      doc.fillColor('#000000').font(fontName, 18).text('견적서', { align: 'center' })
      doc.moveDown(0.5)

      // 구분선
      doc.strokeColor('#CCCCCC').lineWidth(1).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke()
      doc.moveDown(0.5)

      // 회사 정보 섹션
      doc.fontSize(10).font(fontName).fillColor('#666666')
      doc.text('발급사: 회사명')
      doc.text(`발급일: ${invoice.invoiceDate || 'N/A'}`)
      doc.moveDown(1)

      // 클라이언트 정보
      doc.fillColor('#000000').fontSize(11).font(fontName, 'bold')
      doc.text('견적 대상', { underline: true })
      doc.fontSize(10).font(fontName).fillColor('#000000')
      doc.text(`고객사: ${invoice.clientName}`)
      doc.moveDown(0.8)

      // 항목 테이블 헤더
      const tableTop = doc.y
      const colWidths = {
        item: 250,
        quantity: 70,
        price: 70,
        subtotal: 90,
      }
      const headerHeight = 20

      // 헤더 배경색
      doc.fillColor('#F5F5F5').rect(40, tableTop, doc.page.width - 80, headerHeight).fill()

      // 헤더 텍스트
      doc.fillColor('#000000').fontSize(10).font(fontName, 'bold')
      doc.text('항목명', 40, tableTop + 5, { width: colWidths.item })
      doc.text('수량', 40 + colWidths.item, tableTop + 5, {
        width: colWidths.quantity,
        align: 'right',
      })
      doc.text('단가', 40 + colWidths.item + colWidths.quantity, tableTop + 5, {
        width: colWidths.price,
        align: 'right',
      })
      doc.text('합계', 40 + colWidths.item + colWidths.quantity + colWidths.price, tableTop + 5, {
        width: colWidths.subtotal,
        align: 'right',
      })

      doc.y = tableTop + headerHeight

      // 항목 행
      let totalAmount = 0
      const items = invoice.items || []

      doc.fontSize(9).font(fontName).fillColor('#000000')
      items.forEach((item: InvoiceItem) => {
        const quantity = Number(item.quantity) || 0
        const unitPrice = Number(item.unitPrice) || 0
        const subtotal = quantity * unitPrice
        totalAmount += subtotal

        const rowHeight = 20
        doc.text(item.name || '항목', 40, doc.y, { width: colWidths.item, height: rowHeight })
        doc.text(quantity.toString(), 40 + colWidths.item, doc.y, {
          width: colWidths.quantity,
          align: 'right',
          height: rowHeight,
        })
        doc.text(unitPrice.toLocaleString('ko-KR'), 40 + colWidths.item + colWidths.quantity, doc.y, {
          width: colWidths.price,
          align: 'right',
          height: rowHeight,
        })
        doc.text(subtotal.toLocaleString('ko-KR'), 40 + colWidths.item + colWidths.quantity + colWidths.price, doc.y, {
          width: colWidths.subtotal,
          align: 'right',
          height: rowHeight,
        })

        doc.y += rowHeight
      })

      // 합계 섹션
      doc.moveDown(0.5)
      doc.strokeColor('#CCCCCC').lineWidth(1).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke()
      doc.moveDown(0.5)

      doc.fontSize(12).font(fontName, 'bold').fillColor('#000000')
      const totalPrice = invoice.totalAmount || totalAmount
      doc.text(`총 금액: ${totalPrice.toLocaleString('ko-KR')} 원`, {
        align: 'right',
      })

      // 메모 섹션 (있으면)
      if (invoice.notes) {
        doc.moveDown(1)
        doc.fontSize(9).font(fontName).fillColor('#666666')
        doc.text('메모:', { underline: true })
        doc.fontSize(9).fillColor('#000000')
        doc.text(invoice.notes)
      }

      // PDF 생성 완료
      doc.end()
    } catch (error) {
      doc.end()
      reject(error)
    }
  })
}
