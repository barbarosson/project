import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function baseUrlFromRequest(request: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '')
  if (env) return env
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`
  return 'http://localhost:3000'
}

/**
 * iyzico posts the result to callbackUrl in the user's browser.
 * Returning JSON shows a blank/raw page — redirect to /buy with a clear status instead.
 * Next: call Checkout Form Retrieve API with `token` to finalize payment server-side.
 */
export async function POST(request: Request) {
  let token: string | null = null
  try {
    const ct = request.headers.get('content-type') || ''
    if (ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      token = formData.get('token')?.toString() ?? null
    } else {
      const body = await request.json().catch(() => null)
      if (body && typeof body === 'object' && 'token' in body) {
        token = String((body as { token?: string }).token ?? '') || null
      }
    }
  } catch {
    token = null
  }

  const base = baseUrlFromRequest(request)
  const qs = new URLSearchParams()
  qs.set('payment', 'done')
  if (token) qs.set('token', token)
  const redirectUrl = `${base}/buy?${qs.toString()}`

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Ödeme</title>
  <script>location.replace(${JSON.stringify(redirectUrl)});</script>
</head>
<body style="font-family:system-ui,sans-serif;padding:2rem;">
  <p>Yönlendiriliyorsunuz…</p>
  <p><a href="${redirectUrl.replace(/"/g, '&quot;')}">Devam etmek için tıklayın</a></p>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

/** Some flows may GET the callback — still redirect. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const base = baseUrlFromRequest(request)
  const qs = new URLSearchParams()
  qs.set('payment', 'done')
  if (token) qs.set('token', token)
  return NextResponse.redirect(`${base}/buy?${qs.toString()}`, 302)
}
