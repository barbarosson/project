import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getServiceSupabase } from '@/lib/beta-reference-code'
import {
  getPublicSiteUrl,
  sendBetaAdminApprovalRequest,
  sendBetaTalepReceivedAck,
} from '@/lib/beta-reference-mail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isMissingTableError(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false
  const m = (err.message || '').toLowerCase()
  return (
    m.includes('does not exist') ||
    m.includes('schema cache') ||
    m.includes('could not find the table') ||
    err.code === '42P01' ||
    err.code === 'PGRST205'
  )
}

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
    return NextResponse.json(
      {
        ok: false,
        error: 'server_config',
        hint:
          'Supabase sunucu anahtarları eksik. Netlify ortamında SUPABASE_SERVICE_ROLE_KEY ve NEXT_PUBLIC_SUPABASE_URL (veya SUPABASE_URL) tanımlı olmalı.',
      },
      { status: 503 }
    )
  }

  const decisionToken = crypto.randomBytes(32).toString('hex')
  const base = getPublicSiteUrl()
  const approveUrl = `${base}/api/beta/reference/decision?token=${encodeURIComponent(decisionToken)}&decision=approve`
  const rejectUrl = `${base}/api/beta/reference/decision?token=${encodeURIComponent(decisionToken)}&decision=reject`

  try {
    const { error: insertError } = await service.from('beta_reference_requests').insert({
      email: emailNorm,
      status: 'pending',
      decision_token: decisionToken,
    })

    if (insertError) {
      if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
        return NextResponse.json({
          ok: true,
          message:
            'Talebiniz alındı. Bu e-posta için zaten bekleyen bir başvuru varsa yeni bildirim gönderilmez; sonuç e-posta ile iletilecektir.',
        })
      }

      if (isMissingTableError(insertError)) {
        console.error('[beta-reference/request] table missing:', insertError)
        return NextResponse.json(
          {
            ok: false,
            error: 'schema_not_ready',
            hint:
              'Supabase veritabanında beta_reference_requests tablosu yok. migrations/20260322130000_beta_reference_requests.sql dosyasını uygulayın.',
          },
          { status: 503 }
        )
      }

      console.error('[beta-reference/request]', insertError)
      return NextResponse.json(
        {
          ok: false,
          error: 'save_failed',
          hint: process.env.NODE_ENV === 'development' ? insertError.message : undefined,
        },
        { status: 500 }
      )
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[beta-reference/request] unexpected', e)
    return NextResponse.json(
      { ok: false, error: 'unexpected', hint: process.env.NODE_ENV === 'development' ? msg : undefined },
      { status: 500 }
    )
  }

  const mail = await sendBetaAdminApprovalRequest({
    requesterEmail: emailNorm,
    approveUrl,
    rejectUrl,
  })

  const ack = await sendBetaTalepReceivedAck({ toEmail: emailNorm })

  if (!mail.ok) {
    console.error('[beta-reference/request] admin mail failed:', mail.error, mail.statusCode)
  }
  if (!ack.ok) {
    console.error('[beta-reference/request] ack mail failed:', ack.error)
  }

  const baseMessage =
    'Talebiniz alındı. Referans kodunuz admin onayından sonra e-posta adresinize gönderilecektir.'

  if (!mail.ok && !ack.ok) {
    return NextResponse.json({
      ok: true,
      message: baseMessage,
      emailAdminSent: false,
      emailAckSent: false,
      warning:
        'E-posta gönderilemedi. Netlify’da RESEND_API_KEY tanımlı mı ve Resend’de gönderici domain doğrulandı mı kontrol edin. Talep veritabanına kaydedildi.',
      mailHint: process.env.NODE_ENV === 'development' ? mail.error : undefined,
    })
  }

  if (!mail.ok) {
    return NextResponse.json({
      ok: true,
      message: baseMessage,
      emailAdminSent: false,
      emailAckSent: ack.ok,
      warning:
        'Admin bildirimi e-postası gönderilemedi (spam kutusu / Resend domain veya alıcı kısıtı). Talep kayıtlıdır; Supabase’den onay linkini manuel oluşturabilir veya Resend ayarlarını düzeltin.',
      mailHint:
        process.env.NODE_ENV === 'development'
          ? mail.error
          : summarizeMailError(mail.error),
    })
  }

  return NextResponse.json({
    ok: true,
    message: baseMessage,
    emailAdminSent: true,
    emailAckSent: ack.ok,
  })
}

function summarizeMailError(err?: string): string | undefined {
  if (!err) return undefined
  const e = err.toLowerCase()
  if (e.includes('domain') || e.includes('verify')) {
    return 'Resend: gönderici domain doğrulanmamış olabilir (resend.com/domains).'
  }
  if (e.includes('sandbox') || e.includes('testing') || e.includes('only')) {
    return 'Resend: test modunda yalnızca doğrulanmış alıcılara izin verilir.'
  }
  return err.length > 160 ? `${err.slice(0, 160)}…` : err
}
