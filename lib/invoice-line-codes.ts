/**
 * GIB e-fatura / e-arşiv kod listeleri (satır seviyesi)
 * İhraç kayıtlı ve tevkifat nedenleri.
 */

export type ExportCodeItem = { code: string; labelTr: string; labelEn: string }
export type WithholdingReasonItem = { code: string; labelTr: string; labelEn: string }

/** İhraç kayıtlı satış muafiyet kodları (GIB) – listeden seçilir */
export const EXPORT_CODES: ExportCodeItem[] = [
  { code: '701', labelTr: 'Genel ihraç kayıtlı satış', labelEn: 'General export registered sale' },
  { code: '702', labelTr: 'D.İ.İ.B. ve Geçici Kabul Rejimi kapsamında ihraç kayıtlı satış', labelEn: 'Export registered under D.I.I.B. and temporary admission' },
  { code: '703', labelTr: 'ÖTV 8/2 kapsamında ihraç kayıtlı satış', labelEn: 'Export registered under SCT 8/2' },
  { code: '704', labelTr: 'KDV 11/1-c ve ÖTV 8/2 kapsamında ihraç kayıtlı satış', labelEn: 'Export registered under VAT 11/1-c and SCT 8/2' },
]

/** Tevkifat nedeni kodları (WithholdingTaxTotal TaxCategory – e-fatura gönderiminde seçilir) */
export const WITHHOLDING_REASON_CODES: WithholdingReasonItem[] = [
  { code: '9015', labelTr: 'KDV tevkifatı (genel)', labelEn: 'VAT withholding (general)' },
  { code: '9016', labelTr: 'KDV tevkifatı (diğer)', labelEn: 'VAT withholding (other)' },
  { code: '9021', labelTr: 'Diğer tevkifat', labelEn: 'Other withholding' },
]

export function getExportCodeLabel(code: string, lang: 'tr' | 'en'): string {
  const item = EXPORT_CODES.find((x) => x.code === code)
  if (!item) return code
  return lang === 'tr' ? item.labelTr : item.labelEn
}

export function getWithholdingReasonLabel(code: string, lang: 'tr' | 'en'): string {
  const item = WITHHOLDING_REASON_CODES.find((x) => x.code === code)
  if (!item) return code
  return lang === 'tr' ? item.labelTr : item.labelEn
}
