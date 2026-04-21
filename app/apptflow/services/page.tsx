'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

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

const WEEKDAYS: Array<{ idx: Weekday; label: string }> = [
  { idx: 1, label: 'Mon' },
  { idx: 2, label: 'Tue' },
  { idx: 3, label: 'Wed' },
  { idx: 4, label: 'Thu' },
  { idx: 5, label: 'Fri' },
  { idx: 6, label: 'Sat' },
  { idx: 0, label: 'Sun' },
]

const VERTICAL_TEMPLATES: Record<
  string,
  Array<Omit<ServiceRow, 'id' | 'windows' | 'description'> & { windows?: Window[] }>
> = {
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
}

function defaultWindows(): Window[] {
  return [1, 2, 3, 4, 5, 6].map(idx => ({
    weekday: idx as Weekday,
    start_time: '09:00',
    end_time: '18:00',
  }))
}

export default function AppointFlowServicesPage() {
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [services, setServices] = useState<ServiceRow[]>([])
  const [businessHours, setBusinessHours] = useState<Window[]>(defaultWindows())
  const [editing, setEditing] = useState<ServiceRow | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const loadAll = useCallback(async (accessToken: string) => {
    try {
      const [svcRes, bhRes] = await Promise.all([
        fetch('/api/apptflow/admin/services', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/apptflow/admin/business-hours', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ])
      const svc = await svcRes.json()
      const bh = await bhRes.json()
      if (svc.ok) setServices(svc.services ?? [])
      else toast.error(svc.error || 'services_load_failed')
      if (bh.ok && Array.isArray(bh.windows) && bh.windows.length > 0) {
        setBusinessHours(
          bh.windows.map((w: any) => ({
            weekday: w.weekday,
            start_time: (w.start_time ?? '').slice(0, 5),
            end_time: (w.end_time ?? '').slice(0, 5),
          })),
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession()
      const accessToken = data.session?.access_token ?? null
      setToken(accessToken)
      if (accessToken) {
        await loadAll(accessToken)
      } else {
        setLoading(false)
      }
    })()
  }, [loadAll])

  async function saveService(row: ServiceRow, isNew: boolean) {
    if (!token) return
    const payload = {
      name: row.name,
      description: row.description,
      category: row.category,
      duration_minutes: row.duration_minutes,
      buffer_minutes: row.buffer_minutes,
      price_amount: row.price_amount,
      price_currency: row.price_currency || 'USD',
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
      toast.error(json.error || 'save_failed')
      return
    }
    toast.success(isNew ? 'Service created' : 'Service saved')
    setEditing(null)
    setIsCreating(false)
    await loadAll(token)
  }

  async function deleteService(id: string) {
    if (!token) return
    if (!confirm('Delete this service? This cannot be undone.')) return
    const res = await fetch(`/api/apptflow/admin/services/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok || !json.ok) {
      toast.error(json.error || 'delete_failed')
      return
    }
    toast.success('Service deleted')
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
      toast.error(json.error || 'save_failed')
      return
    }
    toast.success('Business hours saved')
  }

  function applyTemplate(key: keyof typeof VERTICAL_TEMPLATES) {
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
            price_currency: seed.price_currency,
            sort_order: seed.sort_order,
            is_active: true,
            windows: defaultWindows(),
          }),
        })
      }
      await loadAll(token)
      toast.success(`Seeded ${seeds.length} services for ${key}`)
    })()
  }

  if (loading) return <div style={{ padding: 32 }}>Loading…</div>
  if (!token) {
    return (
      <div style={{ padding: 32 }}>
        <h1>AppointFlow — Services</h1>
        <p>Please sign in to manage your services.</p>
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
    price_currency: 'USD',
    sort_order: services.length * 10,
    is_active: true,
    windows: defaultWindows(),
  })

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>AppointFlow — Services & Pricing</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Define the services your bot will offer. Each service has a duration, price, and
        (optionally) weekly hours when it can be booked. If you leave windows empty, your
        general business hours below are used.
      </p>

      {services.length === 0 && !isCreating && (
        <section style={card()}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Quick-start templates</h2>
          <p style={{ color: '#555', marginTop: 4 }}>
            No services yet. Pick a template to get going in seconds, then tweak anything you want.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {(['barber', 'salon', 'dental', 'psychiatrist'] as const).map(k => (
              <button key={k} onClick={() => applyTemplate(k)} style={btn()}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        </section>
      )}

      <section style={card()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Services</h2>
          <button onClick={() => { setEditing(emptyRow()); setIsCreating(true) }} style={btn()}>+ New service</button>
        </div>

        {services.length === 0 && <p style={{ color: '#888', marginTop: 12 }}>No services yet.</p>}

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {services.map(s => (
            <div key={s.id} style={row()}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  {s.name} {!s.is_active && <span style={{ color: '#b00', fontSize: 12 }}>(inactive)</span>}
                </div>
                <div style={{ color: '#555', fontSize: 13 }}>
                  {s.duration_minutes} min · {s.price_amount} {s.price_currency}
                  {s.category ? ` · ${s.category}` : ''}
                  {s.windows && s.windows.length > 0 ? ` · ${s.windows.length} windows` : ''}
                </div>
              </div>
              <button onClick={() => { setEditing({ ...s, windows: s.windows ?? [] }); setIsCreating(false) }} style={btnSmall()}>Edit</button>
              <button onClick={() => deleteService(s.id)} style={btnSmallDanger()}>Delete</button>
            </div>
          ))}
        </div>
      </section>

      {editing && (
        <section style={card()}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>{isCreating ? 'New service' : `Edit: ${editing.name}`}</h2>
          <div style={grid(2)}>
            <Field label="Name">
              <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} style={input()} />
            </Field>
            <Field label="Category">
              <input value={editing.category ?? ''} onChange={e => setEditing({ ...editing, category: e.target.value })} placeholder="hair, beard, combo…" style={input()} />
            </Field>
            <Field label="Description">
              <input value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} style={input()} />
            </Field>
            <Field label="Sort order">
              <input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} style={input()} />
            </Field>
            <Field label="Duration (min)">
              <input type="number" min={5} value={editing.duration_minutes} onChange={e => setEditing({ ...editing, duration_minutes: Number(e.target.value) || 30 })} style={input()} />
            </Field>
            <Field label="Buffer after (min)">
              <input type="number" min={0} value={editing.buffer_minutes} onChange={e => setEditing({ ...editing, buffer_minutes: Number(e.target.value) || 0 })} style={input()} />
            </Field>
            <Field label="Price">
              <input type="number" min={0} step="0.01" value={editing.price_amount} onChange={e => setEditing({ ...editing, price_amount: Number(e.target.value) || 0 })} style={input()} />
            </Field>
            <Field label="Currency">
              <input value={editing.price_currency} onChange={e => setEditing({ ...editing, price_currency: e.target.value.toUpperCase().slice(0, 3) })} style={input()} />
            </Field>
          </div>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
            <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
            Active (bot offers this service)
          </label>

          <h3 style={{ marginTop: 24, fontSize: 15 }}>Weekly availability</h3>
          <p style={{ color: '#555', fontSize: 13, marginTop: 0 }}>
            Leave empty to use your general business hours below.
          </p>
          <WindowsEditor value={editing.windows ?? []} onChange={w => setEditing({ ...editing, windows: w })} />

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => saveService(editing, isCreating)} style={btnPrimary()}>
              {isCreating ? 'Create' : 'Save'}
            </button>
            <button onClick={() => { setEditing(null); setIsCreating(false) }} style={btn()}>Cancel</button>
          </div>
        </section>
      )}

      <section style={card()}>
        <h2 style={{ margin: 0, fontSize: 18 }}>General business hours</h2>
        <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
          Used as default when a service has no specific windows set.
        </p>
        <WindowsEditor value={businessHours} onChange={setBusinessHours} />
        <button onClick={saveBusinessHours} style={{ ...btnPrimary(), marginTop: 12 }}>Save hours</button>
      </section>
    </div>
  )
}

function WindowsEditor({ value, onChange }: { value: Window[]; onChange: (w: Window[]) => void }) {
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
      {WEEKDAYS.map(({ idx, label }) => {
        const rowsForDay = value
          .map((w, wIdx) => ({ w, wIdx }))
          .filter(x => x.w.weekday === idx)
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 40, fontWeight: 600 }}>{label}</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {rowsForDay.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>closed</div>}
              {rowsForDay.map(({ w, wIdx }) => (
                <div key={wIdx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="time" value={w.start_time} onChange={e => patchWindow(wIdx, { start_time: e.target.value })} style={input()} />
                  <span>→</span>
                  <input type="time" value={w.end_time} onChange={e => patchWindow(wIdx, { end_time: e.target.value })} style={input()} />
                  <button onClick={() => removeWindow(wIdx)} style={btnSmallDanger()}>×</button>
                </div>
              ))}
            </div>
            <button onClick={() => addWindow(idx)} style={btnSmall()}>+ add</button>
          </div>
        )
      })}
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
function input(): React.CSSProperties {
  return { padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, minWidth: 0, width: '100%' }
}
function btn(): React.CSSProperties {
  return { padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }
}
function btnPrimary(): React.CSSProperties {
  return { padding: '10px 16px', background: '#111', color: '#fff', border: '1px solid #111', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }
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
