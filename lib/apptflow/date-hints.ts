// Lightweight natural-language date-hint parser.
//
// Scope: pull a *day* preference out of a short WhatsApp message, e.g.
//   "perşembe günü için randevu"       → Thursday
//   "can I come tomorrow?"             → +1 day
//   "hoy a las 3"                      → today
//
// Out of scope (intentionally): exact times, calendar-month dates
// ("17 Nisan"), relative weeks ("next week"). Times are handled later
// by pickSlot(); exact-date support can be layered on top of this.
//
// Everything is timezone-aware so "Thursday" means Thursday in the
// tenant's local calendar, not UTC.

import type { LocaleCode } from './types'

// 0 = Sunday … 6 = Saturday (matches JS getDay / en-US weekday part).
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type DayHint =
  | { kind: 'weekday'; weekday: Weekday }
  | { kind: 'relative'; delta: 0 | 1 } // today | tomorrow

// ---------- Parsing ----------

const WEEKDAY_PATTERNS: Array<[Weekday, RegExp[]]> = [
  [0, [/\bpazar\b/i, /\bsunday\b/i, /\bdomingo\b/i, /\bdimanche\b/i, /\bsonntag\b/i, /\bdomenica\b/i, /\bвоскресен/i, /الأحد/]],
  [1, [/\bpazartesi\b/i, /\bmonday\b/i, /\blunes\b/i, /\blundi\b/i, /\bmontag\b/i, /\blunedì\b/i, /\blunedi\b/i, /\bsegunda-?feira\b/i, /\bпонедельн/i, /الاثنين/]],
  [2, [/\bsalı\b/i, /\bsali\b/i, /\btuesday\b/i, /\bmartes\b/i, /\bmardi\b/i, /\bdienstag\b/i, /\bmartedì\b/i, /\bmartedi\b/i, /\bterça-?feira\b/i, /\bterca-?feira\b/i, /\bвторник/i, /الثلاثاء/]],
  [3, [/\bçarşamba\b/i, /\bcarsamba\b/i, /\bwednesday\b/i, /\bmiércoles\b/i, /\bmiercoles\b/i, /\bmercredi\b/i, /\bmittwoch\b/i, /\bmercoledì\b/i, /\bmercoledi\b/i, /\bquarta-?feira\b/i, /\bсреда/i, /الأربعاء/]],
  [4, [/\bperşembe\b/i, /\bpersembe\b/i, /\bthursday\b/i, /\bjueves\b/i, /\bjeudi\b/i, /\bdonnerstag\b/i, /\bgiovedì\b/i, /\bgiovedi\b/i, /\bquinta-?feira\b/i, /\bчетверг/i, /الخميس/]],
  [5, [/\bcuma\b/i, /\bfriday\b/i, /\bviernes\b/i, /\bvendredi\b/i, /\bfreitag\b/i, /\bvenerdì\b/i, /\bvenerdi\b/i, /\bsexta-?feira\b/i, /\bпятниц/i, /الجمعة/]],
  [6, [/\bcumartesi\b/i, /\bsaturday\b/i, /\bsábado\b/i, /\bsabado\b/i, /\bsamedi\b/i, /\bsamstag\b/i, /\bsabato\b/i, /\bсуббот/i, /السبت/]],
]

