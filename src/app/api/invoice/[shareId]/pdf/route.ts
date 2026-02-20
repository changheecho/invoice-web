/**
 * PDF 다운로드 API (POST)
 *
 * 클라이언트에서 생성한 PDF Blob을 받아서
 * Content-Disposition 헤더로 한글 파일명을 설정하여 응답합니다.
 * 이 방법이 모든 브라우저에서 한글 파일명을 정상 지원합니다.
 */

import { NextResponse } from 'next/server'

/**
 * PDF 다운로드 API
 * POST /api/invoice/[shareId]/pdf
 *
 * Request Body:
 * {
 *   pdfBase64: string  // jsPDF.output('datauristring') 결과
 *   pdfFileName: string // 파일명
 * }
 *
 * Response:
 * Content-Type: application/pdf
 * Content-Disposition: attachment; filename="한글파일명.pdf"
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  // shareId는 경로 매개변수 (사용하지 않지만 라우트 구조상 필요)
  await params

  try {
    // Form data 또는 JSON 모두 지원
    let pdfBase64: string
    let pdfFileName: string

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Form submit으로 전송된 경우
      const formData = await request.formData()
      pdfBase64 = formData.get('pdfBase64') as string
      pdfFileName = formData.get('pdfFileName') as string
    } else {
      // JSON으로 전송된 경우
      const body = await request.json()
      pdfBase64 = body.pdfBase64
      pdfFileName = body.pdfFileName
    }

    if (!pdfBase64 || !pdfFileName) {
      return NextResponse.json(
        { error: '필수 파라미터가 없습니다' },
        { status: 400 }
      )
    }

    // base64를 Buffer로 변환
    // data:application/pdf;base64,... 형식에서 base64 부분만 추출
    const base64Data = pdfBase64.split(',')[1] || pdfBase64
    const pdfBuffer = Buffer.from(base64Data, 'base64')

    // RFC 5987 표준에 따른 UTF-8 인코딩된 파일명
    const contentDisposition = `attachment; filename*=UTF-8''${encodeURIComponent(pdfFileName)}`

    console.log('[PDF API] 파일명:', pdfFileName, '크기:', pdfBuffer.length)

    // PDF Binary 데이터로 응답
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[PDF API] 오류:', error)
    return NextResponse.json(
      { error: 'PDF 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
