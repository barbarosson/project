/**
 * iyzipay-node reads `resources/` via fs at import time — it breaks on Netlify/AWS Lambda
 * (ENOENT scandir .../checkout-form/resources). This module calls the same REST endpoint with
 * IYZWSv2 auth (same algorithm as iyzipay-node/lib/utils.js) using only crypto + fetch.
 */

import crypto from 'crypto'

const CHECKOUT_FORM_INITIALIZE_PATH = '/payment/iyzipos/checkoutform/initialize/auth/ecom'

function formatPrice(price: string | number): string {
  if ((typeof price !== 'number' && typeof price !== 'string') || !isFinite(Number(price))) {
    return String(price)
  }
  const resultPrice = parseFloat(String(price)).toString()
  if (resultPrice.indexOf('.') === -1) {
    return `${resultPrice}.0`
  }
  return resultPrice
}

/** Same as iyzipay-node `utils.generateRandomString(8)` */
function generateRandomString(size: number): string {
  return process.hrtime()[0] + Math.random().toString(size).slice(2)
}

function generateAuthorizationHeaderV2(
  apiKey: string,
  secretKey: string,
  uriPath: string,
  body: Record<string, unknown>,
  randomString: string
): string {
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(randomString + uriPath + JSON.stringify(body))
    .digest('hex')

  const authorizationParams = [
    `apiKey:${apiKey}`,
    `randomKey:${randomString}`,
    `signature:${signature}`,
  ]
  return `IYZWSv2 ${Buffer.from(authorizationParams.join('&')).toString('base64')}`
}

function buyerBody(data: Record<string, unknown>) {
  return {
    id: data.id,
    name: data.name,
    surname: data.surname,
    identityNumber: data.identityNumber,
    email: data.email,
    gsmNumber: data.gsmNumber,
    registrationDate: data.registrationDate,
    lastLoginDate: data.lastLoginDate,
    registrationAddress: data.registrationAddress,
    city: data.city,
    country: data.country,
    zipCode: data.zipCode,
    ip: data.ip,
  }
}

function addressBody(data: Record<string, unknown>) {
  return {
    address: data.address,
    zipCode: data.zipCode,
    contactName: data.contactName,
    city: data.city,
    country: data.country,
  }
}

function basketItemBody(data: Record<string, unknown>) {
  return {
    id: data.id,
    price: formatPrice(data.price as string | number),
    name: data.name,
    category1: data.category1,
    category2: data.category2,
    itemType: data.itemType,
    subMerchantKey: data.subMerchantKey,
    subMerchantPrice:
      data.subMerchantPrice != null && data.subMerchantPrice !== ''
        ? formatPrice(data.subMerchantPrice as string | number)
        : undefined,
    withholdingTax:
      data.withholdingTax != null && data.withholdingTax !== ''
        ? formatPrice(data.withholdingTax as string | number)
        : undefined,
  }
}

export type CheckoutFormInitializeInput = {
  locale: string
  conversationId: string
  price: string | number
  paidPrice: string | number
  currency: string
  basketId: string
  paymentGroup: string
  callbackUrl: string
  enabledInstallments: string[]
  buyer: Record<string, unknown>
  shippingAddress: Record<string, unknown>
  billingAddress: Record<string, unknown>
  basketItems: Array<Record<string, unknown>>
}

/** Mirrors iyzipay-node `CreateCheckoutFormInitializeRequest` → `toJson()` field order. */
export function buildCheckoutFormInitializeBody(
  request: CheckoutFormInitializeInput
): Record<string, unknown> {
  const basketItems = request.basketItems.map((basketItem) => basketItemBody(basketItem))
  return {
    locale: request.locale,
    conversationId: request.conversationId,
    price: formatPrice(request.price),
    basketId: request.basketId,
    paymentGroup: request.paymentGroup,
    buyer: buyerBody(request.buyer),
    shippingAddress: addressBody(request.shippingAddress),
    billingAddress: addressBody(request.billingAddress),
    basketItems,
    callbackUrl: request.callbackUrl,
    currency: request.currency,
    paidPrice: formatPrice(request.paidPrice),
    enabledInstallments: request.enabledInstallments,
  }
}

export type CheckoutFormInitializeResponse = {
  status?: string
  errorMessage?: string
  errorCode?: string
  token?: string
  tokenExpireTime?: number
  checkoutFormContent?: string
  paymentPageUrl?: string
  [key: string]: unknown
}

export async function postCheckoutFormInitialize(
  baseUri: string,
  apiKey: string,
  secretKey: string,
  request: CheckoutFormInitializeInput
): Promise<CheckoutFormInitializeResponse> {
  const uri = baseUri.replace(/\/+$/, '')
  const path = CHECKOUT_FORM_INITIALIZE_PATH
  const url = `${uri}${path}`
  const body = buildCheckoutFormInitializeBody(request)
  const randomString = generateRandomString(8)
  const authorization = generateAuthorizationHeaderV2(apiKey, secretKey, path, body, randomString)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: authorization,
      'x-iyzi-rnd': randomString,
      'x-iyzi-client-version': 'iyzipay-node-2.0.65',
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  let json: CheckoutFormInitializeResponse
  try {
    json = JSON.parse(text) as CheckoutFormInitializeResponse
  } catch {
    throw new Error(`iyzico non-JSON response (${res.status}): ${text.slice(0, 240)}`)
  }

  if (!res.ok) {
    throw new Error(json.errorMessage || `iyzico HTTP ${res.status}`)
  }

  return json
}
