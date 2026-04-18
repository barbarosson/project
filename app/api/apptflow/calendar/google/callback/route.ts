import { NextRequest, NextResponse } from 'next/server'
import { handleOAuthCallback } from '@/lib/apptflow/google-calendar'
import { env } from '@/lib/apptflow/env'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')   // tenant_id
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${env.publicUrl()}/onboarding?google=denied&reason=${encodeURIComponent(error)}`)
  }
  if (!code || !state) {
    return NextResponse.json({ ok: false, error: 'missing_code_or_state' }, { status: 400 })
  }

  try {
    await handleOAuthCallback({ tenantId: state, code })
    return NextResponse.redirect(`${env.publicUrl()}/onboarding?google=connected`)
  } catch (err) {
    return NextResponse.redirect(
      `${env.publicUrl()}/onboarding?google=error&reason=${encodeURIComponent((err as Error).message)}`,
    )
  }
}
