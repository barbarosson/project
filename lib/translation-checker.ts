import { translations } from './i18n'

export interface TranslationIssue {
  type: 'missing_in_tr' | 'missing_in_en' | 'empty_value' | 'untranslated' | 'placeholder_mismatch'
  key: string
  section: string
  enValue?: string
  trValue?: string
  severity: 'error' | 'warning' | 'info'
}

export interface SectionStats {
  section: string
  enKeys: number
  trKeys: number
  missingInTr: number
  missingInEn: number
  emptyInTr: number
  untranslated: number
  placeholderMismatch: number
  completionPct: number
}

export interface TranslationReport {
  totalEnKeys: number
  totalTrKeys: number
  issues: TranslationIssue[]
  sections: SectionStats[]
  overallCompletion: number
  healthScore: number
}

function flattenObj(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const val = obj[key]
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      Object.assign(result, flattenObj(val, fullKey))
    } else {
      result[fullKey] = val == null ? '' : String(val)
    }
  }
  return result
}

function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\{[^}]+\}/g) || []
  return matches.sort()
}

const SKIP_UNTRANSLATED = [
  'IBAN', 'SWIFT', 'BIC', 'VKN', 'TCKN', 'KDV', 'MODULUS', 'AI',
  'URL', 'PDF', 'CSV', 'Excel', 'JSON', 'API', 'webhook', 'CRM',
  'ERP', 'E-SMM', 'E-MM', 'ETTN', 'KVKK', 'Blog', 'NES', 'TR',
  '@', '+90', 'http', 'Kadıköy', 'AAAA', 'XXX'
]

export function analyzeTranslations(): TranslationReport {
  const en = translations.en as Record<string, any>
  const tr = translations.tr as Record<string, any>

  const enFlat = flattenObj(en)
  const trFlat = flattenObj(tr)

  const enKeys = Object.keys(enFlat)
  const trKeys = Object.keys(trFlat)
  const enSet = new Set(enKeys)
  const trSet = new Set(trKeys)

  const issues: TranslationIssue[] = []

  for (const key of enKeys) {
    const section = key.split('.')[0]

    if (!trSet.has(key)) {
      issues.push({
        type: 'missing_in_tr',
        key,
        section,
        enValue: enFlat[key],
        severity: 'error',
      })
      continue
    }

    const trVal = trFlat[key]
    const enVal = enFlat[key]

    if (!trVal || !trVal.trim()) {
      issues.push({
        type: 'empty_value',
        key,
        section,
        enValue: enVal,
        trValue: trVal,
        severity: 'error',
      })
      continue
    }

    if (enVal === trVal && enVal.length > 3) {
      const isSkippable = SKIP_UNTRANSLATED.some(p => enVal.includes(p))
      if (!isSkippable) {
        issues.push({
          type: 'untranslated',
          key,
          section,
          enValue: enVal,
          trValue: trVal,
          severity: 'warning',
        })
      }
    }

    const enPh = extractPlaceholders(enVal)
    const trPh = extractPlaceholders(trVal)
    if (enPh.length > 0 && JSON.stringify(enPh) !== JSON.stringify(trPh)) {
      issues.push({
        type: 'placeholder_mismatch',
        key,
        section,
        enValue: enVal,
        trValue: trVal,
        severity: 'warning',
      })
    }
  }

  for (const key of trKeys) {
    if (!enSet.has(key)) {
      const section = key.split('.')[0]
      issues.push({
        type: 'missing_in_en',
        key,
        section,
        trValue: trFlat[key],
        severity: 'error',
      })
    }
  }

  const sectionArr = Array.from(new Set([...enKeys, ...trKeys].map(k => k.split('.')[0])))
  const sections: SectionStats[] = []

  for (const section of sectionArr) {
    const sEnKeys = enKeys.filter(k => k.startsWith(section + '.') || k === section)
    const sTrKeys = trKeys.filter(k => k.startsWith(section + '.') || k === section)
    const sIssues = issues.filter(i => i.section === section)

    const missingInTr = sIssues.filter(i => i.type === 'missing_in_tr').length
    const missingInEn = sIssues.filter(i => i.type === 'missing_in_en').length
    const emptyInTr = sIssues.filter(i => i.type === 'empty_value').length
    const untranslated = sIssues.filter(i => i.type === 'untranslated').length
    const placeholderMismatch = sIssues.filter(i => i.type === 'placeholder_mismatch').length

    const totalRequired = sEnKeys.length
    const goodTranslations = totalRequired - missingInTr - emptyInTr
    const completionPct = totalRequired > 0 ? (goodTranslations / totalRequired) * 100 : 100

    sections.push({
      section,
      enKeys: sEnKeys.length,
      trKeys: sTrKeys.length,
      missingInTr,
      missingInEn,
      emptyInTr,
      untranslated,
      placeholderMismatch,
      completionPct,
    })
  }

  sections.sort((a, b) => a.completionPct - b.completionPct)

  const totalRequired = enKeys.length
  const errorCount = issues.filter(i => i.severity === 'error').length
  const goodKeys = totalRequired - errorCount
  const overallCompletion = totalRequired > 0 ? (goodKeys / totalRequired) * 100 : 100

  let healthScore = 100
  healthScore -= issues.filter(i => i.type === 'missing_in_tr').length * 2
  healthScore -= issues.filter(i => i.type === 'missing_in_en').length * 2
  healthScore -= issues.filter(i => i.type === 'empty_value').length * 1.5
  healthScore -= issues.filter(i => i.type === 'untranslated').length * 0.5
  healthScore -= issues.filter(i => i.type === 'placeholder_mismatch').length * 1
  healthScore = Math.max(0, Math.min(100, healthScore))

  return {
    totalEnKeys: enKeys.length,
    totalTrKeys: trKeys.length,
    issues,
    sections,
    overallCompletion: Math.round(overallCompletion * 100) / 100,
    healthScore: Math.round(healthScore * 100) / 100,
  }
}
