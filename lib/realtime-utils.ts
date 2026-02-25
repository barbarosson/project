import type { RealtimeChannel } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Realtime performans optimizasyonları (PERFORMANCE_OPTIMIZATION_GUIDE.md ile uyumlu).
 * - Tek channel'da birden fazla tablo dinleyerek channel sayısını azaltır.
 * - Debounce ile sık tetiklenen callback'leri birleştirir.
 * - filter kullanımını teşvik eder (tenant_id, section_key vb.).
 */

export type PostgresChangeFilter = {
  column: string
  value: string
}

/**
 * Realtime callback'ini debounce ile sarmalar; sık tetiklenen güncellemelerde
 * tek seferde işlem yapılmasını sağlar (örn. ui_styles sürgü güncellemeleri).
 */
export function withDebounce<T extends (...args: any[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      timeoutId = null
      fn(...args)
    }, ms)
  }
}

/**
 * Supabase Realtime filter string üretir (örn. "tenant_id=eq.xxx").
 */
export function realtimeFilter(column: string, value: string): string {
  return `${column}=eq.${value}`
}

/**
 * Tek bir channel üzerinde birden fazla tablo/event dinler.
 * Channel sayısını azaltarak realtime.list_changes yükünü düşürür.
 *
 * Örnek:
 *   subscribeMultiTable(supabase, 'site_cms', [
 *     { table: 'site_config', event: '*', callback: fetchConfig },
 *     { table: 'banners', event: '*', callback: fetchBanners },
 *   ])
 */
export function subscribeMultiTable(
  supabase: SupabaseClient,
  channelName: string,
  subscriptions: Array<{
    schema?: string
    table: string
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    filter?: PostgresChangeFilter
    callback: (payload: any) => void
  }>
): RealtimeChannel {
  const schema = 'public'
  let ch = supabase.channel(channelName)
  for (const sub of subscriptions) {
    const options: {
      event: typeof sub.event
      schema: string
      table: string
      filter?: string
    } = {
      event: sub.event,
      schema: sub.schema ?? schema,
      table: sub.table,
    }
    if (sub.filter) {
      options.filter = realtimeFilter(sub.filter.column, sub.filter.value)
    }
    ch = ch.on('postgres_changes', options, sub.callback)
  }
  return ch.subscribe()
}
