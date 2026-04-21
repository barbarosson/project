// Lightweight inbound-message language detector.
//
// Goals:
//   * Zero dependencies (no CLD, no franc), runs in edge-safe Node.
//   * Optimised for short messages (< 100 chars) that dominate WhatsApp.
//   * Correct > clever: if we can't confidently tell, return the tenant's
//     fallback locale rather than guessing.
//
// Strategy (shortest-wins order):
//   1. Strong script hints — Arabic, Cyrillic alphabets are single-locale.
//   2. Turkish-specific diacritics (ı, İ, ş, ğ, ç, ö, ü distinguish TR
//      from ES/DE/FR/PT/IT even in very short strings).
//   3. Word-list probes for Latin-script languages.
//   4. Fallback.

import type { LocaleCode } from './types'

const TR_SPECIFIC_CHARS = /[ıİşŞğĞçÇöÖüÜ]/
const ARABIC_SCRIPT     = /[\u0600-\u06FF]/
const CYRILLIC_SCRIPT   = /[\u0400-\u04FF]/

// Ordered by specificity: Turkish first (unique characters + common words
// that rarely collide), then romance/germanic by frequency of use in our
// target markets. English is last because many words overlap.
const WORD_MARKERS: Array<[LocaleCode, RegExp]> = [
  ['tr', /\b(merhaba|selam|günaydın|iyi\s?günler|randevu\w*|fiyat|saat|kaçta|kacta|müsait\w*|musait\w*|öğleden|ogleden|iptal|edelim|açık|kapalı|evet|hayır|teşekkür|lütfen|nasıl|nerede|ne\s?kadar|var\s?mı|yok\s?mu|bugün|yarın)\b/i],
  ['es', /\b(hola|buenos\s?días|gracias|por\s?favor|precio|cita|cuánto|cuándo|dónde|cómo|sí|hoy|mañana)\b/i],
  ['de', /\b(hallo|guten\s?tag|danke|bitte|preis|termin|wie\s?viel|wann|wo|ja|heute|morgen)\b/i],
  ['fr', /\b(bonjour|merci|s'il\s?vous\s?plaît|prix|rendez-vous|combien|quand|où|oui|aujourd'hui|demain)\b/i],
  ['pt', /\b(olá|bom\s?dia|obrigado|obrigada|por\s?favor|preço|agendamento|quanto|quando|onde|sim|hoje|amanhã)\b/i],
  ['it', /\b(ciao|buongiorno|grazie|per\s?favore|prezzo|appuntamento|quanto|quando|dove|sì|oggi|domani)\b/i],
  ['en', /\b(hello|hi|good\s?morning|thanks|thank\s?you|please|price|appointment|how\s?much|when|where|yes|today|tomorrow)\b/i],
]

export function detectLocale(
  text: string,
  fallback: LocaleCode,
): LocaleCode {
  if (!text || !text.trim()) return fallback

  // 1) Script hints (strong signal, rarely wrong).
  if (ARABIC_SCRIPT.test(text))   return 'ar'
  if (CYRILLIC_SCRIPT.test(text)) return 'ru'

  // 2) Turkish-specific diacritic hit: treat as Turkish even for a single
  //    character. Short messages like "tamam" miss this, but the word
  //    list below will still catch them.
  if (TR_SPECIFIC_CHARS.test(text)) return 'tr'

  // 3) Word-based probes in priority order.
  for (const [locale, re] of WORD_MARKERS) {
    if (re.test(text)) return locale
  }

  // 4) Give up — use the tenant's default.
  return fallback
}
