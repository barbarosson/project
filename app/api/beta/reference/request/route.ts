import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getServiceSupabase } from '@/lib/beta-reference-code'
import { getPublicSiteUrl, sendBetaAdminApprovalRequest } from '@/lib/beta-reference-mail'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAIL_DEBUG_ENABLED = process.env.BETA_MAIL_DEBUG === '1'

export async function POST(request: NextRequest) {
  let body: { email?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const raw = body.email
  if (!raw || typeof raw !== 'string') {
    return NextResponse.json({ ok: false, error: 'email_required' }, { status: 400 })
  }

  const emailNorm = raw.trim().toLowerCase()
  if (!EMAIL_RE.test(emailNorm)) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
  }

  const service = getServiceSupabase()
  if (!service) {
    return NextResponse.json({ ok: false, error: 'server_config' }, { status: 500 })
  }

  const decisionToken = crypto.randomBytes(32).toString('hex')
  const base = getPublicSiteUrl()
  const approveUrl = `${base}/api/beta/reference/decision?token=${encodeURIComponent(decisionToken)}&decision=approve`
  const rejectUrl = `${base}/api/beta/reference/decision?token=${encodeURIComponent(decisionToken)}&decision=reject`

  const { error: insertError } = await service.from('beta_reference_requests').insert({
    email: emailNorm,
    status: 'pending',
    decision_token: decisionToken,
  })

  if (insertError) {
    // unique pending per email
    if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
      return NextResponse.json({
        ok: true,
        message:
          'Talebiniz alındı. Bu e-posta için zaten bekleyen bir başvuru varsa yeni bildirim gönderilmez; sonuç e-posta ile iletilecektir.',
      })
    }
    console.error('[beta-reference/request]', insertError)
    return NextResponse.json({ ok: false, error: 'save_failed' }, { status: 500 })
  }

  const mail = await sendBetaAdminApprovalRequest({
    requesterEmail: emailNorm,
    approveUrl,
    rejectUrl,
  })

  if (!mail.ok) {
    console.error('[beta-reference/request] admin mail failed:', mail.error)
    // Talep kayıtlı; admin e-postası gidemezse yine de kullanıcıya genel mesaj
    return NextResponse.json({
      ok: true,
      message:
        'Talebiniz alındı. Referans kodunuz admin onayından sonra e-posta adresinize gönderilecektir.',
      emailAdminSent: false,
      ...(MAIL_DEBUG_ENABLED && { mailError: mail.error || 'unknown' }),
    })
  }

  return NextResponse.json({
    ok: true,
    message:
      'Talebiniz alındı. Referans kodunuz admin onayından sonra e-posta adresinize gönderilecektir.',
    emailAdminSent: true,
  })
}
