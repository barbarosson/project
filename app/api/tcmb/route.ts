import { NextRequest, NextResponse } from 'next/server'
import { getTcmbRatesForDate } from '@/lib/tcmb'

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date')
  const dateStr = date || new Date().toISOString().slice(0, 10)
  try {
    const rates = await getTcmbRatesForDate(dateStr)
    return NextResponse.json(rates || {})
  } catch (e) {
    console.error('TCMB fetch error:', e)
    return NextResponse.json({}, { status: 200 })
  }
}
