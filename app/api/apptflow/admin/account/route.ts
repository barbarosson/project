import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/apptflow/supabase'
import { requireAdmin } from '@/lib/apptflow/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
  }

  const { userId, tenantId } = auth.ctx
  const sb = getServiceSupabase()

  const [userRes, tenantRes, subsRes, plansRes] = await Promise.all([
    sb.auth.admin.getUserById(userId),
    sb
      .from('tenants')
      .select('id, business_name, vertical, country, timezone, default_locale, default_currency, status, created_at')
      .eq('id', tenantId)
      .single(),
    sb
      .from('subscriptions')
      .select(
        'status, billing_currency, current_period_start, current_period_end, trial_ends_at, cancel_at_period_end, lemon_subscription_id, plan_id, pricing_plans(code, name, base_price_usd, included_appointments, included_whatsapp_msgs)',
      )
      .eq('tenant_id', tenantId)
      .maybeSingle(),
    sb
      .from('pricing_plans')
      .select('code, name, base_price_usd, included_appointments, included_whatsapp_msgs, is_active')
      .eq('is_active', true)
      .order('base_price_usd', { ascending: true }),
  ])

  const user = userRes.data?.user
  const tenant = tenantRes.data
  const subscription = subsRes.data as any
  const plans = plansRes.data ?? []

  return NextResponse.json({
    ok: true,
    user: user
      ? {
          id: user.id,
          email: user.email,
          full_name:
            (user.user_metadata as any)?.full_name ??
            (user.user_metadata as any)?.name ??
            null,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at ?? null,
        }
      : null,
    tenant,
    subscription: subscription
      ? {
          status: subscription.status,
          billing_currency: subscription.billing_currency,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          trial_ends_at: subscription.trial_ends_at,
          cancel_at_period_end: subscription.cancel_at_period_end ?? false,
          has_lemon_subscription: !!subscription.lemon_subscription_id,
          plan: subscription.pricing_plans
            ? {
                code: subscription.pricing_plans.code,
                name: subscription.pricing_plans.name,
                base_price_usd: Number(subscription.pricing_plans.base_price_usd ?? 0),
                included_appointments: subscription.pricing_plans.included_appointments,
                included_whatsapp_msgs: subscription.pricing_plans.included_whatsapp_msgs,
              }
            : null,
        }
      : null,
    plans: plans.map((p: any) => ({
      code: p.code,
      name: p.name,
      base_price_usd: Number(p.base_price_usd ?? 0),
      included_appointments: p.included_appointments,
      included_whatsapp_msgs: p.included_whatsapp_msgs,
    })),
  })
}
