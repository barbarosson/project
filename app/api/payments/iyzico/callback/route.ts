import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// iyzico calls this URL after payment attempt.
// You can extend this to persist payment results, activate subscriptions, etc.
export async function POST(request: Request) {
  try {
    const formData = await request.formData().catch(() => null)
    const token = formData?.get('token')?.toString() || null

    // For now we just acknowledge callback.
    // A real implementation should call checkoutForm.retrieve with the token
    // and update subscription records accordingly.
    return NextResponse.json({ ok: true, token })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

