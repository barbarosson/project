import { createHmac } from 'crypto'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type CheckoutRequest = {
  locale?: 'tr' | 'en'
  plan: {
    id: string
    name: string
    price: number
  }
  buyer: {
    name: string
    surname: string
    email: string
    gsmNumber: string
    address: string
    city: string
    country: string
  }
}

function requiredEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

/**
 * iyzico IYZWSv2 imza algoritması (SDK'sız, pure Node.js)
 * Ref: https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth
 */
function generateAuthorizationHeader(
  apiKey: string,
  secretKey: string,
  uri: string,
  body: string
): { authorization: string; randomKey: string } {
  const randomKey = Date.now().toString() + Math.random().toString(36).substring(2, 10)
  const payload = randomKey + uri + body
  const signature = createHmac('sha256', secretKey)
    .update(payload, 'utf8')
    .digest('hex')
  const authorizationParams = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`
  const authorization = `IYZWSv2 ${Buffer.from(authorizationParams).toString('base64')}`
  return { authorization, randomKey }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequest

    const apiKey = requiredEnv('IYZICO_API_KEY')
    const secretKey = requiredEnv('IYZICO_SECRET_KEY')
    const baseUrl = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
    const origin = headers().get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const price = Number(body.plan?.price)
    if (!body.plan?.id || !body.plan?.name || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: 'Invalid plan payload' }, { status: 400 })
    }

    const b = body.buyer
    if (!b?.name || !b?.surname || !b?.email || !b?.gsmNumber || !b?.address || !b?.city || !b?.country) {
      return NextResponse.json({ error: 'Missing buyer fields' }, { status: 400 })
    }

    const now = Date.now()
    const conversationId = `plan_${body.plan.id}_${now}`
    const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
    const dateStr = new Date().toISOString().slice(0, 19).replace('T', ' ')

    const requestBody = {
      locale: body.locale === 'en' ? 'en' : 'tr',
      conversationId,
      price: price.toFixed(2),
      paidPrice: price.toFixed(2),
      currency: 'TRY',
      installment: '1',
      basketId: conversationId,
      paymentGroup: 'PRODUCT',
      callbackUrl: `${origin}/api/payments/iyzico/callback`,
      enabledInstallments: [1, 2, 3, 6, 9, 12],
      buyer: {
        id: `buyer_${now}`,
        name: b.name,
        surname: b.surname,
        gsmNumber: b.gsmNumber,
        email: b.email,
        identityNumber: '11111111111',
        lastLoginDate: dateStr,
        registrationDate: dateStr,
        registrationAddress: b.address,
        ip,
        city: b.city,
        country: b.country,
        zipCode: '00000',
      },
      shippingAddress: {
        contactName: `${b.name} ${b.surname}`,
        city: b.city,
        country: b.country,
        address: b.address,
        zipCode: '00000',
      },
      billingAddress: {
        contactName: `${b.name} ${b.surname}`,
        city: b.city,
        country: b.country,
        address: b.address,
        zipCode: '00000',
      },
      basketItems: [
        {
          id: body.plan.id,
          name: `${body.plan.name} Plan`.slice(0, 50),
          category1: 'Subscription',
          itemType: 'VIRTUAL',
          price: price.toFixed(2),
        },
      ],
    }

    const uri = '/payment/iyzipos/checkoutform/initialize/auth/ecom'
    const jsonBody = JSON.stringify(requestBody)
    const { authorization, randomKey } = generateAuthorizationHeader(apiKey, secretKey, uri, jsonBody)

    const response = await fetch(`${baseUrl}${uri}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authorization,
        'x-iyzi-rnd': randomKey,
      },
      body: jsonBody,
    })

    const result = await response.json()

    if (!result || result.status !== 'success') {
      console.error('[iyzico] checkout-form error:', JSON.stringify(result, null, 2))
      return NextResponse.json(
        { error: result?.errorMessage || 'iyzico initialize failed', errorCode: result?.errorCode, raw: result },
        { status: 400 }
      )
    }

    return NextResponse.json({
      token: result.token,
      tokenExpireTime: result.tokenExpireTime,
      checkoutFormContent: result.checkoutFormContent,
      paymentPageUrl: result.paymentPageUrl,
      conversationId,
    })
  } catch (e: any) {
    const msg = e?.message || 'Unexpected error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
