'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  DICT,
  UI_LOCALES,
  detectInitialLocale,
  persistLocale,
  type Strings,
  type UiLocale,
} from './i18n'

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

interface Window {
  weekday: Weekday
  start_time: string
  end_time: string
}

interface ServiceRow {
  id: string
  name: string
  description: string | null
  category: string | null
  duration_minutes: number
  buffer_minutes: number
  price_amount: number
  price_currency: string
  sort_order: number
  is_active: boolean
  windows: Array<{ weekday: Weekday; start_time: string; end_time: string }>
}

interface Account {
  user: {
    id: string
    email: string | null
    full_name: string | null
    created_at: string | null
    last_sign_in_at: string | null
  } | null
  tenant: {
    id: string
    business_name: string
    vertical: string
    country: string | null
    timezone: string
    default_locale: string
    default_currency: string
    status: string
    created_at: string
  } | null
  subscription: {
    status: string
    billing_currency: string
    current_period_start: string | null
    current_period_end: string | null
    trial_ends_at: string | null
    cancel_at_period_end: boolean
    has_lemon_subscription: boolean
    plan: {
      code: string
      name: string
      base_price_usd: number
      included_appointments: number
      included_whatsapp_msgs: number
    } | null
  } | null
  plans: Array<{
    code: string
    name: string
    base_price_usd: number
    included_appointments: number
    included_whatsapp_msgs: number
  }>
}

const WEEKDAYS_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0]

const VERTICAL_TEMPLATES = {
  barber: [
    { name: 'Haircut', category: 'hair', duration_minutes: 30, buffer_minutes: 5, price_amount: 20, price_currency: 'USD', sort_order: 10, is_active: true },
    { name: 'Beard Trim', category: 'beard', duration_minutes: 20, buffer_minutes: 5, price_amount: 12, price_currency: 'USD', sort_order: 20, is_active: true },
    { name: 'Hair + Beard', category: 'combo', duration_minutes: 45, buffer_minutes: 10, price_amount: 28, price_currency: 'USD', sort_order: 30, is_active: true },
  ],
  salon: [
    { name: 'Haircut', category: 'hair', duration_minutes: 45, buffer_minutes: 5, price_amount: 35, price_currency: 'USD', sort_order: 10, is_active: true },
    { name: 'Color', category: 'color', duration_minutes: 90, buffer_minutes: 15, price_amount: 75, price_currency: 'USD', sort_order: 20, is_active: true },
    { name: 'Blow-dry', category: 'style', duration_minutes: 30, buffer_minutes: 5, price_amount: 25, price_currency: 'USD', sort_order: 30, is_active: true },
  ],
  dental: [
    { name: 'Check-up', category: 'general', duration_minutes: 30, buffer_minutes: 10, price_amount: 50, price_currency: 'USD', sort_order: 10, is_active: true },
    { name: 'Cleaning', category: 'hygiene', duration_minutes: 45, buffer_minutes: 10, price_amount: 80, price_currency: 'USD', sort_order: 20, is_active: true },
    { name: 'Filling', category: 'restorative', duration_minutes: 60, buffer_minutes: 15, price_amount: 150, price_currency: 'USD', sort_order: 30, is_active: true },
  ],
  psychiatrist: [
    { name: 'First consultation', category: 'consult', duration_minutes: 60, buffer_minutes: 10, price_amount: 150, price_currency: 'USD', sort_order: 10, is_active: true },
    { name: 'Follow-up session', category: 'session', duration_minutes: 45, buffer_minutes: 15, price_amount: 120, price_currency: 'USD', sort_order: 20, is_active: true },
  ],
} as const

type TemplateKey = keyof typeof VERTICAL_TEMPLATES

function defaultWindows(): Window[] {
  return [1, 2, 3, 4, 5, 6].map(idx => ({
    weekday: idx as Weekday,
    start_time: '09:00',
    end_time: '18:00',
  }))
}

