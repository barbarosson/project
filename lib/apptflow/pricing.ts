import { env } from './env'
import { fromUsd } from './fx'
import { getServiceSupabase } from './supabase'
import type { CurrencyCode } from './types'

// The pricing engine makes two guarantees:
//  1. A tenant never charges in a currency we can't FX-price.
//  2. Every active subscription monthly price is >= required_price_usd
//     derived from its 30-day trailing cost so the platform keeps at
//     least `APPTFLOW_MIN_MARGIN` gross margin.
// When condition 2 fails, we auto-propose an upgrade and tag the
// subscription as `under_margin` for the pricing agent to act on.

export interface PlanQuote {
  planCode: string
  currency: CurrencyCode
  monthlyUnitAmountMinor: number     // e.g. 14900 for $149.00
  monthlyDisplay: string              // "$149.00"
  minMarginSatisfied: boolean
  requiredUsd: number
}

function formatMoney(amount: number, currency: CurrencyCode, decimals: number): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, maximumFractionDigits: decimals,
    }).format(amount)
  } catch {
    return `${amount.toFixed(decimals)} ${currency}`
  }
}

export async function quotePlan(
  planCode: string,
  currency: CurrencyCode,
  trailingCostUsd = 0,
): Promise<PlanQuote> {
  const sb = getServiceSupabase()
  const { data: plan, error } = await sb
    .from('pricing_plans')
    .select('id, base_price_usd, min_margin')
    .eq('code', planCode)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  if (!plan) throw new Error(`Unknown plan: ${planCode}`)

  const policyMargin = Math.max(Number(plan.min_margin), env.minMargin())
  const requiredUsd = trailingCostUsd / (1 - policyMargin)
  const baseUsd = Number(plan.base_price_usd)
  const usdPrice = Math.max(baseUsd, requiredUsd)

  const { data: currencyRow } = await sb
    .from('currencies')
    .select('decimals')
    .eq('code', currency)
    .maybeSingle()
  const decimals = currencyRow?.decimals ?? 2

  const local = await fromUsd(usdPrice, currency)
  // Round up to nearest minor unit so we never drop below margin after FX.
  const minorFactor = Math.pow(10, decimals)
  const minor = Math.ceil(local * minorFactor)

  return {
    planCode,
    currency,
    monthlyUnitAmountMinor: minor,
    monthlyDisplay: formatMoney(minor / minorFactor, currency, decimals),
    minMarginSatisfied: baseUsd >= requiredUsd,
    requiredUsd,
  }
}

// Called by the pricing agent when a margin snapshot flips to under_margin.
// Returns the next plan that *would* restore margin, or null if the top plan
// already isn't enough (in which case a performance fee must be added).
export async function suggestUpgrade(
  currentPlanCode: string,
  trailingCostUsd: number,
  currency: CurrencyCode,
): Promise<PlanQuote | null> {
  const sb = getServiceSupabase()
  const { data: plans, error } = await sb
    .from('pricing_plans')
    .select('code, base_price_usd')
    .eq('is_active', true)
    .order('base_price_usd', { ascending: true })
  if (error) throw error
  const ordered = plans ?? []
  const currentIdx = ordered.findIndex(p => p.code === currentPlanCode)
  for (let i = Math.max(0, currentIdx) + 1; i < ordered.length; i++) {
    const quote = await quotePlan(ordered[i].code, currency, trailingCostUsd)
    if (quote.minMarginSatisfied) return quote
  }
  return null
}
