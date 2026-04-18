import { env } from './env'
import type { OrchestratorEvent } from './types'

export interface OrchestratorDispatch {
  event: OrchestratorEvent
  tenant_id: string | null
  payload?: Record<string, unknown>
}

// Single entry point used by API routes and cron jobs. Forwards the
// event to the Supabase Edge Function where the actual agent logic runs.
export async function dispatchEvent(input: OrchestratorDispatch): Promise<{
  ok: boolean
  status: number
  result?: unknown
  error?: string
}> {
  const url = env.orchestratorUrl()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.supabaseServiceRoleKey()}`,
      'x-apptflow-secret': env.webhookSecret(),
    },
    body: JSON.stringify(input),
  })
  const text = await res.text()
  let body: unknown = null
  try { body = text ? JSON.parse(text) : null } catch { body = { raw: text } }
  if (!res.ok) {
    return { ok: false, status: res.status, error: 'orchestrator_failed', result: body }
  }
  return { ok: true, status: res.status, result: body }
}
