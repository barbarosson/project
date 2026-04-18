import { NextRequest, NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/apptflow/cron'
import { tickCampaigns } from '@/lib/apptflow/campaigns'
import { dispatchEvent } from '@/lib/apptflow/orchestrator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!requireCronAuth(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  return run()
}
export async function GET(req: NextRequest) {
  if (!requireCronAuth(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  return run()
}

async function run() {
  const result = await tickCampaigns()
  await dispatchEvent({
    event: 'campaign.tick',
    tenant_id: null,
    payload: result as unknown as Record<string, unknown>,
  })
  return NextResponse.json({ ok: true, ...result })
}
