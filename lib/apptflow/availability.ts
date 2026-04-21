import { getServiceSupabase } from './supabase'

// 0 = Sunday … 6 = Saturday (matches JS getDay).
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface TimeWindow {
  weekday: Weekday
  startMin: number    // 0..1440
  endMin: number      // 0..1440 (> startMin)
}

// Convert "HH:MM" (or "HH:MM:SS") into minutes-of-day.
function parseTimeToMin(v: string): number {
  const [h, m] = v.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Default window set: Mon–Sat 09:00–18:00. Used when a tenant has no
// business_hours rows and a service has no service_availability_windows.
export const DEFAULT_WINDOWS: TimeWindow[] = [1, 2, 3, 4, 5, 6].map(wd => ({
  weekday: wd as Weekday,
  startMin: 9 * 60,
  endMin: 18 * 60,
}))

// Group windows by weekday for O(1) lookup in the slot iterator.
export function windowsByWeekday(
  windows: TimeWindow[],
): Record<number, TimeWindow[]> {
  const out: Record<number, TimeWindow[]> = {}
  for (const w of windows) {
    (out[w.weekday] ||= []).push(w)
  }
  for (const k of Object.keys(out)) {
    out[Number(k)].sort((a, b) => a.startMin - b.startMin)
  }
  return out
}

// Resolve the effective availability windows for a given service:
//   1) service_availability_windows (if any rows),
//   2) otherwise tenant business_hours (if any),
//   3) otherwise DEFAULT_WINDOWS.
export async function resolveServiceWindows(args: {
  tenantId: string
  serviceId: string
}): Promise<TimeWindow[]> {
  const sb = getServiceSupabase()

  const { data: svcWindows } = await sb
    .from('service_availability_windows')
    .select('weekday, start_time, end_time, is_active')
    .eq('service_id', args.serviceId)
    .eq('is_active', true)

  if (svcWindows && svcWindows.length > 0) {
    return svcWindows.map((r: any) => ({
      weekday: r.weekday,
      startMin: parseTimeToMin(r.start_time),
      endMin: parseTimeToMin(r.end_time),
    }))
  }

  const { data: bh } = await sb
    .from('business_hours')
    .select('weekday, start_time, end_time, is_active')
    .eq('tenant_id', args.tenantId)
    .eq('is_active', true)

  if (bh && bh.length > 0) {
    return bh.map((r: any) => ({
      weekday: r.weekday,
      startMin: parseTimeToMin(r.start_time),
      endMin: parseTimeToMin(r.end_time),
    }))
  }

  return DEFAULT_WINDOWS
}
