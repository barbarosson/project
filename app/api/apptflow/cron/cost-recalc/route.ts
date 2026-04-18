import { NextRequest, NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/apptflow/cron'
import { getServiceSupabase } from '@/lib/apptflow/supabase'
import { recomputeMarginForMonth } from '@/lib/apptflow/cost'
import { env } from '@/lib/apptflow/env'
import { dispatchEvent } from '@/lib/apptflow/orchestrator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Nightly: for every active tenant, recompute current month's cost
// ledger and margin snapshot. Emits pricing.recheck when under margin.
export async function POST(req: NextRequest) {
  if (!requireCronAuth(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  return run()
}
export async function GET(req: NextRequest) {
  if (!requireCronAuth(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  return run()
}

async function run() {
  const sb = getServiceSupabase()
  const { data: tenants } = await sb
    .from('tenants')
    .select('id')
    .in('status', ['active', 'past_due'])

  const period = new Date()
  period.setUTCDate(1); period.setUTCHours(0, 0, 0, 0)
  const periodMonth = period.toISOString().slice(0, 10)

  const minMargin = env.minMargin()
  let under = 0
  let total = 0
  for (const t of tenants ?? []) {
    try {
      const snap = await recomputeMarginForMonth(t.id, periodMonth, minMargin)
      total++
      if (snap.under_margin) {
        under++
        await dispatchEvent({
          event: 'pricing.recheck',
          tenant_id: t.id,
          payload: {
            period_month: periodMonth,
            margin: snap.margin,
            required_price_usd: snap.required_price_usd,
          },
        })
      }
    } catch (err) {
      console.error('[apptflow] margin recompute failed:', t.id, (err as Error).message)
    }
  }
  return NextResponse.json({ ok: true, tenants: total, under_margin: under })
}
