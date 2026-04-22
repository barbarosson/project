import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/apptflow/supabase'
import { requireAdmin } from '@/lib/apptflow/auth'
import { getSubscriptionUrls } from '@/lib/apptflow/lemon'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
  }

  const sb = getServiceSupabase()
  const { data: subRow, error } = await sb
    .from('subscriptions')
    .select('lemon_subscription_id, status')
    .eq('tenant_id', auth.ctx.tenantId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: 'subscription_lookup_failed', message: error.message }, { status: 500 })
  }
  if (!subRow?.lemon_subscription_id) {
    return NextResponse.json({ ok: false, error: 'no_active_subscription' }, { status: 404 })
  }

  try {
    const urls = await getSubscriptionUrls(subRow.lemon_subscription_id)
    return NextResponse.json({
      ok: true,
      customer_portal: urls.customer_portal ?? null,
      update_payment_method: urls.update_payment_method ?? null,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'lemon_api_failed', message: err?.message ?? 'unknown' },
      { status: 502 },
    )
  }
}
