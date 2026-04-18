export type LocaleCode = 'en' | 'tr' | 'es' | 'de' | 'fr' | 'pt' | 'ar' | 'it' | 'ru'

export type CurrencyCode =
  | 'USD' | 'EUR' | 'GBP' | 'TRY' | 'BRL' | 'MXN'
  | 'AED' | 'SAR' | 'JPY' | 'CHF' | 'AUD' | 'CAD'

export type AppointmentStatus =
  | 'scheduled' | 'confirmed' | 'completed'
  | 'cancelled' | 'no_show' | 'rescheduled'

export type SubscriptionStatus =
  | 'trialing' | 'active' | 'past_due'
  | 'cancelled' | 'paused' | 'unpaid'

export type AgentName =
  | 'growth' | 'qualification' | 'conversion' | 'onboarding'
  | 'messaging' | 'scheduling' | 'reminders' | 'retention'
  | 'billing' | 'pricing' | 'compliance'

export type OrchestratorEvent =
  | 'lead.created'
  | 'appointment.created'
  | 'appointment.cancelled'
  | 'appointment.completed'
  | 'appointment.no_show'
  | 'whatsapp.inbound'
  | 'whatsapp.delivery'
  | 'subscription.created'
  | 'subscription.payment_failed'
  | 'subscription.paid'
  | 'daily.kpi_rollup'
  | 'campaign.tick'
  | 'pricing.recheck'
  // Lemon Squeezy billing webhook events, forwarded verbatim so
  // downstream agents (billing, retention) can react.
  | 'lemon.order_created'
  | 'lemon.order_refunded'
  | 'lemon.subscription_created'
  | 'lemon.subscription_updated'
  | 'lemon.subscription_cancelled'
  | 'lemon.subscription_resumed'
  | 'lemon.subscription_expired'
  | 'lemon.subscription_paused'
  | 'lemon.subscription_unpaused'
  | 'lemon.subscription_payment_success'
  | 'lemon.subscription_payment_failed'
  | 'lemon.subscription_payment_recovered'
  | 'lemon.subscription_payment_refunded'
  | 'lemon.subscription_plan_changed'
  | 'lemon.license_key_created'

export interface Tenant {
  id: string
  owner_user_id: string
  business_name: string
  vertical: string
  country: string | null
  timezone: string
  default_locale: LocaleCode
  default_currency: CurrencyCode
  whatsapp_phone_number_id: string | null
  status: 'onboarding' | 'active' | 'past_due' | 'paused' | 'churned'
}

export interface Appointment {
  id: string
  tenant_id: string
  customer_id: string | null
  service_id: string | null
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  booking_channel: 'bot' | 'manual' | 'webform' | 'api'
  google_event_id: string | null
  reminder_sent_24h: boolean
  reminder_sent_2h: boolean
  confirmation_sent: boolean
  notes: string | null
}

export interface MarginSnapshot {
  tenant_id: string
  period_month: string
  revenue_usd: number
  cost_usd: number
  margin: number
  min_required_margin: number
  required_price_usd: number
  under_margin: boolean
}
