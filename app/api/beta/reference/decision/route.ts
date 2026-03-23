import { NextRequest, NextResponse } from 'next/server'
import { allocateUniqueReferenceCode, getServiceSupabase } from '@/lib/beta-reference-code'
import { sendBetaUserReferenceCode, sendBetaUserRejected } from '@/lib/beta-reference-mail'

export const runtime = 'nodejs'

function htmlPage(title: string, body: string, status: number) {
  const page = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0A2540; color: #f1f5f9; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .box { max-width: 420px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 28px; }
    h1 { font-size: 1.25rem; margin: 0 0 12px; color: #fff; }
    p { margin: 0; line-height: 1.6; color: rgba(255,255,255,0.85); font-size: 14px; }
    a { color: #7DD3FC; }
  </style>
</head>
<body>
  <div class="box">
    <h1>${escapeHtml(title)}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`
  return new NextResponse(page, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim()
  const decision = request.nextUrl.searchParams.get('decision')?.toLowerCase().trim()

  if (!token || token.length < 32) {
    return htmlPage('Geçersiz bağlantı', 'Bu onay bağlantısı geçersiz veya süresi dolmuş olabilir.', 400)
  }

  if (decision !== 'approve' && decision !== 'reject') {
    return htmlPage('Geçersiz işlem', 'decision parametresi approve veya reject olmalıdır.', 400)
  }

  const service = getServiceSupabase()
  if (!service) {
    return htmlPage('Sunucu hatası', 'Yapılandırma eksik. Daha sonra tekrar deneyin.', 500)
  }

  const { data: row, error: findErr } = await service
    .from('beta_reference_requests')
    .select('id, email, status, reference_code')
    .eq('decision_token', token)
    .maybeSingle()

  if (findErr || !row) {
    return htmlPage('Kayıt bulunamadı', 'Bu bağlantı artık geçerli değil veya zaten kullanıldı.', 404)
  }

  if (row.status !== 'pending') {
    return htmlPage(
      'İşlem yapılmış',
      'Bu talep için daha önce işlem yapılmış (onaylandı veya reddedildi).',
      200
    )
  }

  if (decision === 'reject') {
    const { error: upErr } = await service
      .from('beta_reference_requests')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
      })
      .eq('id', row.id)

    if (upErr) {
      console.error('[beta-reference/decision]', upErr)
      return htmlPage('Hata', 'Kayıt güncellenemedi.', 500)
    }

    await sendBetaUserRejected({ toEmail: row.email })
    return htmlPage(
      'Red kaydedildi',
      'Talep reddedildi. Kullanıcıya bilgilendirme e-postası gönderildi (e-posta yapılandırması açıksa).',
      200
    )
  }

  // approve
  const refCode = await allocateUniqueReferenceCode(service)
  if (!refCode) {
    return htmlPage('Kod üretilemedi', 'Benzersiz referans kodu oluşturulamadı. Lütfen tekrar deneyin.', 500)
  }

  const { error: upErr } = await service
    .from('beta_reference_requests')
    .update({
      status: 'approved',
      reference_code: refCode,
      approved_at: new Date().toISOString(),
    })
    .eq('id', row.id)

  if (upErr) {
    console.error('[beta-reference/decision]', upErr)
    return htmlPage('Hata', 'Onay kaydedilemedi.', 500)
  }

  const mail = await sendBetaUserReferenceCode({ toEmail: row.email, referenceCode: refCode })
  if (!mail.ok) {
    console.error('[beta-reference/decision] user mail:', mail.error)
    return htmlPage(
      'Onaylandı (e-posta uyarısı)',
      `Referans kodu ${escapeHtml(refCode)} kaydedildi ancak kullanıcıya e-posta gönderilemedi. Resend yapılandırmasını kontrol edin. Kullanıcıya kodu manuel iletin.`,
      200
    )
  }

  return htmlPage(
    'Onay tamamlandı',
    `Referans kodu ${escapeHtml(refCode)} oluşturuldu ve ${escapeHtml(row.email)} adresine gönderildi.`,
    200
  )
}
