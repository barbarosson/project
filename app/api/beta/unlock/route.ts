import { NextResponse } from 'next/server'
import {
  BETA_COOKIE_NAME,
  getBetaAccessCode,
} from '@/lib/beta-access'
import { isValidBetaAccessCode } from '@/lib/beta-reference-code'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { code?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const code = (body.code || '').trim()
  let allowed = code === getBetaAccessCode()
  if (!allowed) {
    allowed = await isValidBetaAccessCode(code)
  }
  if (!allowed) {
    return NextResponse.json({ ok: false, error: 'invalid_code' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(BETA_COOKIE_NAME, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90, // 90 gün
  })
  return res
}
