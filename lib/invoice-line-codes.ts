/**
 * GIB e-fatura / e-arşiv kod listeleri (satır seviyesi)
 * İhraç kayıtlı, tevkifat kodları ve tevkifat nedenleri.
 * Tevkifat kodları: https://edonustur.com/tevkifat-kodu-tevkifat-kodlari-7-10-tevkifat-kodu/
 */

export type ExportCodeItem = { code: string; labelTr: string; labelEn: string }
export type WithholdingReasonItem = { code: string; labelTr: string; labelEn: string }
export type TevkifatCodeItem = { code: string; labelTr: string; labelEn: string; ratio: string; percent: number }

/** İhraç kayıtlı satış muafiyet kodları (GIB) – listeden seçilir */
export const EXPORT_CODES: ExportCodeItem[] = [
  { code: '701', labelTr: 'Genel ihraç kayıtlı satış', labelEn: 'General export registered sale' },
  { code: '702', labelTr: 'D.İ.İ.B. ve Geçici Kabul Rejimi kapsamında ihraç kayıtlı satış', labelEn: 'Export registered under D.I.I.B. and temporary admission' },
  { code: '703', labelTr: 'ÖTV 8/2 kapsamında ihraç kayıtlı satış', labelEn: 'Export registered under SCT 8/2' },
  { code: '704', labelTr: 'KDV 11/1-c ve ÖTV 8/2 kapsamında ihraç kayıtlı satış', labelEn: 'Export registered under VAT 11/1-c and SCT 8/2' },
]

/**
 * 2025 KDV tevkifat kodları (GIB). Oran: 2/10, 3/10, 4/10, 5/10, 7/10, 9/10.
 * Fatura satırında veya belge düzeyinde seçilir; e-fatura UBL'de TaxTypeCode olarak gönderilir.
 */
export const TEVKIFAT_CODES: TevkifatCodeItem[] = [
  { code: '601', ratio: '4/10', percent: 40, labelTr: 'Yapım işleri (mühendislik-mimarlık ve etüt-proje ile birlikte)', labelEn: 'Construction (engineering, architecture, study and project)' },
  { code: '602', ratio: '9/10', percent: 90, labelTr: 'Etüt/plan-proje/danışmanlık/denetim ve benzeri', labelEn: 'Study, plan, project, consultancy, audit and similar' },
  { code: '603', ratio: '7/10', percent: 70, labelTr: 'Makine/teçhizat/demirbaş/taşıt tadil-bakım-onarım', labelEn: 'Machinery, equipment, fixture, vehicle repair and maintenance' },
  { code: '606', ratio: '9/10', percent: 90, labelTr: 'İşgücü temin hizmetleri', labelEn: 'Workforce supply services' },
  { code: '609', ratio: '7/10', percent: 70, labelTr: 'Diğer (7/10)', labelEn: 'Other (7/10)' },
  { code: '612', ratio: '9/10', percent: 90, labelTr: 'Temizlik hizmeti', labelEn: 'Cleaning service' },
  { code: '613', ratio: '9/10', percent: 90, labelTr: 'Çevre ve bahçe bakım hizmeti (haşere mücadelesi dahil)', labelEn: 'Environment and garden maintenance (incl. pest control)' },
  { code: '614', ratio: '5/10', percent: 50, labelTr: 'Servis/personel taşımacılığı', labelEn: 'Service/personnel transport' },
  { code: '615', ratio: '7/10', percent: 70, labelTr: 'Diğer (7/10)', labelEn: 'Other (7/10)' },
  { code: '616', ratio: '5/10', percent: 50, labelTr: '5018 kapsamındaki idare/kurum ve benzerlerine "Diğer hizmetler"', labelEn: 'Other services to 5018 administrations and similar' },
  { code: '617', ratio: '7/10', percent: 70, labelTr: 'Diğer (7/10)', labelEn: 'Other (7/10)' },
  { code: '618', ratio: '7/10', percent: 70, labelTr: 'Diğer (7/10)', labelEn: 'Other (7/10)' },
  { code: '619', ratio: '7/10', percent: 70, labelTr: 'Bakır/çinko/alüminyum ürünleri teslimi', labelEn: 'Copper, zinc, aluminium products supply' },
  { code: '620', ratio: '7/10', percent: 70, labelTr: 'Diğer (7/10)', labelEn: 'Other (7/10)' },
  { code: '624', ratio: '2/10', percent: 20, labelTr: 'Yük taşımacılığı hizmeti', labelEn: 'Freight transport service' },
  { code: '625', ratio: '3/10', percent: 30, labelTr: 'Ticari reklam hizmetleri', labelEn: 'Commercial advertising services' },
  { code: '626', ratio: '2/10', percent: 20, labelTr: 'Diğer teslimler (2/10)', labelEn: 'Other supplies (2/10)' },
  { code: '627', ratio: '5/10', percent: 50, labelTr: 'Demir-çelik ürünlerinin teslimi', labelEn: 'Iron and steel products supply' },
]

/** Benzersiz tevkifat oranları (ilk dropdown: oran seçimi). */
export const TEVKIFAT_RATIOS = Array.from(
  new Set(TEVKIFAT_CODES.map((x) => x.ratio))
).sort((a, b) => {
  const [aNum] = a.split('/').map(Number)
  const [bNum] = b.split('/').map(Number)
  return aNum - bNum
})

/** Seçilen orana göre tevkifat nedenleri (kod listesi). */
export function getTevkifatCodesByRatio(ratio: string | null | undefined): TevkifatCodeItem[] {
  if (!ratio || ratio === 'none') return []
  return TEVKIFAT_CODES.filter((x) => x.ratio === ratio)
}

/** Tevkifat kodundan oran döner (örn. "602" → "9/10"). */
export function getTevkifatRatioFromCode(code: string | null | undefined): string | null {
  if (!code || code === 'none') return null
  const item = TEVKIFAT_CODES.find((x) => x.code === code)
  return item?.ratio ?? null
}

/** Tevkifat kodu → yüzde (GIB Percent değeri). Eşleşmeyen kodlar için 90 kullanılır. */
export const TEVKIFAT_CODE_TO_PERCENT: Record<string, number> = Object.fromEntries(
  TEVKIFAT_CODES.map((x) => [x.code, x.percent])
)

/** Oran string (9/10 vb.) veya tevkifat kodu (602) ile yüzde döner. */
export function getTevkifatPercent(ratioOrCode: string | null | undefined): number {
  if (!ratioOrCode || ratioOrCode === 'none') return 0
  const fromCode = TEVKIFAT_CODE_TO_PERCENT[ratioOrCode]
  if (fromCode != null) return fromCode
  const match = String(ratioOrCode).match(/^(\d+)\/(\d+)$/)
  if (match) {
    const num = parseInt(match[1], 10)
    const den = parseInt(match[2], 10)
    if (den > 0) return Math.round((num / den) * 100)
  }
  return 90
}

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

export function getTevkifatCodeLabel(code: string, lang: 'tr' | 'en'): string {
  const item = TEVKIFAT_CODES.find((x) => x.code === code)
  if (!item) return code
  return lang === 'tr' ? item.labelTr : item.labelEn
}