export default function AppointFlowServicesPage() {
  const [locale, setLocale] = useState<UiLocale>('en')
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [services, setServices] = useState<ServiceRow[]>([])
  const [businessHours, setBusinessHours] = useState<Window[]>(defaultWindows())
  const [editing, setEditing] = useState<ServiceRow | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [account, setAccount] = useState<Account | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [billingBusy, setBillingBusy] = useState(false)

  const t: Strings = useMemo(() => DICT[locale], [locale])
  const isRtl = locale === 'ar'

  useEffect(() => {
    setLocale(detectInitialLocale())
  }, [])

  const loadAll = useCallback(async (accessToken: string) => {
    try {
      const [svcRes, bhRes, accRes] = await Promise.all([
        fetch('/api/apptflow/admin/services', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/apptflow/admin/business-hours', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/apptflow/admin/account', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ])
      const svc = await svcRes.json()
      const bh = await bhRes.json()
      const acc = await accRes.json()
      if (svc.ok) setServices(svc.services ?? [])
      else toast.error(t.toast_services_load_failed)
      if (bh.ok && Array.isArray(bh.windows) && bh.windows.length > 0) {
        setBusinessHours(
          bh.windows.map((w: any) => ({
            weekday: w.weekday,
            start_time: (w.start_time ?? '').slice(0, 5),
            end_time: (w.end_time ?? '').slice(0, 5),
          })),
        )
      }
      if (acc.ok) setAccount(acc as Account)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession()
      const accessToken = data.session?.access_token ?? null
      setToken(accessToken)
      if (accessToken) await loadAll(accessToken)
      else setLoading(false)
    })()
  }, [loadAll])

  function changeLocale(code: UiLocale) {
    setLocale(code)
    persistLocale(code)
  }

  async function saveService(row: ServiceRow, isNew: boolean) {
    if (!token) return
    const payload = {
      name: row.name,
      description: row.description,
      category: row.category,
      duration_minutes: row.duration_minutes,
      buffer_minutes: row.buffer_minutes,
      price_amount: row.price_amount,
      price_currency: row.price_currency || account?.tenant?.default_currency || 'USD',
      sort_order: row.sort_order,
      is_active: row.is_active,
      windows: row.windows,
    }
    const res = await fetch(
      isNew
        ? '/api/apptflow/admin/services'
        : `/api/apptflow/admin/services/${row.id}`,
      {
        method: isNew ? 'POST' : 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    )
    const json = await res.json()
    if (!res.ok || !json.ok) {
      toast.error(t.toast_save_failed)
      return
    }
    toast.success(isNew ? t.toast_service_created : t.toast_service_saved)
    setEditing(null)
    setIsCreating(false)
    await loadAll(token)
  }

  async function deleteService(id: string) {
    if (!token) return
    if (!confirm(t.delete_confirm)) return
    const res = await fetch(`/api/apptflow/admin/services/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok || !json.ok) {
      toast.error(t.toast_delete_failed)
      return
    }
    toast.success(t.toast_service_deleted)
    await loadAll(token)
  }

  async function saveBusinessHours() {
    if (!token) return
    const res = await fetch('/api/apptflow/admin/business-hours', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ windows: businessHours }),
    })
    const json = await res.json()
    if (!res.ok || !json.ok) {
      toast.error(t.toast_save_failed)
      return
    }
    toast.success(t.toast_hours_saved)
  }

  function applyTemplate(key: TemplateKey) {
    const seeds = VERTICAL_TEMPLATES[key]
    setIsCreating(false)
    setEditing(null)
    ;(async () => {
      if (!token) return
      for (const seed of seeds) {
        await fetch('/api/apptflow/admin/services', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: seed.name,
            category: seed.category,
            duration_minutes: seed.duration_minutes,
            buffer_minutes: seed.buffer_minutes,
            price_amount: seed.price_amount,
            price_currency: account?.tenant?.default_currency || seed.price_currency,
            sort_order: seed.sort_order,
            is_active: true,
            windows: defaultWindows(),
          }),
        })
      }
      await loadAll(token)
      const label =
        key === 'barber' ? t.template_barber
        : key === 'salon' ? t.template_salon
        : key === 'dental' ? t.template_dental
        : t.template_psychiatrist
      toast.success(t.toast_template_seeded(seeds.length, label))
    })()
  }

  async function openCustomerPortal() {
    if (!token) return
    setBillingBusy(true)
    try {
      const res = await fetch('/api/apptflow/admin/billing/portal', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        toast.error(t.billing_portal_unavailable)
        return
      }
      const url = json.customer_portal || json.update_payment_method
      if (!url) {
        toast.error(t.billing_portal_unavailable)
        return
      }
      window.location.href = url
    } finally {
      setBillingBusy(false)
    }
  }

  async function startCheckout(planCode: string) {
    if (!token) return
    setBillingBusy(true)
    try {
      const res = await fetch('/api/apptflow/admin/billing/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan_code: planCode, billing_cycle: billingCycle }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok || !json.url) {
        toast.error(t.toast_save_failed)
        return
      }
      toast.message(t.billing_redirecting)
      window.location.href = json.url
    } finally {
      setBillingBusy(false)
    }
  }

  if (loading) return <div style={{ padding: 32 }}>{t.loading}</div>
  if (!token) {
    return (
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>{t.page_title}</h1>
        <p>{t.sign_in_required}</p>
      </div>
    )
  }

  const emptyRow = (): ServiceRow => ({
    id: '',
    name: '',
    description: '',
    category: '',
    duration_minutes: 30,
    buffer_minutes: 0,
    price_amount: 0,
    price_currency: account?.tenant?.default_currency || 'USD',
    sort_order: services.length * 10,
    is_active: true,
    windows: defaultWindows(),
  })

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString(locale, {
        year: 'numeric', month: 'short', day: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const statusLabel = (s: string): string => {
    switch (s) {
      case 'trialing':   return t.status_trialing
      case 'active':     return t.status_active
      case 'past_due':   return t.status_past_due
      case 'cancelled':  return t.status_cancelled
      case 'paused':     return t.status_paused
      case 'unpaid':     return t.status_unpaid
      default:           return s
    }
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: 24,
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
      }}
    >
      {/* Header with language switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{t.page_title}</h1>
          <p style={{ color: '#555', margin: 0 }}>{t.page_subtitle}</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
          {t.language_label}:
          <select value={locale} onChange={e => changeLocale(e.target.value as UiLocale)} style={input({ width: 140 })}>
            {UI_LOCALES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Account */}
      {account?.user && account.tenant && (
        <section style={card()}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{t.account_heading}</h2>
          <div style={{ ...grid(2), marginTop: 12, rowGap: 6 }}>
            <InfoRow label={t.account_email} value={account.user.email ?? '—'} />
            <InfoRow label={t.account_full_name} value={account.user.full_name ?? '—'} />
            <InfoRow label={t.account_business_name} value={account.tenant.business_name} />
            <InfoRow label={t.account_vertical} value={account.tenant.vertical} />
            <InfoRow label={t.account_timezone} value={account.tenant.timezone} />
            <InfoRow label={t.account_default_locale} value={account.tenant.default_locale} />
            <InfoRow label={t.account_default_currency} value={account.tenant.default_currency} />
            <InfoRow label={t.account_member_since} value={fmtDate(account.user.created_at)} />
            <InfoRow label={t.account_tenant_status} value={account.tenant.status} />
          </div>
        </section>
      )}

      {/* Subscription */}
      <section style={card()}>
        <h2 style={{ margin: 0, fontSize: 18 }}>{t.subscription_heading}</h2>

        {account?.subscription?.plan ? (
          <>
            <div style={{ ...grid(2), marginTop: 12, rowGap: 6 }}>
              <InfoRow label={t.subscription_current_plan} value={account.subscription.plan.name} />
              <InfoRow label={t.subscription_status} value={statusLabel(account.subscription.status)} />
              {account.subscription.status === 'trialing' && (
                <InfoRow label={t.subscription_trial_ends} value={fmtDate(account.subscription.trial_ends_at)} />
              )}
              <InfoRow label={t.subscription_renews_at} value={fmtDate(account.subscription.current_period_end)} />
              <InfoRow label={t.subscription_included_appointments} value={String(account.subscription.plan.included_appointments)} />
              <InfoRow label={t.subscription_included_messages} value={String(account.subscription.plan.included_whatsapp_msgs)} />
            </div>

            <p style={{ color: account.subscription.cancel_at_period_end ? '#b45309' : '#555', fontSize: 13, marginTop: 10 }}>
              {account.subscription.cancel_at_period_end ? t.subscription_will_cancel : t.subscription_auto_renew}
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {account.subscription.has_lemon_subscription && (
                <button onClick={openCustomerPortal} disabled={billingBusy} style={btn()}>
                  {t.billing_open_portal}
                </button>
              )}
              {account.subscription.has_lemon_subscription && (
                <button onClick={openCustomerPortal} disabled={billingBusy} style={btn()}>
                  {t.billing_update_payment}
                </button>
              )}
              {account.subscription.cancel_at_period_end && account.subscription.plan && (
                <button onClick={() => startCheckout(account.subscription!.plan!.code)} disabled={billingBusy} style={btnPrimary()}>
                  {t.billing_renew_now}
                </button>
              )}
            </div>
          </>
        ) : (
          <p style={{ color: '#555', marginTop: 8 }}>{t.subscription_no_plan}</p>
        )}

        {account && account.plans.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <strong style={{ fontSize: 14 }}>{t.billing_change_plan}</strong>
              <div style={{ display: 'inline-flex', border: '1px solid #ccc', borderRadius: 4, overflow: 'hidden' }}>
                <button
                  onClick={() => setBillingCycle('monthly')}
                  style={{ ...segment(), background: billingCycle === 'monthly' ? '#111' : '#fff', color: billingCycle === 'monthly' ? '#fff' : '#111' }}
                >
                  {t.billing_monthly}
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  style={{ ...segment(), background: billingCycle === 'yearly' ? '#111' : '#fff', color: billingCycle === 'yearly' ? '#fff' : '#111' }}
                >
                  {t.billing_yearly}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              {account.plans.map(p => {
                const isCurrent = account.subscription?.plan?.code === p.code
                const yearly = Math.round(p.base_price_usd * 12 * 0.85 * 100) / 100
                return (
                  <div key={p.code} style={{ border: isCurrent ? '2px solid #111' : '1px solid #ddd', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                    <div style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
                      {billingCycle === 'monthly'
                        ? `$${p.base_price_usd.toFixed(0)} ${t.billing_per_month}`
                        : `$${yearly.toFixed(0)} ${t.billing_per_year}`}
                    </div>
                    <ul style={{ margin: '8px 0 10px 16px', padding: 0, color: '#444', fontSize: 12 }}>
                      <li>{t.subscription_included_appointments}: {p.included_appointments}</li>
                      <li>{t.subscription_included_messages}: {p.included_whatsapp_msgs}</li>
                    </ul>
                    <button
                      onClick={() => startCheckout(p.code)}
                      disabled={billingBusy || isCurrent}
                      style={isCurrent ? btnDisabled() : btnPrimary()}
                    >
                      {isCurrent
                        ? t.subscription_current_plan
                        : account.subscription
                          ? `${t.billing_upgrade_to} ${p.name}`
                          : t.billing_start_subscription}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Quick-start templates (only if zero services) */}
      {services.length === 0 && !isCreating && (
        <section style={card()}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{t.quick_start_title}</h2>
          <p style={{ color: '#555', marginTop: 4 }}>{t.quick_start_intro}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button onClick={() => applyTemplate('barber')} style={btn()}>{t.template_barber}</button>
            <button onClick={() => applyTemplate('salon')} style={btn()}>{t.template_salon}</button>
            <button onClick={() => applyTemplate('dental')} style={btn()}>{t.template_dental}</button>
            <button onClick={() => applyTemplate('psychiatrist')} style={btn()}>{t.template_psychiatrist}</button>
          </div>
        </section>
      )}

      {/* Services list + editor */}
      <section style={card()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>{t.services_heading}</h2>
            <p style={{ margin: '2px 0 0', color: '#777', fontSize: 12 }}>{t.services_intro}</p>
          </div>
          <button onClick={() => { setEditing(emptyRow()); setIsCreating(true) }} style={btn()}>{t.new_service}</button>
        </div>

        {services.length === 0 && <p style={{ color: '#888', marginTop: 12 }}>{t.no_services}</p>}

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {services.map(s => (
            <div key={s.id} style={row()}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  {s.name} {!s.is_active && <span style={{ color: '#b00', fontSize: 12 }}>{t.inactive_badge}</span>}
                </div>
                <div style={{ color: '#555', fontSize: 13 }}>
                  {s.duration_minutes} min · {s.price_amount} {s.price_currency}
                  {s.category ? ` · ${s.category}` : ''}
                  {s.windows && s.windows.length > 0 ? ` · ${s.windows.length} ${t.windows_count_suffix}` : ''}
                </div>
              </div>
              <button onClick={() => { setEditing({ ...s, windows: s.windows ?? [] }); setIsCreating(false) }} style={btnSmall()}>{t.edit}</button>
              <button onClick={() => deleteService(s.id)} style={btnSmallDanger()}>{t.delete}</button>
            </div>
          ))}
        </div>
      </section>

      {editing && (
        <section style={card()}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>
            {isCreating ? t.new_service.replace(/^\+\s*/, '') : `${t.edit}: ${editing.name}`}
          </h2>
          <div style={grid(2)}>
            <Field label={t.form_name}>
              <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} style={input()} />
            </Field>
            <Field label={t.form_category}>
              <input value={editing.category ?? ''} onChange={e => setEditing({ ...editing, category: e.target.value })} placeholder={t.form_category_placeholder} style={input()} />
            </Field>
            <Field label={t.form_description}>
              <input value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} style={input()} />
            </Field>
            <Field label={t.form_sort_order}>
              <input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} style={input()} />
            </Field>
            <Field label={t.form_duration_min}>
              <input type="number" min={5} value={editing.duration_minutes} onChange={e => setEditing({ ...editing, duration_minutes: Number(e.target.value) || 30 })} style={input()} />
            </Field>
            <Field label={t.form_buffer_min}>
              <input type="number" min={0} value={editing.buffer_minutes} onChange={e => setEditing({ ...editing, buffer_minutes: Number(e.target.value) || 0 })} style={input()} />
            </Field>
            <Field label={t.form_price}>
              <input type="number" min={0} step="0.01" value={editing.price_amount} onChange={e => setEditing({ ...editing, price_amount: Number(e.target.value) || 0 })} style={input()} />
            </Field>
            <Field label={t.form_currency}>
              <input value={editing.price_currency} onChange={e => setEditing({ ...editing, price_currency: e.target.value.toUpperCase().slice(0, 3) })} style={input()} />
            </Field>
          </div>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
            <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
            {t.form_active}
          </label>

          <h3 style={{ marginTop: 24, fontSize: 15 }}>{t.weekly_availability}</h3>
          <p style={{ color: '#555', fontSize: 13, marginTop: 0 }}>{t.weekly_availability_hint}</p>
          <WindowsEditor value={editing.windows ?? []} onChange={w => setEditing({ ...editing, windows: w })} labels={t} />

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => saveService(editing, isCreating)} style={btnPrimary()}>
              {isCreating ? t.create : t.save}
            </button>
            <button onClick={() => { setEditing(null); setIsCreating(false) }} style={btn()}>{t.cancel}</button>
          </div>
        </section>
      )}

      <section style={card()}>
        <h2 style={{ margin: 0, fontSize: 18 }}>{t.general_business_hours}</h2>
        <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>{t.general_business_hours_hint}</p>
        <WindowsEditor value={businessHours} onChange={setBusinessHours} labels={t} />
        <button onClick={saveBusinessHours} style={{ ...btnPrimary(), marginTop: 12 }}>{t.save_hours}</button>
      </section>
    </div>
  )
}

function WindowsEditor({
  value,
  onChange,
  labels,
}: {
  value: Window[]
  onChange: (w: Window[]) => void
  labels: Strings
}) {
  function addWindow(weekday: Weekday) {
    onChange([...value, { weekday, start_time: '09:00', end_time: '18:00' }])
  }
  function removeWindow(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
  }
  function patchWindow(idx: number, patch: Partial<Window>) {
    onChange(value.map((w, i) => (i === idx ? { ...w, ...patch } : w)))
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {WEEKDAYS_ORDER.map(idx => {
        const rowsForDay = value
          .map((w, wIdx) => ({ w, wIdx }))
          .filter(x => x.w.weekday === idx)
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 48, fontWeight: 600 }}>{labels.weekdays[idx]}</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {rowsForDay.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>{labels.window_closed}</div>}
              {rowsForDay.map(({ w, wIdx }) => (
                <div key={wIdx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="time" value={w.start_time} onChange={e => patchWindow(wIdx, { start_time: e.target.value })} style={input()} />
                  <span>→</span>
                  <input type="time" value={w.end_time} onChange={e => patchWindow(wIdx, { end_time: e.target.value })} style={input()} />
                  <button onClick={() => removeWindow(wIdx)} style={btnSmallDanger()}>×</button>
                </div>
              ))}
            </div>
            <button onClick={() => addWindow(idx)} style={btnSmall()}>{labels.window_add}</button>
          </div>
        )
      })}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 12, color: '#777' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 13, color: '#555' }}>{label}</span>
      {children}
    </label>
  )
}

function card(): React.CSSProperties {
  return { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 20, marginBottom: 16 }
}
function row(): React.CSSProperties {
  return { display: 'flex', gap: 8, alignItems: 'center', padding: 10, border: '1px solid #eee', borderRadius: 6 }
}
function input(extra?: React.CSSProperties): React.CSSProperties {
  return { padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, minWidth: 0, width: '100%', ...extra }
}
function btn(): React.CSSProperties {
  return { padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }
}
function btnPrimary(): React.CSSProperties {
  return { padding: '10px 16px', background: '#111', color: '#fff', border: '1px solid #111', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }
}
function btnDisabled(): React.CSSProperties {
  return { padding: '10px 16px', background: '#eee', color: '#888', border: '1px solid #ddd', borderRadius: 4, cursor: 'not-allowed', fontWeight: 600 }
}
function btnSmall(): React.CSSProperties {
  return { padding: '4px 8px', fontSize: 12, background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }
}
function btnSmallDanger(): React.CSSProperties {
  return { padding: '4px 8px', fontSize: 12, background: '#fff0f0', border: '1px solid #f3a9a9', color: '#b00', borderRadius: 4, cursor: 'pointer' }
}
function grid(cols: number): React.CSSProperties {
  return { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, marginTop: 12 }
}
function segment(): React.CSSProperties {
  return { padding: '6px 12px', fontSize: 13, border: 'none', cursor: 'pointer' }
}
