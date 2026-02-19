/**
 * Para birimi listesi: TRY + en güçlü 20 para birimi (seçim için).
 */

export interface CurrencyItem {
  code: string
  name: string
  nameTr: string
  symbol: string
}

/** TRY + en güçlü 20 para birimi */
export const CURRENCY_LIST: CurrencyItem[] = [
  { code: 'TRY', name: 'Turkish Lira', nameTr: 'Türk Lirası', symbol: '₺' },
  { code: 'USD', name: 'US Dollar', nameTr: 'ABD Doları', symbol: '$' },
  { code: 'EUR', name: 'Euro', nameTr: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', nameTr: 'İngiliz Sterlini', symbol: '£' },
  { code: 'CHF', name: 'Swiss Franc', nameTr: 'İsviçre Frangı', symbol: 'CHF' },
  { code: 'JPY', name: 'Japanese Yen', nameTr: 'Japon Yeni', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', nameTr: 'Kanada Doları', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', nameTr: 'Avustralya Doları', symbol: 'A$' },
  { code: 'CNY', name: 'Chinese Yuan', nameTr: 'Çin Yuanı', symbol: '¥' },
  { code: 'HKD', name: 'Hong Kong Dollar', nameTr: 'Hong Kong Doları', symbol: 'HK$' },
  { code: 'SGD', name: 'Singapore Dollar', nameTr: 'Singapur Doları', symbol: 'S$' },
  { code: 'SAR', name: 'Saudi Riyal', nameTr: 'Suudi Arabistan Riyali', symbol: 'SR' },
  { code: 'AED', name: 'UAE Dirham', nameTr: 'BAE Dirhemi', symbol: 'AED' },
  { code: 'KWD', name: 'Kuwaiti Dinar', nameTr: 'Kuveyt Dinarı', symbol: 'KD' },
  { code: 'BHD', name: 'Bahraini Dinar', nameTr: 'Bahreyn Dinarı', symbol: 'BD' },
  { code: 'QAR', name: 'Qatari Riyal', nameTr: 'Katar Riyali', symbol: 'QR' },
  { code: 'OMR', name: 'Omani Rial', nameTr: 'Umman Riyali', symbol: 'OMR' },
  { code: 'SEK', name: 'Swedish Krona', nameTr: 'İsveç Kronu', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', nameTr: 'Norveç Kronu', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', nameTr: 'Danimarka Kronu', symbol: 'kr' },
  { code: 'NZD', name: 'New Zealand Dollar', nameTr: 'Yeni Zelanda Doları', symbol: 'NZ$' },
]

/** Para birimi kodu -> item */
export const CURRENCY_BY_CODE = Object.fromEntries(CURRENCY_LIST.map(c => [c.code, c]))

/** Varsayılan para birimi */
export const DEFAULT_CURRENCY_CODE = 'TRY'

/** Select label: code - name (dil: tr/en) */
export function getCurrencyLabel(item: CurrencyItem, language: string): string {
  const name = language === 'tr' ? item.nameTr : item.name
  return `${item.code} - ${name}`
}
