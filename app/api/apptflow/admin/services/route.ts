import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServiceSupabase } from '@/lib/apptflow/supabase'
import { requireAdmin } from '@/lib/apptflow/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/apptflow/admin/services
// Returns all services (active + inactive) for the caller's tenant with
// their availability windows embedded.
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })

  const sb = getServiceSupabase()
  const { data: services, error } = await sb
    .from('services')
    .select('id, name, description, category, duration_minutes, buffer_minutes, price_amount, price_currency, sort_order, is_active, created_at, updated_at')
    .eq('tenant_id', auth.ctx.tenantId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const serviceIds = (services ?? []).map(s => s.id)
  let windowsByService: Record<string, any[]> = {}
  if (serviceIds.length > 0) {
    const { data: windows } = await sb
      .from('service_availability_windows')
      .select('id, service_id, weekday, start_time, end_time, is_active')
      .in('service_id', serviceIds)
      .order('weekday', { ascending: true })
      .order('start_time', { ascending: true })
    for (const w of windows ?? []) {
      (windowsByService[w.service_id] ||= []).push(w)
    }
  }

  const hydrated = (services ?? []).map(s => ({
    ...s,
    windows: windowsByService[s.id] ?? [],
  }))

  return NextResponse.json({ ok: true, services: hydrated })
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  category: z.string().max(60).optional(),
  duration_minutes: z.number().int().min(5).max(600),
  buffer_minutes: z.number().int().min(0).max(240).default(0),
  price_amount: z.number().min(0),
  price_currency: z.string().length(3).default('USD'),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
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

// POST /api/apptflow/admin/services  — create a new service
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 })
  }
  const p = parsed.data

  const sb = getServiceSupabase()
  const { data: created, error } = await sb
    .from('services')
    .insert({
      tenant_id: auth.ctx.tenantId,
      name: p.name,
      description: p.description ?? null,
      category: p.category ?? null,
      duration_minutes: p.duration_minutes,
      buffer_minutes: p.buffer_minutes,
      price_amount: p.price_amount,
      price_currency: p.price_currency.toUpperCase(),
      sort_order: p.sort_order,
      is_active: p.is_active,
    })
    .select('id')
    .single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  if (p.windows && p.windows.length > 0) {
    const rows = p.windows.map(w => ({
      tenant_id: auth.ctx.tenantId,
      service_id: created.id,
      weekday: w.weekday,
      start_time: w.start_time,
      end_time: w.end_time,
    }))
    await sb.from('service_availability_windows').insert(rows)
  }

  return NextResponse.json({ ok: true, service_id: created.id })
}
