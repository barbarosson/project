import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServiceSupabase } from '@/lib/apptflow/supabase'
import { requireAdmin } from '@/lib/apptflow/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  category: z.string().max(60).nullable().optional(),
  duration_minutes: z.number().int().min(5).max(600).optional(),
  buffer_minutes: z.number().int().min(0).max(240).optional(),
  price_amount: z.number().min(0).optional(),
  price_currency: z.string().length(3).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
  windows: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        start_time: z.string().regex(/^\d{2}:\d{2}$/),
        end_time: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    )
    .optional(),
})

// PATCH /api/apptflow/admin/services/:id  — update a service (and optionally
// replace its availability windows atomically).
export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }
  const p = parsed.data

  const sb = getServiceSupabase()

  // Tenant-scope guard.
  const { data: existing } = await sb
    .from('services')
    .select('id')
    .eq('id', ctx.params.id)
    .eq('tenant_id', auth.ctx.tenantId)
    .maybeSingle()
  if (!existing) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })

  const updates: Record<string, any> = {}
  for (const k of [
    'name', 'description', 'category', 'duration_minutes', 'buffer_minutes',
    'price_amount', 'price_currency', 'sort_order', 'is_active',
  ] as const) {
    if (p[k] !== undefined) updates[k] = k === 'price_currency' && typeof p[k] === 'string' ? (p[k] as string).toUpperCase() : p[k]
  }
  if (Object.keys(updates).length > 0) {
    const { error } = await sb.from('services').update(updates).eq('id', ctx.params.id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  if (p.windows) {
    await sb.from('service_availability_windows').delete().eq('service_id', ctx.params.id)
    if (p.windows.length > 0) {
      const rows = p.windows.map(w => ({
        tenant_id: auth.ctx.tenantId,
        service_id: ctx.params.id,
        weekday: w.weekday,
        start_time: w.start_time,
        end_time: w.end_time,
      }))
      await sb.from('service_availability_windows').insert(rows)
    }
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/apptflow/admin/services/:id — hard delete; cascades windows.
export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })

  const sb = getServiceSupabase()
  const { error } = await sb
    .from('services')
    .delete()
    .eq('id', ctx.params.id)
    .eq('tenant_id', auth.ctx.tenantId)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
