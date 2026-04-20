import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export type DentalflowEvent =
  | 'lead.created'
  | 'message.received'
  | 'subscription.paid'
  | 'appointment.no_show'
  | 'billing.payment_failed'
  | 'daily.kpi_rollup'

export type DentalflowEventPayload = {
  event: DentalflowEvent
  clinic_id: string
  payload?: Record<string, unknown>
}

export function getDentalflowServiceSupabase() {
  if (!SUPABASE_URL?.trim() || !SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return null
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function getDentalflowFunctionUrl() {
  const explicit = process.env.DENTALFLOW_ORCHESTRATOR_URL
  if (explicit?.trim()) return explicit.trim()

  if (!SUPABASE_URL?.trim()) return null
  return `${SUPABASE_URL}/functions/v1/dentalflow-orchestrator`
}

export function validateDentalflowWebhookSecret(input: string | null) {
  const expected = process.env.DENTALFLOW_WEBHOOK_SECRET
  if (!expected?.trim()) return false
  if (!input) return false
  return input === expected
}
