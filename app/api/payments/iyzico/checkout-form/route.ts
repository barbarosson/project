import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { postCheckoutFormInitialize } from '@/lib/iyzico/checkout-form-initialize'

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequest

    const origin = headers().get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const locale = body.locale === 'en' ? 'en' : 'tr'

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

    const apiKey = requiredEnv('IYZICO_API_KEY')
    const secretKey = requiredEnv('IYZICO_SECRET_KEY')
    const baseUri = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'

    // Minimal request for digital service subscription.
    // NOTE: identityNumber is required by iyzico API; merchants should collect/validate it per their compliance needs.
    const initBody = {
      locale,
      conversationId,
      price: price.toFixed(2),
      paidPrice: price.toFixed(2),
      currency: 'TRY',
      basketId: conversationId,
      paymentGroup: 'PRODUCT',
      callbackUrl: `${origin.replace(/\/+$/, '')}/api/payments/iyzico/callback`,
      enabledInstallments: ['1', '2', '3', '6', '9', '12'],
      buyer: {
        id: `buyer_${now}`,
        name: b.name,
        surname: b.surname,
        gsmNumber: b.gsmNumber,
        email: b.email,
        identityNumber: '11111111111',
        lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationAddress: b.address,
        ip: headers().get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1',
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
          name: `${body.plan.name} Plan`,
          category1: 'Subscription',
          itemType: 'VIRTUAL',
          price: price.toFixed(2),
        },
      ],
    }

    const result = await postCheckoutFormInitialize(baseUri, apiKey, secretKey, initBody)

    if (!result || result.status !== 'success') {
      return NextResponse.json(
        { error: result?.errorMessage || 'iyzico initialize failed', raw: result },
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
    const status = msg.startsWith('Missing env:') ? 500 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
