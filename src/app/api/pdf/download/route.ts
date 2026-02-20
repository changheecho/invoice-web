/**
 * PDF 다운로드 API 라우트
 *
 * 클라이언트에서 생성한 PDF Blob을 받아서
 * 올바른 Content-Disposition 헤더와 함께 다운로드합니다.
 *
 * RFC 5987 인코딩으로 한글 파일명을 제대로 처리합니다.
 */

export async function POST(request: Request) {
  try {
    const { base64Data, fileName } = await request.json() as {
      base64Data: string
      fileName: string
    }

    if (!base64Data || !fileName) {
      return new Response(
        JSON.stringify({ error: '파일명 또는 데이터가 누락되었습니다' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Base64를 Buffer로 변환
    const binaryString = Buffer.from(base64Data, 'base64')

    // RFC 5987 인코딩으로 한글 파일명 인코딩
    // filename*=UTF-8''[인코딩된 파일명] 형식 사용
    const utf8FileName = Buffer.from(fileName, 'utf-8')
      .toString('utf-8')
    const encodedFileName = encodeURIComponent(utf8FileName)

    // Content-Disposition 헤더 설정
    // 1. filename: ASCII 버전 (폴백)
    // 2. filename*: RFC 5987 인코딩 (주요)
    const asciiFileName = fileName
      .replace(/[^\x00-\x7F]/g, '?')
      .replace(/\s+/g, '_')

    const response = new Response(binaryString, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': binaryString.length.toString(),
        'Content-Disposition': `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })

    return response
  } catch (error) {
    console.error('[PDF 다운로드 API] 오류:', error)
    return new Response(
      JSON.stringify({ error: 'PDF 다운로드 중 오류가 발생했습니다' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
