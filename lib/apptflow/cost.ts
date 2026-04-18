import { getServiceSupabase } from './supabase'

// Canonical unit costs in USD. Kept here (not DB) so they can be
// version-controlled with code changes that affect them. Adjust as
// provider pricing changes; /cron/cost-recalc will redo snapshots.
export const UNIT_COSTS_USD = {
  // WhatsApp Cloud API — utility/marketing conversation pricing varies
  // by country; this is a weighted global blended estimate. Override
  // per-tenant later via metadata if needed.
  whatsapp_outbound_msg: 0.008,
  whatsapp_inbound_msg: 0.0,          // inbound is free
  // Stripe average blended fee as a fraction of revenue.
  stripe_fee_rate: 0.029,
  stripe_fee_fixed_usd: 0.30,
  // Infra cost attributed per appointment (compute + Supabase rows).
  infra_per_appointment: 0.01,
  // LLM call avg — gpt-4o-mini ~ $0.20 / 1M in, $0.60 / 1M out.
  llm_per_call: 0.0008,
} as const

export type UsageKind =
  | 'appointment.created'
  | 'whatsapp.outbound'
  | 'whatsapp.inbound'
  | 'calendar.sync'
  | 'campaign.touch'
  | 'llm.call'

export async function recordUsage(
  tenantId: string,
  kind: UsageKind,
  quantity = 1,
  metadata: Record<string, unknown> = {},
) {
  const unit = costFor(kind)
  const sb = getServiceSupabase()
  const { error } = await sb.from('usage_events').insert({
    tenant_id: tenantId,
    kind,
    quantity,
    unit_cost_usd: unit,
    metadata,
  })
  if (error) throw error
}

export function costFor(kind: UsageKind): number {
  switch (kind) {
    case 'appointment.created': return UNIT_COSTS_USD.infra_per_appointment
    case 'whatsapp.outbound':   return UNIT_COSTS_USD.whatsapp_outbound_msg
    case 'whatsapp.inbound':    return UNIT_COSTS_USD.whatsapp_inbound_msg
    case 'calendar.sync':       return 0
    case 'campaign.touch':      return UNIT_COSTS_USD.whatsapp_outbound_msg
    case 'llm.call':            return UNIT_COSTS_USD.llm_per_call
  }
}

export function stripeFeeUsd(revenueUsd: number): number {
  if (revenueUsd <= 0) return 0
  return revenueUsd * UNIT_COSTS_USD.stripe_fee_rate + UNIT_COSTS_USD.stripe_fee_fixed_usd
}

// Aggregate usage + Stripe fees into a per-tenant cost ledger for a
// given month, then compute the margin snapshot.
export async function recomputeMarginForMonth(
  tenantId: string,
  periodMonth: string,   // YYYY-MM-01
  minMargin: number,
) {
  const sb = getServiceSupabase()

  const start = new Date(periodMonth + 'T00:00:00Z')
  const end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + 1)

  // Usage cost buckets.
  const { data: usage, error: uErr } = await sb
    .from('usage_events')
    .select('kind, quantity, unit_cost_usd')
    .eq('tenant_id', tenantId)
    .gte('occurred_at', start.toISOString())
    .lt('occurred_at', end.toISOString())
  if (uErr) throw uErr

  const buckets: Record<string, number> = { whatsapp: 0, infra: 0, llm: 0, ads: 0, other: 0 }
  for (const row of usage ?? []) {
    const c = Number(row.quantity) * Number(row.unit_cost_usd)
    if (row.kind.startsWith('whatsapp')) buckets.whatsapp += c
    else if (row.kind === 'appointment.created' || row.kind === 'calendar.sync') buckets.infra += c
    else if (row.kind === 'llm.call') buckets.llm += c
    else if (row.kind === 'campaign.touch') buckets.ads += c
    else buckets.other += c
  }

  // Revenue in USD (from Stripe invoices, already normalized on webhook).
  const { data: revenueRow, error: rErr } = await sb
    .from('margin_snapshots')
    .select('revenue_usd')
    .eq('tenant_id', tenantId)
    .eq('period_month', periodMonth)
    .maybeSingle()
  if (rErr) throw rErr
  const revenueUsd = Number(revenueRow?.revenue_usd ?? 0)

  const stripeFees = stripeFeeUsd(revenueUsd)

  // Persist each category.
  const ledgerRows = [
    { category: 'whatsapp',    cost_usd: buckets.whatsapp },
    { category: 'infra',       cost_usd: buckets.infra },
    { category: 'llm',         cost_usd: buckets.llm },
    { category: 'ads',         cost_usd: buckets.ads },
    { category: 'other',       cost_usd: buckets.other },
    { category: 'stripe_fees', cost_usd: stripeFees },
  ].map(r => ({ tenant_id: tenantId, period_month: periodMonth, ...r }))

  const { error: ledErr } = await sb
    .from('cost_ledger')
    .upsert(ledgerRows, { onConflict: 'tenant_id,period_month,category' })
  if (ledErr) throw ledErr

  const costUsd = ledgerRows.reduce((s, r) => s + r.cost_usd, 0)
  const margin = revenueUsd > 0 ? (revenueUsd - costUsd) / revenueUsd : 0
  const requiredPrice = costUsd / (1 - minMargin)
  const snapshot = {
    tenant_id: tenantId,
    period_month: periodMonth,
    revenue_usd: revenueUsd,
    cost_usd: costUsd,
    margin,
    min_required_margin: minMargin,
    required_price_usd: requiredPrice,
    under_margin: revenueUsd > 0 && margin < minMargin,
    recomputed_at: new Date().toISOString(),
  }
  const { error: sErr } = await sb
    .from('margin_snapshots')
    .upsert(snapshot, { onConflict: 'tenant_id,period_month' })
  if (sErr) throw sErr

  return snapshot
}
