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
