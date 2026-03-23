/**
 * subscription_plans satırlarında `plan_code` ile `name` bazen farklı nesillerden gelir:
 * örn. plan_code hâlâ MEDIUM/LARGE iken name ORTA/BUYUK olabilir.
 * Arayüzde tek bir kanonik katman kodu (FREE, KUCUK, ORTA, BUYUK, ENTERPRISE) kullanılır.
 */
const LEGACY_PLAN_CODE: Record<string, string> = {
  SMALL: 'KUCUK',
  MEDIUM: 'ORTA',
  LARGE: 'BUYUK',
  STARTER: 'KUCUK',
  PROFESSIONAL: 'ORTA',
  BUSINESS: 'BUYUK',
  BASIC: 'FREE',
  ADVANCED: 'KUCUK',
}

const KNOWN = new Set(['FREE', 'KUCUK', 'ORTA', 'BUYUK', 'ENTERPRISE'])

/** plan_tier kolonu (ör. migration'larda küçük harf) */
const PLAN_TIER_TO_CANONICAL: Record<string, string> = {
  free: 'FREE',
  kucuk: 'KUCUK',
  orta: 'ORTA',
  buyuk: 'BUYUK',
  enterprise: 'ENTERPRISE',
}

export type SubscriptionPlanLike = {
  plan_code?: string | null
  name?: string | null
  plan_tier?: string | null
}

function toCanonical(token: string): string {
  const u = token.trim().toUpperCase()
  if (!u) return ''
  return LEGACY_PLAN_CODE[u] ?? u
}

/**
 * Önce plan_code, sonra name; ikisi de bilinmiyorsa plan_tier.
 */
export function getCanonicalPlanTier(plan: SubscriptionPlanLike): string {
  const fromCode = toCanonical(plan.plan_code != null ? String(plan.plan_code) : '')
  if (fromCode && KNOWN.has(fromCode)) return fromCode

  const fromName = toCanonical(plan.name != null ? String(plan.name) : '')
  if (fromName && KNOWN.has(fromName)) return fromName

  const tierKey = plan.plan_tier != null ? String(plan.plan_tier).trim().toLowerCase() : ''
  if (tierKey && PLAN_TIER_TO_CANONICAL[tierKey]) {
    return PLAN_TIER_TO_CANONICAL[tierKey]
  }

  return fromCode || fromName || 'FREE'
}
