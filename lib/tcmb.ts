/**
 * TCMB (Türkiye Cumhuriyet Merkez Bankası) döviz kurları.
 * MBDA = Döviz Alış (Forex Buying), MBDS = Döviz Satış (Forex Selling)
 * MEDA = Efektif Alış (Banknote Buying), MEDS = Efektif Satış (Banknote Selling)
 */

export type TcmbRateType = 'MBDA' | 'MBDS' | 'MEDA' | 'MEDS'

export interface TcmbCurrencyRates {
  /** 1 birim döviz = X TRY (JPY için 100 birim = X TRY, yani per 1 JPY = X/100 TRY) */
  MBDA: number | null
  MBDS: number | null
  MEDA: number | null
  MEDS: number | null
  /** TCMB'deki birim (1 veya 100) */
  unit: number
}

export type TcmbRatesByCurrency = Record<string, TcmbCurrencyRates>

const TCMB_BASE = 'https://www.tcmb.gov.tr/kurlar'

/**
 * Tarih için TCMB URL: YYYYMM/DDMMYYYY.xml veya bugün için today.xml
 */
function getTcmbUrl(date: string): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return `${TCMB_BASE}/today.xml`
  const today = new Date()
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  if (isToday) return `${TCMB_BASE}/today.xml`
  const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
  const ddmmyyyy = `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`
  return `${TCMB_BASE}/${yyyymm}/${ddmmyyyy}.xml`
}

function parseFloatOrNull(s: string | undefined): number | null {
  if (s == null || s === '') return null
  const n = parseFloat(String(s).replace(',', '.').trim())
  return isNaN(n) ? null : n
}

function getAttr(attrs: string, name: string): string | undefined {
  const re = new RegExp(`${name}="([^"]*)"`, 'i')
  const m = attrs.match(re)
  return m ? m[1] : undefined
}

/** XML blok içinden etiket değerini al (child element: <Tag>value</Tag>) */
function getTagValue(block: string, tagName: string): string | undefined {
  const re = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i')
  const m = block.match(re)
  return m ? m[1].trim() : undefined
}

/**
 * TCMB XML içindeki Currency etiketlerini parse eder.
 * Desteklenen formatlar:
 * 1) Attribute: <Currency Kod="USD" Unit="1" ForexBuying="43.69" ... />
 * 2) TCMB bazen CurrencyCode kullanır: CurrencyCode="USD"
 * 3) Child element: <Currency ...><ForexBuying>43.69</ForexBuying>...</Currency>
 */
function parseTcmbXml(xml: string): TcmbRatesByCurrency {
  const result: TcmbRatesByCurrency = {}

  // Currency bloklarını bul (açılış etiketi + içerik veya self-closing)
  const currencyBlockRegex = /<Currency\s+([^>]+)\s*(?:\/>|>([\s\S]*?)<\/Currency>)/gi
  let m: RegExpExecArray | null
  while ((m = currencyBlockRegex.exec(xml)) !== null) {
    const attrs = m[1]
    const inner = m[2] || ''
    const kod = getAttr(attrs, 'Kod') || getAttr(attrs, 'CurrencyCode')
    if (!kod) continue
    const unit = parseInt(getAttr(attrs, 'Unit') || getTagValue(inner, 'Unit') || '1', 10) || 1
    const forexBuying = parseFloatOrNull(getAttr(attrs, 'ForexBuying') ?? getTagValue(inner, 'ForexBuying'))
    const forexSelling = parseFloatOrNull(getAttr(attrs, 'ForexSelling') ?? getTagValue(inner, 'ForexSelling'))
    const banknoteBuying = parseFloatOrNull(getAttr(attrs, 'BanknoteBuying') ?? getTagValue(inner, 'BanknoteBuying'))
    const banknoteSelling = parseFloatOrNull(getAttr(attrs, 'BanknoteSelling') ?? getTagValue(inner, 'BanknoteSelling'))
    result[kod] = {
      MBDA: forexBuying,
      MBDS: forexSelling,
      MEDA: banknoteBuying,
      MEDS: banknoteSelling,
      unit
    }
  }

  return result
}

/**
 * Belirli bir tarih için TCMB kurlarını getirir.
 * Sunucu tarafında çağrılmalı (CORS nedeniyle).
 * Hata veya boş yanıt durumunda boş obje döner.
 */
export async function getTcmbRatesForDate(date: string): Promise<TcmbRatesByCurrency> {
  const url = getTcmbUrl(date)
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { 'Accept': 'application/xml, text/xml, */*' }
    })
    if (!res.ok) return {}
    const xml = await res.text()
    const parsed = parseTcmbXml(xml)
    return parsed
  } catch {
    return {}
  }
}

/**
 * Tek bir para birimi için seçilen kur tipine göre 1 birim döviz = ? TRY değerini döndürür.
 * JPY için unit=100 olduğundan sonuç 1 JPY = rate/100 TRY olacak şekilde döner.
 */
export function getRateForType(
  rates: TcmbCurrencyRates | undefined,
  rateType: TcmbRateType
): number | null {
  if (!rates) return null
  const raw = rates[rateType]
  if (raw == null) return null
  return raw / rates.unit
}

/**
 * Tutarı fatura para biriminden hedef para birimine çevirir.
 * Fatura TRY ise: amount TRY / targetRate = hedef birim (örn. USD)
 * Fatura USD ise: amount USD * sourceRate = TRY, sonra TRY / targetRate = hedef birim
 * sourceRate ve targetRate: 1 birim döviz = X TRY
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: TcmbRatesByCurrency,
  rateType: TcmbRateType
): number | null {
  if (fromCurrency === toCurrency) return amount
  if (fromCurrency === 'TRY' && toCurrency !== 'TRY') {
    const toRate = getRateForType(rates[toCurrency], rateType)
    if (toRate == null || toRate === 0) return null
    return amount / toRate
  }
  if (fromCurrency !== 'TRY' && toCurrency === 'TRY') {
    const fromRate = getRateForType(rates[fromCurrency], rateType)
    if (fromRate == null) return null
    return amount * fromRate
  }
  if (fromCurrency !== 'TRY' && toCurrency !== 'TRY') {
    const fromRate = getRateForType(rates[fromCurrency], rateType)
    const toRate = getRateForType(rates[toCurrency], rateType)
    if (fromRate == null || toRate == null || toRate === 0) return null
    const tryAmount = amount * fromRate
    return tryAmount / toRate
  }
  return null
}
