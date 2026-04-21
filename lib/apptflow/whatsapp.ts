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

  // Order matters: cancel beats reschedule beats book when multiple
  // hits collide (e.g. "cancel and reschedule"). Confirm stays near the
  // top because "yes" is very short and ambiguous.
  const rules: Array<[RegExp, Intent['intent']]> = [
    // — CANCEL
    [/\b(cancel|iptal|annul|stornier|отмена|cancelar|annulla|إلغاء)\b/, 'cancel'],

    // — RESCHEDULE
    [/\b(reschedule|ertele|change|cambiar|mover|verschieben|перенести|spostare|تعديل)\b/, 'reschedule'],

    // — CONFIRM (short answers like "yes / evet / sí")
    [/\b(yes|evet|tamam|olur|ok|okay|si|sí|oui|ja|да|sim|نعم|confirm)\b/, 'confirm'],

    // — BOOK: explicit booking words
    [/\b(book|reserve|reservar|prenota|termin|buchen|запись|حجز)\b/, 'book'],
    [/\b(randevu|rdv|appuntamento|agendamento|cita|appointment)\b/, 'book'],

    // — BOOK: "is it available / are there slots" in 9 languages.
    //    These natural phrasings should kick off the slot flow without
    //    forcing the customer to say the magic word "book".
    //    TR
    [/\b(müsait|musait|uygun|boş|bos|açık|acik|mevcut)\b/, 'book'],
    //    EN
    [/\b(available|free|open|slot|slots|opening|openings)\b/, 'book'],
    //    ES / PT
    [/\b(disponible|disponibles|libre|horário|horario|agendar)\b/, 'book'],
    //    DE
    [/\b(frei|verfügbar|verfugbar|verfuegbar)\b/, 'book'],
    //    FR
    [/\b(disponible|disponibles|libre|créneau|creneau|créneaux|creneaux)\b/, 'book'],
    //    IT
    [/\b(libero|libera|disponibile|disponibili)\b/, 'book'],
    //    RU (cyrillic — can't use \b here because of Unicode word boundary)
    [/(свободн|доступн|запис)/i, 'book'],
    //    AR
    [/(متاح|متوفر|موعد)/, 'book'],

    // — BOOK: "other / more / another time" follow-ups.
    //    When a previous turn already offered slots and the customer
    //    wants to see something different.
    [/\b(başka|baska|diğer|diger|another|other|another\s?time|more\s?slots?|more\s?times?)\b/, 'book'],
    [/\b(otro|otra|otros|otras|autres?|andere|anderen|altre?|altri|altro|outro|outra|outros|outras)\b/, 'book'],
    [/(другой|другое|другие|ещё|еще|أخرى|آخر|المزيد)/, 'book'],

    // — INFO: price / cost questions that are NOT about availability
    [/\b(price|fiyat|ücret|ucret|kaç\s?para|ne\s?kadar|precio|cuánto|cuanto|prix|combien|preis|wie\s?viel|цена|сколько|prezzo|quanto|سعر|cost|costs)\b/, 'info'],
  ]

  for (const [re, intent] of rules) if (re.test(t)) return { intent, confidence: 0.85 }
  return { intent: 'unknown', confidence: 0.2 }
}
