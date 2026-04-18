import crypto from 'node:crypto'
import { env } from './env'
import { recordUsage } from './cost'

// WhatsApp Cloud API v20 endpoints.
const GRAPH = 'https://graph.facebook.com/v20.0'

function phoneNumberId(override?: string | null): string {
  return override?.trim() ? override.trim() : env.waPhoneNumberId()
}

export interface SendTextArgs {
  to: string                           // E.164 without '+', e.g. 15551234567
  text: string
  previewUrl?: boolean
  tenantId: string                     // for usage accounting
  phoneNumberIdOverride?: string | null
}

export async function sendText(args: SendTextArgs): Promise<{ messageId: string }> {
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: args.to,
    type: 'text',
    text: { body: args.text, preview_url: args.previewUrl ?? false },
  }
  const res = await fetch(`${GRAPH}/${phoneNumberId(args.phoneNumberIdOverride)}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.waAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`WhatsApp sendText failed: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { messages?: { id: string }[] }
  const id = json.messages?.[0]?.id ?? ''
  await recordUsage(args.tenantId, 'whatsapp.outbound', 1, { type: 'text' })
  return { messageId: id }
}

export interface SendTemplateArgs {
  to: string
  templateName: string
  languageCode: string                 // 'en_US', 'tr', 'es_ES'...
  variables?: string[]
  tenantId: string
  phoneNumberIdOverride?: string | null
}

export async function sendTemplate(args: SendTemplateArgs): Promise<{ messageId: string }> {
  const components = args.variables && args.variables.length > 0
    ? [{
        type: 'body',
        parameters: args.variables.map(v => ({ type: 'text', text: v })),
      }]
    : undefined

  const body = {
    messaging_product: 'whatsapp',
    to: args.to,
    type: 'template',
    template: {
      name: args.templateName,
      language: { code: args.languageCode },
      components,
    },
  }
  const res = await fetch(`${GRAPH}/${phoneNumberId(args.phoneNumberIdOverride)}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.waAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`WhatsApp sendTemplate failed: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { messages?: { id: string }[] }
  const id = json.messages?.[0]?.id ?? ''
  await recordUsage(args.tenantId, 'whatsapp.outbound', 1, {
    type: 'template', template: args.templateName,
  })
  return { messageId: id }
}

// Meta signs webhook requests with sha256 HMAC using the app secret.
export function verifyWebhookSignature(rawBody: string, headerValue: string | null): boolean {
  if (!headerValue) return false
  const expected = 'sha256=' + crypto
    .createHmac('sha256', env.waAppSecret())
    .update(rawBody, 'utf8')
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(headerValue))
  } catch {
    return false
  }
}

// Simple rule-based intent detector in several languages. This is a
// floor — the orchestrator may upgrade to an LLM call when confidence
// is low, but having a free-tier deterministic path keeps costs down.
export interface Intent {
  intent: 'book' | 'cancel' | 'reschedule' | 'confirm' | 'info' | 'unknown'
  confidence: number
}

export function detectIntent(text: string): Intent {
  const t = text.toLowerCase().trim()
  if (!t) return { intent: 'unknown', confidence: 0 }
  const rules: Array<[RegExp, Intent['intent']]> = [
    [/\b(cancel|iptal|annul|stornier|отмена|cancelar|annulla|إلغاء)\b/, 'cancel'],
    [/\b(reschedule|ertele|change|cambiar|mover|verschieben|перенести|spostare|تعديل)\b/, 'reschedule'],
    [/\b(yes|evet|si|sí|oui|ja|да|sim|نعم|confirm)\b/, 'confirm'],
    [/\b(book|randevu|reserve|reservar|prenota|termin|buchen|запись|حجز)\b/, 'book'],
    [/\b(price|fiyat|precio|prix|preis|цена|prezzo|سعر|cost)\b/, 'info'],
  ]
  for (const [re, intent] of rules) if (re.test(t)) return { intent, confidence: 0.85 }
  return { intent: 'unknown', confidence: 0.2 }
}
