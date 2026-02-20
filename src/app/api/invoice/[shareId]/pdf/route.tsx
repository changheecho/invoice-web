/**
 * API Route: GET /api/invoice/[shareId]/pdf
 *
 * 공유 링크 ID(shareId)로 견적서 데이터를 조회하고
 * react-pdf/renderer를 사용하여 PDF를 생성합니다.
 *
 * @param params.shareId - 공개 공유 링크 ID (nanoid)
 *
 * 처리 흐름:
 * 1. shareId → ShareLink 레코드 조회 (Supabase)
 * 2. notionPageId → Invoice 데이터 조회 (Notion API)
 * 3. Invoice 데이터 → react-pdf Document 렌더링
 * 4. Document → PDF Buffer 생성 (renderToBuffer)
 * 5. PDF Buffer 반환 (Content-Disposition: attachment)
 */
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getShareLinkByShareId } from '@/lib/supabase/share-links'
import { transformToInvoice, extractItemIds } from '@/lib/notion/transform'
import { getInvoiceItems } from '@/lib/notion/items'
import { InvoicePdfDocument } from '@/components/invoice/invoice-pdf-document'
import { buildPdfFilename } from '@/lib/constants'
import { NOTION_API_KEY } from '@/lib/env'
import type { ApiResponse } from '@/types'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

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

    // 3단계: react-pdf/renderer로 PDF 생성
    const filename = buildPdfFilename(invoice.clientName, invoice.invoiceDate)
    const pdfDocument = <InvoicePdfDocument invoice={invoice} />
    const pdfBuffer = await renderToBuffer(pdfDocument)

    // 5단계: PDF 파일명 설정 및 응답 반환
    // 두 가지 형식의 파일명 모두 제공:
    // 1. filename: ASCII 호환 파일명 (구식 브라우저용)
    // 2. filename*: RFC 5987 UTF-8 인코딩된 파일명 (최신 브라우저용)

    // ASCII 호환 파일명 생성 (Invoice_[고객사명]_[날짜] 형식)
    // 클라이언트명을 로마자로 변환 (한글 → "Invoice", 영문은 유지)
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

    // Node.js Buffer → Uint8Array로 변환 (Web API Response 호환)
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
