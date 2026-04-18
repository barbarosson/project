import { env } from './env'
import { getServiceSupabase } from './supabase'
import type { CurrencyCode } from './types'

// Everything in the cost/revenue ledger is normalized to USD so we can
// reason about margin globally. Tenant-facing numbers are then converted
// back to their billing currency at display/invoice time.

// We try hard to be compatible with multiple free/paid FX providers because
// several "free" services (exchangerate.host, fixer, etc.) moved to paid
// plans. Default is open.er-api.com which is key-less and returns rates
// keyed from USD. The parser accepts common response shapes:
//   { rates: { EUR: 0.92, ... } }                 // open.er-api.com, frankfurter, ECB-style
//   { conversion_rates: { EUR: 0.92, ... } }      // exchangerate-api.com v6
//   { quotes: { USDEUR: 0.92, ... } }             // currencylayer / apilayer-style
async function fetchUsdRates(codes: string[]): Promise<Record<string, number>> {
  const baseUrl = env.fxProviderUrl()
  const apiKey = env.fxProviderApiKey()
  const url = new URL(baseUrl)

  // Only add base/symbols params if the URL looks like it expects them
  // (path doesn't already encode the base currency, e.g. /latest/USD).
  if (!/\/USD(?:$|[/?#])/i.test(url.pathname)) {
    url.searchParams.set('base', 'USD')
    url.searchParams.set('symbols', codes.join(','))
  }
  if (apiKey) {
    url.searchParams.set('access_key', apiKey)
    url.searchParams.set('apikey', apiKey)
  }

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`FX fetch failed: ${res.status} ${res.statusText}`)
  const body = (await res.json()) as Record<string, unknown>

  const rates =
    (body.rates as Record<string, number> | undefined) ??
    (body.conversion_rates as Record<string, number> | undefined) ??
    null

  if (rates && typeof rates === 'object') return rates

  const quotes = body.quotes as Record<string, number> | undefined
  if (quotes && typeof quotes === 'object') {
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(quotes)) {
      if (k.startsWith('USD') && k.length === 6) out[k.slice(3)] = Number(v)
    }
    if (Object.keys(out).length > 0) return out
  }

  throw new Error(`FX response missing rates; got keys: ${Object.keys(body).join(',')}`)
}

export async function refreshFxRates(): Promise<{ updated: number }> {
  const sb = getServiceSupabase()
  const { data: currencies, error } = await sb
    .from('currencies')
    .select('code')
    .eq('is_active', true)
  if (error) throw error

  const codes = (currencies ?? []).map(c => c.code).filter(c => c !== 'USD')
  const rates = await fetchUsdRates(codes)

  const now = new Date().toISOString()
  const source = new URL(env.fxProviderUrl()).hostname
  const rows = [
    { currency: 'USD', usd_per_unit: 1, source: 'fixed', fetched_at: now },
  ]
  for (const code of codes) {
    const perUsd = Number(rates[code])
    if (!perUsd || !Number.isFinite(perUsd) || perUsd <= 0) continue
    rows.push({
      currency: code,
      usd_per_unit: 1 / perUsd,
      source,
      fetched_at: now,
    })
  }

  const { error: upErr } = await sb.from('fx_rates').upsert(rows, { onConflict: 'currency' })
  if (upErr) throw upErr
  return { updated: rows.length }
}

export async function getUsdPerUnit(currency: CurrencyCode): Promise<number> {
  if (currency === 'USD') return 1
  const sb = getServiceSupabase()
  const { data, error } = await sb
    .from('fx_rates')
    .select('usd_per_unit')
    .eq('currency', currency)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`No FX rate cached for ${currency}; run fx-sync cron first`)
  return Number(data.usd_per_unit)
}

export async function toUsd(amount: number, currency: CurrencyCode): Promise<number> {
  const rate = await getUsdPerUnit(currency)
  return amount * rate
}

export async function fromUsd(amountUsd: number, currency: CurrencyCode): Promise<number> {
  const rate = await getUsdPerUnit(currency)
  if (rate === 0) throw new Error(`Invalid FX rate for ${currency}`)
  return amountUsd / rate
}
