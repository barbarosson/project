import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/apptflow/google-calendar'

export const runtime = 'nodejs'

// GET /api/apptflow/calendar/google/start?tenant_id=...
// Redirects the tenant owner to Google's consent screen. `state` is the
// tenant_id so the callback knows which tenant to link the tokens to.
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenant_id')
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: 'missing_tenant_id' }, { status: 400 })
  }
  const url = getAuthUrl(tenantId)
  return NextResponse.redirect(url)
}
