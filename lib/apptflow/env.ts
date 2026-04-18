// Strict environment accessor. Throws in server context if a required
// variable is missing so we fail loudly at boot instead of silently later.

function required(name: string): string {
  const v = process.env[name]
  if (!v || !v.trim()) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return v.trim()
}

function optional(name: string, fallback = ''): string {
  const v = process.env[name]
  return v && v.trim() ? v.trim() : fallback
}

export const env = {
  // ---- Supabase ----
  supabaseUrl: () => required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: () => required('SUPABASE_SERVICE_ROLE_KEY'),

  // ---- Shared secrets ----
  webhookSecret: () => required('APPTFLOW_WEBHOOK_SECRET'),
  cronSecret: () => required('APPTFLOW_CRON_SECRET'),
  orchestratorUrl: () => {
    const explicit = optional('APPTFLOW_ORCHESTRATOR_URL')
    if (explicit) return explicit
    return `${required('NEXT_PUBLIC_SUPABASE_URL')}/functions/v1/apptflow-orchestrator`
  },
  publicUrl: () => required('APPTFLOW_PUBLIC_URL'),

  // ---- Lemon Squeezy (Merchant of Record — global billing) ----
  lemonApiKey: () => required('LEMON_SQUEEZY_API_KEY'),
  lemonStoreId: () => required('LEMON_SQUEEZY_STORE_ID'),
  lemonWebhookSecret: () => required('LEMON_SQUEEZY_WEBHOOK_SECRET'),
  // Optional: per-plan Lemon Squeezy variant IDs (one per billing period/tier).
  // Populate these in production; signup falls back to on-the-fly variant
  // discovery by plan code otherwise.
  lemonVariantStarterMonthly: () => optional('LEMON_VARIANT_STARTER_MONTHLY'),
  lemonVariantStarterYearly: () => optional('LEMON_VARIANT_STARTER_YEARLY'),
  lemonVariantProMonthly: () => optional('LEMON_VARIANT_PRO_MONTHLY'),
  lemonVariantProYearly: () => optional('LEMON_VARIANT_PRO_YEARLY'),
  lemonVariantBusinessMonthly: () => optional('LEMON_VARIANT_BUSINESS_MONTHLY'),
  lemonVariantBusinessYearly: () => optional('LEMON_VARIANT_BUSINESS_YEARLY'),
  defaultCurrency: () => optional('APPTFLOW_DEFAULT_CURRENCY', 'USD').toUpperCase(),

  // ---- WhatsApp Cloud ----
  waPhoneNumberId: () => required('WHATSAPP_PHONE_NUMBER_ID'),
  waAccessToken: () => required('WHATSAPP_ACCESS_TOKEN'),
  waVerifyToken: () => required('WHATSAPP_VERIFY_TOKEN'),
  waAppSecret: () => required('WHATSAPP_APP_SECRET'),

  // ---- Google Calendar ----
  googleClientId: () => required('GOOGLE_OAUTH_CLIENT_ID'),
  googleClientSecret: () => required('GOOGLE_OAUTH_CLIENT_SECRET'),
  googleRedirectUri: () => required('GOOGLE_OAUTH_REDIRECT_URI'),

  // ---- Pricing policy ----
  minMargin: () => {
    const raw = optional('APPTFLOW_MIN_MARGIN', '0.10')
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 0 || n >= 1) {
      throw new Error(`APPTFLOW_MIN_MARGIN must be in [0,1); got ${raw}`)
    }
    return n
  },
  fxProviderUrl: () => optional('APPTFLOW_FX_PROVIDER_URL', 'https://open.er-api.com/v6/latest/USD'),
  fxProviderApiKey: () => optional('APPTFLOW_FX_PROVIDER_API_KEY'),

  // ---- LLM (optional) ----
  openAiKey: () => optional('OPENAI_API_KEY'),
  openAiModel: () => optional('OPENAI_MODEL', 'gpt-4o-mini'),
}
