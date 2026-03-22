/**
 * Beta referans talepleri — Resend ile e-posta (info@modulustech.app varsayılan)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY

/** Gönderici: doğrulanmış domain; varsayılan ModulusTech */
export function getBetaMailFrom(): string {
  return (
    process.env.BETA_MAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    'Modulus Beta <info@modulustech.app>'
  )
}

/** Admin bildirimleri — virgülle birden fazla adres */
export function getBetaAdminEmails(): string[] {
  const raw =
    process.env.BETA_ADMIN_EMAIL?.trim() ||
    'info@modulustech.app'
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function getPublicSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://modulus.tech').replace(/\/+$/, '')
}

/** Talep sahibine “aldık” onayı — Resend/domain testi için de kullanılır */
export async function sendBetaTalepReceivedAck(params: {
  toEmail: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY tanımlı değil' }
  }

  const from = getBetaMailFrom()
  const admin = getBetaAdminEmails()[0] || 'info@modulustech.app'
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="font-family:system-ui,sans-serif;line-height:1.6;color:#0f172a;max-width:560px;margin:0 auto;padding:24px;">
  <div style="background:#fff;border-radius:16px;padding:24px;border:1px solid #e2e8f0;">
    <h2 style="margin:0 0 12px;color:#0A2540;">Talebiniz alındı</h2>
    <p style="margin:0 0 12px;font-size:14px;color:#475569;">
      Beta referans kodu talebiniz kaydedildi. Onaylandığında kodunuz bu e-posta adresine gönderilecektir.
    </p>
    <p style="font-size:12px;color:#64748b;">
      Sorularınız: <a href="mailto:${escapeHtml(admin)}">${escapeHtml(admin)}</a>
    </p>
  </div>
</body></html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: [params.toEmail],
        reply_to: admin,
        subject: 'Modulus Beta — Talebiniz alındı',
        html,
      }),
    })
    if (!res.ok) {
      return { ok: false, error: await parseResendError(res) }
    }
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

async function parseResendError(res: Response): Promise<string> {
  const t = await res.text()
  try {
    const j = JSON.parse(t) as { message?: string; name?: string }
    return j.message || j.name || t
  } catch {
    return t || `HTTP ${res.status}`
  }
}

export async function sendBetaAdminApprovalRequest(params: {
  requesterEmail: string
  approveUrl: string
  rejectUrl: string
}): Promise<{ ok: boolean; error?: string; statusCode?: number }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY tanımlı değil (Netlify ortam değişkeni).' }
  }

  const admins = getBetaAdminEmails()
  const primaryReply = admins[0] || 'info@modulustech.app'
  const from = getBetaMailFrom()
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="font-family:system-ui,sans-serif;line-height:1.6;color:#0f172a;max-width:560px;margin:0 auto;padding:24px;">
  <div style="background:#fff;border-radius:16px;padding:24px;border:1px solid #e2e8f0;">
    <h2 style="margin:0 0 12px;color:#0A2540;">Beta referans kodu talebi</h2>
    <p style="margin:0 0 8px;font-size:14px;color:#475569;">
      <strong>${escapeHtml(params.requesterEmail)}</strong> adresi beta erişim referans kodu talep etti.
    </p>
    <p style="margin:16px 0;font-size:13px;color:#64748b;">
      Onay veya red için aşağıdaki bağlantılardan birine tıklayın (yalnızca bu e-postadaki bağlantılar geçerlidir):
    </p>
    <p style="margin:20px 0;">
      <a href="${params.approveUrl}" style="display:inline-block;background:#00D4AA;color:#0A2540;padding:12px 24px;border-radius:999px;font-weight:600;text-decoration:none;margin-right:8px;">Onayla</a>
      <a href="${params.rejectUrl}" style="display:inline-block;background:#f1f5f9;color:#64748b;padding:12px 24px;border-radius:999px;font-weight:600;text-decoration:none;border:1px solid #e2e8f0;">Reddet</a>
    </p>
    <p style="font-size:11px;color:#94a3b8;margin-top:24px;">
      Bu mesajlar Modulus beta süreci için <strong>${escapeHtml(primaryReply)}</strong> üzerinden yürütülür.
    </p>
  </div>
</body></html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: admins,
        reply_to: primaryReply,
        subject: `[Beta] Referans kodu talebi: ${params.requesterEmail}`,
        html,
      }),
    })
    if (!res.ok) {
      const err = await parseResendError(res)
      return { ok: false, error: err, statusCode: res.status }
    }
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function sendBetaUserReferenceCode(params: {
  toEmail: string
  referenceCode: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY tanımlı değil' }
  }

  const from = getBetaMailFrom()
  const admin = getBetaAdminEmails()[0] || 'info@modulustech.app'
  const site = getPublicSiteUrl()
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="font-family:system-ui,sans-serif;line-height:1.6;color:#0f172a;max-width:560px;margin:0 auto;padding:24px;">
  <div style="background:#fff;border-radius:16px;padding:24px;border:1px solid #e2e8f0;">
    <h2 style="margin:0 0 12px;color:#0A2540;">Beta referans kodunuz</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;">
      Talebiniz onaylandı. Aşağıdaki referans kodunu ana sayfadaki beta erişim ekranında kullanabilirsiniz:
    </p>
    <p style="font-size:22px;font-weight:700;letter-spacing:2px;background:#0A2540;color:#7DD3FC;padding:16px 20px;border-radius:12px;text-align:center;">
      ${escapeHtml(params.referenceCode)}
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">
      Site: <a href="${site}" style="color:#0ea5e9;">${escapeHtml(site)}</a>
    </p>
    <p style="font-size:11px;color:#94a3b8;margin-top:24px;">
      Sorularınız için: <a href="mailto:${escapeHtml(admin)}">${escapeHtml(admin)}</a>
    </p>
  </div>
</body></html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: [params.toEmail],
        reply_to: admin,
        subject: 'Modulus Beta — Referans kodunuz',
        html,
      }),
    })
    if (!res.ok) {
      const err = await parseResendError(res)
      return { ok: false, error: err }
    }
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function sendBetaUserRejected(params: { toEmail: string }): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY tanımlı değil' }
  }

  const from = getBetaMailFrom()
  const admin = getBetaAdminEmails()[0] || 'info@modulustech.app'
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="font-family:system-ui,sans-serif;line-height:1.6;color:#0f172a;max-width:560px;margin:0 auto;padding:24px;">
  <div style="background:#fff;border-radius:16px;padding:24px;border:1px solid #e2e8f0;">
    <h2 style="margin:0 0 12px;color:#0A2540;">Beta talebiniz hakkında</h2>
    <p style="margin:0;font-size:14px;color:#475569;">
      Maalesef bu talep onaylanmadı. İleride tekrar başvurabilir veya
      <a href="mailto:${escapeHtml(admin)}">${escapeHtml(admin)}</a> üzerinden bizimle iletişime geçebilirsiniz.
    </p>
  </div>
</body></html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: [params.toEmail],
        reply_to: admin,
        subject: 'Modulus Beta — Talep sonucu',
        html,
      }),
    })
    if (!res.ok) {
      const t = await res.text()
      return { ok: false, error: t }
    }
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
