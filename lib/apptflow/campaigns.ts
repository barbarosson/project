import { getServiceSupabase } from './supabase'
import { sendTemplate, sendText } from './whatsapp'
import { t } from './i18n'
import type { LocaleCode } from './types'

// Platform-driven self-serve acquisition + reactivation engine.
// `tick` is invoked by /api/apptflow/cron/campaigns on a short interval.
// It executes any campaign whose status is 'running' or whose
// scheduled_at has arrived, respecting per-tenant budget and consent.

export interface CampaignTickResult {
  processed: number
  sent: number
  skipped: number
}

export async function tickCampaigns(): Promise<CampaignTickResult> {
  const sb = getServiceSupabase()
  const nowIso = new Date().toISOString()

  const { data: due, error } = await sb
    .from('campaigns')
    .select('*')
    .or(`status.eq.running,and(status.eq.scheduled,scheduled_at.lte.${nowIso})`)
  if (error) throw error

  let sent = 0
  let skipped = 0
  for (const campaign of due ?? []) {
    try {
      const result = await runOneCampaign(campaign)
      sent += result.sent
      skipped += result.skipped
    } catch (err) {
      console.error('[apptflow] campaign error:', (err as Error).message)
    }
  }
  return { processed: (due ?? []).length, sent, skipped }
}

async function runOneCampaign(campaign: any): Promise<{ sent: number; skipped: number }> {
  const sb = getServiceSupabase()

  // Audience: we currently support only { kind: 'customers_last_seen_days_gte', days: N }
  // and { kind: 'leads_in_stage', stage: 'engaged' } — extend as needed.
  const audience = campaign.audience_query ?? {}
  const budgetRemaining = Number(campaign.budget_usd ?? 0)
  const tenantId: string | null = campaign.tenant_id
  const locale: LocaleCode = (campaign.locale as LocaleCode) ?? 'en'

  let recipients: Array<{ phone: string; name: string | null }> = []

  if (audience.kind === 'customers_last_seen_days_gte' && tenantId) {
    const cutoff = new Date(Date.now() - (Number(audience.days ?? 60) * 86_400_000)).toISOString()
    const { data } = await sb
      .from('customers')
      .select('phone_e164, full_name, consent_marketing')
      .eq('tenant_id', tenantId)
      .eq('consent_marketing', true)
      .lte('last_seen_at', cutoff)
      .limit(500)
    recipients = (data ?? [])
      .filter(c => c.phone_e164)
      .map(c => ({ phone: c.phone_e164 as string, name: c.full_name }))
  } else if (audience.kind === 'leads_in_stage' && tenantId) {
    const { data } = await sb
      .from('leads')
      .select('phone_e164, full_name, consent_marketing')
      .eq('tenant_id', tenantId)
      .eq('stage', String(audience.stage ?? 'engaged'))
      .eq('consent_marketing', true)
      .limit(500)
    recipients = (data ?? [])
      .filter(l => l.phone_e164)
      .map(l => ({ phone: l.phone_e164 as string, name: l.full_name }))
  }

  // Cap by budget: assume $0.01 per touch (template cost).
  const maxTouches = budgetRemaining > 0 ? Math.floor(budgetRemaining / 0.01) : recipients.length
  const toSend = recipients.slice(0, maxTouches)

  let sent = 0
  for (const rcpt of toSend) {
    try {
      if (!tenantId) continue
      if (campaign.template_name) {
        await sendTemplate({
          tenantId,
          to: rcpt.phone.replace(/^\+/, ''),
          templateName: campaign.template_name,
          languageCode: languageCodeFor(locale),
          variables: [rcpt.name ?? '', String(campaign.message_body ?? '')],
        })
      } else {
        await sendText({
          tenantId,
          to: rcpt.phone.replace(/^\+/, ''),
          text: t(locale, 'campaign_offer', {
            name: rcpt.name ?? '',
            offer: campaign.message_body ?? '',
          }),
        })
      }
      sent++
    } catch (err) {
      console.warn('[apptflow] campaign send skipped:', (err as Error).message)
    }
  }

  const stats = campaign.stats ?? { sent: 0, delivered: 0, replied: 0, converted: 0 }
  stats.sent = Number(stats.sent ?? 0) + sent

  await sb
    .from('campaigns')
    .update({
      status: sent >= recipients.length ? 'completed' : 'running',
      last_run_at: new Date().toISOString(),
      stats,
    })
    .eq('id', campaign.id)

  return { sent, skipped: recipients.length - sent }
}

function languageCodeFor(locale: LocaleCode): string {
  // WhatsApp template language codes use IETF BCP 47 with '_' separator.
  const map: Record<LocaleCode, string> = {
    en: 'en_US', tr: 'tr', es: 'es_ES', de: 'de', fr: 'fr',
    pt: 'pt_BR', ar: 'ar', it: 'it', ru: 'ru',
  }
  return map[locale] ?? 'en_US'
}
