import { NextResponse } from 'next/server'
import { BETA_COOKIE_NAME } from '@/lib/beta-access'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const unlocked = request.cookies.get(BETA_COOKIE_NAME)?.value === '1'
  return NextResponse.json({ unlocked })
}
