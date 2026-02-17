/**
 * 견적서 PDF 문서 컴포넌트
 *
 * react-pdf/renderer를 사용하여 견적서 데이터를 PDF로 렌더링합니다.
 * 이 컴포넌트는 일반 React DOM이 아닌 PDF 렌더러용으로 작성되었습니다.
 *
 * @note react-pdf/renderer는 HTML/CSS가 아닌 자체 레이아웃 시스템을 사용합니다.
 *       Tailwind CSS, shadcn/ui 컴포넌트는 사용할 수 없습니다.
 *
 * @reference https://react-pdf.org/
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { Invoice } from '@/types'
import { INVOICE_STATUS_LABELS, CURRENCY_FORMAT } from '@/lib/constants'

// ============================================================
// 한글 폰트 등록 (PDF에서 한글 깨짐 방지)
// ============================================================

/**
 * Noto Sans KR 폰트 등록
 * Next.js public 디렉토리에 폰트 파일을 위치시키거나 CDN URL을 사용합니다.
 *
 * @note 배포 시 public/fonts/NotoSansKR-Regular.ttf 파일이 필요합니다.
 *       없을 경우 한글이 깨질 수 있습니다.
 */
Font.register({
  family: 'NotoSansKR',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLTq8H4hfeE.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLTq8H4hfeE.woff2',
      fontWeight: 'bold',
    },
  ],
})

// ============================================================
// PDF 스타일시트
// ============================================================

/**
 * PDF 레이아웃 스타일 정의
 * react-pdf/renderer의 StyleSheet.create를 사용합니다.
 */
const styles = StyleSheet.create({
  // 페이지 전체 스타일
  page: {
    fontFamily: 'NotoSansKR',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
    color: '#111827',
  },

  // 헤더 섹션 (견적서 제목 + 정보)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    marginBottom: 6,
  },

  // 상태 배지
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },

  // 클라이언트 정보 섹션
  clientSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },

  // 항목 테이블
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  colName: {
    flex: 4,
    fontSize: 9,
  },
  colQty: {
    flex: 1,
    textAlign: 'right',
    fontSize: 9,
  },
  colPrice: {
    flex: 2,
    textAlign: 'right',
    fontSize: 9,
  },
  colSubtotal: {
    flex: 2,
    textAlign: 'right',
    fontSize: 9,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#374151',
  },

  // 합계 섹션
  totalsSection: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    minWidth: 200,
  },
  totalLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 16,
    color: '#6b7280',
  },
  totalValue: {
    minWidth: 80,
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#111827',
    marginTop: 4,
    minWidth: 200,
  },
  grandTotalLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 16,
    fontWeight: 'bold',
    fontSize: 12,
  },
  grandTotalValue: {
    minWidth: 80,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // 메모 섹션
  notesSection: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.5,
  },

  // 푸터
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
})

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 금액을 한국 원화 형식으로 포맷합니다.
 *
 * @param amount - 포맷할 금액 (숫자)
 * @returns '₩1,000,000' 형식의 문자열
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', CURRENCY_FORMAT).format(amount)
}

// ============================================================
// PDF 문서 컴포넌트
// ============================================================

/**
 * Props 타입 정의
 */
interface InvoicePdfDocumentProps {
  invoice: Invoice
}

/**
 * 견적서 PDF 문서 컴포넌트
 *
 * @param props.invoice - 렌더링할 Invoice 데이터
 * @returns react-pdf Document 컴포넌트
 */
export function InvoicePdfDocument({ invoice }: InvoicePdfDocumentProps) {
  const statusLabel = INVOICE_STATUS_LABELS[invoice.status]

  return (
    <Document
      title={invoice.title}
      author="Invoice Web"
      subject={`견적서 - ${invoice.clientName}`}
    >
      <Page size="A4" style={styles.page}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>견적서</Text>
            <Text style={styles.subtitle}>{invoice.title}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.metaLabel}>견적 일자</Text>
            <Text style={styles.metaValue}>{invoice.invoiceDate}</Text>
            {invoice.dueDate && (
              <>
                <Text style={styles.metaLabel}>만료일</Text>
                <Text style={styles.metaValue}>{invoice.dueDate}</Text>
              </>
            )}
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* 클라이언트 정보 */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionLabel}>수신</Text>
          <Text style={styles.clientName}>{invoice.clientName}</Text>
        </View>

        {/* 항목 테이블 */}
        <View style={styles.table}>
          {/* 테이블 헤더 */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colName, styles.tableHeaderText]}>항목명</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>수량</Text>
            <Text style={[styles.colPrice, styles.tableHeaderText]}>단가</Text>
            <Text style={[styles.colSubtotal, styles.tableHeaderText]}>소계</Text>
          </View>

          {/* 항목 행 */}
          {invoice.items.length > 0 ? (
            invoice.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colName}>{item.name}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
                <Text style={styles.colSubtotal}>{formatCurrency(item.subtotal)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={[styles.colName, { color: '#9ca3af' }]}>
                항목 정보가 없습니다.
              </Text>
            </View>
          )}
        </View>

        {/* 합계 */}
        <View style={styles.totalsSection}>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>총 금액</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.totalAmount)}
            </Text>
          </View>
        </View>

        {/* 메모 (있는 경우만 표시) */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>메모</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* 푸터 */}
        <Text style={styles.footer}>
          본 견적서는 자동 생성된 문서입니다. 문의사항은 발신자에게 연락하세요.
        </Text>
      </Page>
    </Document>
  )
}
