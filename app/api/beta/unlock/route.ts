import { NextResponse } from 'next/server'
import {
  BETA_COOKIE_NAME,
  getBetaAccessCode,
} from '@/lib/beta-access'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { code?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const expected = getBetaAccessCode()
  const code = (body.code || '').trim()
  if (code !== expected) {
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
