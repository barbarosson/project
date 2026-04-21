import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServiceSupabase } from '@/lib/apptflow/supabase'
import { requireAdmin } from '@/lib/apptflow/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/apptflow/admin/business-hours
// Returns the tenant's general business-hours windows (fallback used by
// the slot engine when a service doesn't declare its own windows).
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })

  const sb = getServiceSupabase()
  const { data, error } = await sb
    .from('business_hours')
    .select('id, weekday, start_time, end_time, is_active')
    .eq('tenant_id', auth.ctx.tenantId)
    .order('weekday', { ascending: true })
    .order('start_time', { ascending: true })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, windows: data ?? [] })
}

const putSchema = z.object({
  windows: z.array(
    z.object({
      weekday: z.number().int().min(0).max(6),
      start_time: z.string().regex(/^\d{2}:\d{2}$/),
      end_time: z.string().regex(/^\d{2}:\d{2}$/),
    }),
  ),
})

// PUT /api/apptflow/admin/business-hours
// Atomically replaces all tenant-level windows with the provided set.
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const sb = getServiceSupabase()
  await sb.from('business_hours').delete().eq('tenant_id', auth.ctx.tenantId)
  if (parsed.data.windows.length > 0) {
    const rows = parsed.data.windows.map(w => ({
      tenant_id: auth.ctx.tenantId,
      weekday: w.weekday,
      start_time: w.start_time,
      end_time: w.end_time,
    }))
    const { error } = await sb.from('business_hours').insert(rows)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