const TODAY_RE    = /\b(today|bugün|bugun|hoy|aujourd['’]hui|heute|oggi|hoje|сегодня)\b|اليوم/i
const TOMORROW_RE = /\b(tomorrow|yarın|yarin|mañana|manana|demain|morgen|domani|amanhã|amanha|завтра)\b|غد[اً]?/i

export function parseDayHint(text: string): DayHint | null {
  if (!text) return null
  // Order matters: "today"/"tomorrow" are less ambiguous than weekday
  // names, so try them first.
  if (TOMORROW_RE.test(text)) return { kind: 'relative', delta: 1 }
  if (TODAY_RE.test(text))    return { kind: 'relative', delta: 0 }
  for (const [wd, patterns] of WEEKDAY_PATTERNS) {
    for (const re of patterns) {
      if (re.test(text)) return { kind: 'weekday', weekday: wd }
    }
  }
  return null
}

// ---------- Day-bound computation (tenant-timezone aware) ----------

interface TzYMD {
  year: number
  month: number   // 1-12
  day: number     // 1-31
  weekday: Weekday
}

// Current wall-clock date in the given timezone, as integer fields.
// Uses Intl.DateTimeFormat so it works on Node/Edge without extra deps.
function tzToday(tz: string, now: Date = new Date()): TzYMD {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
  const parts = fmt.formatToParts(now)
  const g: Record<string, string> = {}
  for (const p of parts) g[p.type] = p.value
  const WD: Record<string, Weekday> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  return {
    year: Number(g.year),
    month: Number(g.month),
    day: Number(g.day),
    weekday: WD[g.weekday] ?? 0,
  }
}

// Construct a Date whose UTC value corresponds to the wall-clock
// `y-m-d h:mi` in `tz`. Handles DST by letting Intl tell us the
// tz offset for that exact moment.
function tzWallToUtc(
  y: number,
  m: number,
  d: number,
  h: number,
  mi: number,
  tz: string,
): Date {
  const utcGuess = Date.UTC(y, m - 1, d, h, mi, 0, 0)
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(new Date(utcGuess))
  const g: Record<string, string> = {}
  for (const p of parts) g[p.type] = p.value
  const seenY  = Number(g.year)
  const seenMo = Number(g.month)
  const seenD  = Number(g.day)
  const seenH  = Number(g.hour === '24' ? '0' : g.hour)
  const seenMi = Number(g.minute)
  const seenUtc = Date.UTC(seenY, seenMo - 1, seenD, seenH, seenMi, 0, 0)
  const tzOffsetMs = seenUtc - utcGuess                   // +03:00 → +3h
  return new Date(utcGuess - tzOffsetMs)
}

export function computeDayBounds(
  hint: DayHint,
  tz: string,
  now: Date = new Date(),
): { fromISO: string; toISO: string; targetWeekday: Weekday; targetYMD: string } {
  const today = tzToday(tz, now)

  let daysAhead = 0
  let targetWeekday: Weekday

  if (hint.kind === 'relative') {
    daysAhead = hint.delta
    targetWeekday = ((today.weekday + daysAhead) % 7) as Weekday
  } else {
    // If user says a weekday that equals today, interpret as NEXT occurrence.
    // Short messages like "perşembe" on a Thursday usually mean *next*
    // Thursday; otherwise we'd offer slots that may have already passed.
    daysAhead = (hint.weekday - today.weekday + 7) % 7
    if (daysAhead === 0) daysAhead = 7
    targetWeekday = hint.weekday
  }

  // Build target local midnight → next local midnight.
  // Use Date arithmetic on a concrete local-midnight UTC moment to cross
  // day boundaries correctly (handles month/year rollover).
  const anchor = tzWallToUtc(today.year, today.month, today.day, 0, 0, tz)
  const start = new Date(anchor.getTime() + daysAhead * 86_400_000)
  const end   = new Date(start.getTime() + 86_400_000)

  // Also return a YYYY-MM-DD of the target day in tz for labelling.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = fmt.formatToParts(start)
  const g: Record<string, string> = {}
  for (const p of parts) g[p.type] = p.value
  const targetYMD = `${g.year}-${g.month}-${g.day}`

  return {
    fromISO: start.toISOString(),
    toISO: end.toISOString(),
    targetWeekday,
    targetYMD,
  }
}

export function computeCurrentWeekBounds(
  tz: string,
  now: Date = new Date(),
): { fromISO: string; toISO: string } {
  const today = tzToday(tz, now)
  const daysFromMonday = (today.weekday + 6) % 7
  const anchor = tzWallToUtc(today.year, today.month, today.day, 0, 0, tz)
  const start = new Date(anchor.getTime() - daysFromMonday * 86_400_000)
  const end = new Date(start.getTime() + 7 * 86_400_000)
  return {
    fromISO: start.toISOString(),
    toISO: end.toISOString(),
  }
}

// Human-friendly day label in the customer's locale, e.g. "Perşembe".
export function weekdayLabel(
  dateISO: string,
  tz: string,
  locale: LocaleCode,
): string {
  try {
    return new Date(dateISO).toLocaleDateString(locale, {
      timeZone: tz,
      weekday: 'long',
    })
  } catch {
    return new Date(dateISO).toUTCString()
  }
}

// ---------- Time-of-day extraction ----------
//
// Pulls a wall-clock time out of a message: "15:00", "3pm", "saat 15",
// "at 3:30 pm". Returns the 24h hour/minute pair, not a Date, because
// whether that time is today/Friday/etc. comes from the day hint.

export function extractTimeHint(text: string): { hour: number; minute: number } | null {
  if (!text) return null

  // Turkish natural meridiem phrases first, so "saat 3 öğleden sonra"
  // maps to 15:00 instead of 03:00.
  const trPm = text.match(/\b(?:saat\s*)?(\d{1,2})(?::([0-5]\d))?\s*(?:öğleden\s*sonra|ogleden\s*sonra|akşam|aksam)\b/i)
  if (trPm) {
    let h = Number(trPm[1])
    const m = Number(trPm[2] ?? '0')
    if (h >= 1 && h <= 12) {
      if (h < 12) h += 12
      return { hour: h, minute: m }
    }
  }

  const trAm = text.match(/\b(?:saat\s*)?(\d{1,2})(?::([0-5]\d))?\s*(?:sabah)\b/i)
  if (trAm) {
    let h = Number(trAm[1])
    const m = Number(trAm[2] ?? '0')
    if (h >= 1 && h <= 12) {
      if (h === 12) h = 0
      return { hour: h, minute: m }
    }
  }

  // Reverse-order Turkish meridiem phrases:
  // "öğleden sonra 3", "akşam 6", "aksam saat 7:30"
  const trPmPrefix = text.match(/\b(?:öğleden\s*sonra|ogleden\s*sonra|akşam|aksam)\s*(?:saat\s*)?(\d{1,2})(?::([0-5]\d))?\b/i)
  if (trPmPrefix) {
    let h = Number(trPmPrefix[1])
    const m = Number(trPmPrefix[2] ?? '0')
    if (h >= 1 && h <= 12) {
      if (h < 12) h += 12
      return { hour: h, minute: m }
    }
  }

  const trAmPrefix = text.match(/\b(?:sabah)\s*(?:saat\s*)?(\d{1,2})(?::([0-5]\d))?\b/i)
  if (trAmPrefix) {
    let h = Number(trAmPrefix[1])
    const m = Number(trAmPrefix[2] ?? '0')
    if (h >= 1 && h <= 12) {
      if (h === 12) h = 0
      return { hour: h, minute: m }
    }
  }

  // 24-hour with separator: "15:00", "15.30", "15h30", "15 00"
  const m24 = text.match(/\b([01]?\d|2[0-3])[:.h\s]([0-5]\d)\b/i)
  if (m24) {
    return { hour: Number(m24[1]), minute: Number(m24[2]) }
  }

  // 12-hour with am/pm: "3pm", "3 pm", "3:30pm", "3:30 am"
  const m12 = text.match(/\b(\d{1,2})(?::([0-5]\d))?\s?(am|pm|a\.m\.|p\.m\.)\b/i)
  if (m12) {
    let h = Number(m12[1])
    const m = Number(m12[2] ?? '0')
    const ampm = m12[3].toLowerCase().replace(/\./g, '')
    if (h >= 1 && h <= 12) {
      if (ampm === 'pm' && h < 12) h += 12
      if (ampm === 'am' && h === 12) h = 0
      return { hour: h, minute: m }
    }
  }

  // "saat 15" / "at 15" / "о 15" — hour alone after a time particle.
  // Guarded by the particle to avoid matching slot-index replies like "3".
  const particle = text.match(
    /\b(?:saat|at|om|à|a\s+las|alle|в|em|um)\s+(\d{1,2})(?::([0-5]\d))?\b/i,
  )
  if (particle) {
    const h = Number(particle[1])
    const m = Number(particle[2] ?? '0')
    if (h >= 0 && h <= 23) return { hour: h, minute: m }
  }

  // Turkish dative suffix: "15'e", "15 e", "15te", "15'te"
  const trLoose = text.match(/\b([01]?\d|2[0-3])(?:\s*[:.]\s*([0-5]\d))?\s*(?:'?(?:e|a|te|ta))\b/i)
  if (trLoose) {
    return {
      hour: Number(trLoose[1]),
      minute: Number(trLoose[2] ?? '0'),
    }
  }

  // Bare-hour in availability questions: "cuma 15 müsait mi", "friday 3 free?"
  // Keep this last to reduce false positives with slot-index replies.
  const bareQuestion = text.match(
    /\b([01]?\d|2[0-3])\b(?=.*\b(müsait|musait|uygun|boş|bos|available|free|slot|saat)\b)/i,
  )
  if (bareQuestion) {
    return { hour: Number(bareQuestion[1]), minute: 0 }
  }

  return null
}

// ---------- Wall-clock → UTC ISO helper (public) ----------
//
// Given a YYYY-MM-DD (local calendar date in `tz`) and an hour/minute,
// return the UTC ISO timestamp of that moment. Used to check whether a
// customer-requested time (e.g. Friday 15:00 Istanbul) is available on
// the real calendar.

export function tzLocalToUtcISO(
  targetYMD: string,
  hour: number,
  minute: number,
  tz: string,
): string {
  const [y, mo, d] = targetYMD.split('-').map(Number)
  return tzWallToUtc(y, mo, d, hour, minute, tz).toISOString()
}

// ---------- Multiple (day, time) extraction ----------
//
// Scans the whole message for segments that contain both a weekday/relative
// word AND an hour, returning distinct (dayHint, hour, minute) triples so
// the reply engine can handle sentences like
//   "pazartesi 15 ve çarşamba 17"
//   "monday 15 and wednesday 17"
// without collapsing everything into a single day.

export function extractMultipleDayTimeHints(text: string): Array<{
  dayHint: DayHint
  hour: number
  minute: number
}> {
  if (!text) return []
  const normalized = text.toLowerCase()
  const results: Array<{ dayHint: DayHint; hour: number; minute: number }> = []
  const seen = new Set<string>()

  const segments = normalized
    .split(/\s+(?:ve|and|y|und|ile|,|;)\s+/i)
    .map(s => s.trim())
    .filter(Boolean)

  for (const segment of segments) {
    const dayHint = parseDayHint(segment)
    if (!dayHint) continue
    let time = extractTimeHint(segment)
    // If extractTimeHint didn't find a time in this short segment (e.g.
    // "pazartesi 15" has no "saat"/"müsait" keyword), accept a bare hour
    // because the presence of a day hint makes the number unambiguous.
    if (!time) {
      const bare = segment.match(/\b([01]?\d|2[0-3])(?:[:.]([0-5]\d))?\b/)
      if (bare) {
        time = { hour: Number(bare[1]), minute: Number(bare[2] ?? '0') }
      }
    }
    if (!time) continue
    const key = `${JSON.stringify(dayHint)}-${time.hour}:${time.minute}`
    if (seen.has(key)) continue
    seen.add(key)
    results.push({ dayHint, hour: time.hour, minute: time.minute })
  }

  return results
}
