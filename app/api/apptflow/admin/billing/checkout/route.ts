import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServiceSupabase } from '@/lib/apptflow/supabase'
import { requireAdmin } from '@/lib/apptflow/auth'
import {
  createCheckoutSession,
  type PlanCode,
  type BillingCycle,
} from '@/lib/apptflow/lemon'
import { env } from '@/lib/apptflow/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PLAN_CODES = ['starter', 'pro', 'business'] as const
const CYCLES = ['monthly', 'yearly'] as const

const schema = z.object({
  plan_code: z.enum(PLAN_CODES),
  billing_cycle: z.enum(CYCLES).default('monthly'),
})

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 })
  }
  const { plan_code, billing_cycle } = parsed.data

  const sb = getServiceSupabase()
  const { data: userRes } = await sb.auth.admin.getUserById(auth.ctx.userId)
  const email = userRes?.user?.email
  if (!email) {
    return NextResponse.json({ ok: false, error: 'missing_user_email' }, { status: 400 })
  }

  const { data: tenant } = await sb
    .from('tenants')
    .select('business_name, default_locale')
    .eq('id', auth.ctx.tenantId)
    .single()

  try {
    const { url, checkoutId } = await createCheckoutSession({
      tenantId: auth.ctx.tenantId,
      plan: plan_code as PlanCode,
      cycle: billing_cycle as BillingCycle,
      customerEmail: email,
      customerName: tenant?.business_name ?? undefined,
      successUrl: `${env.publicUrl()}/apptflow/services?billing=success`,
      locale: tenant?.default_locale ?? 'en',
    })
    return NextResponse.json({ ok: true, url, checkout_id: checkoutId })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'lemon_checkout_failed', message: err?.message ?? 'unknown' },
      { status: 502 },
    )
  }
}
