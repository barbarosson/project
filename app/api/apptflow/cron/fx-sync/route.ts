import { NextRequest, NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/apptflow/cron'
import { refreshFxRates } from '@/lib/apptflow/fx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!requireCronAuth(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  try {
    const r = await refreshFxRates()
    return NextResponse.json({ ok: true, ...r })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
export async function GET(req: NextRequest) { return POST(req) }
