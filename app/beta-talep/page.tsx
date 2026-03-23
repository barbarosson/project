'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModulusLogo } from '@/components/modulus-logo'
import { ArrowLeft, Mail } from 'lucide-react'

export default function BetaTalepPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [emailAckSent, setEmailAckSent] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setWarning(null)
    setEmailAckSent(null)
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Lütfen e-posta adresinizi girin.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/beta/reference/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const hint = typeof data.hint === 'string' ? data.hint : ''
        if (data.error === 'invalid_email') {
          setError('Geçerli bir e-posta adresi girin.')
        } else if (data.error === 'server_config' || data.error === 'schema_not_ready') {
          setError(
            hint ||
              (data.error === 'schema_not_ready'
                ? 'Veritabanı tablosu henüz oluşturulmamış. Yönetici migration uygulamalı.'
                : 'Sunucu yapılandırması eksik (Supabase service role).')
          )
        } else {
          setError(hint || 'Talep gönderilemedi. Lütfen tekrar deneyin.')
        }
        return
      }
      setMessage(
        typeof data.message === 'string'
          ? data.message
          : 'Talebiniz alındı. Onay sonrası referans kodunuz e-posta ile iletilecektir.'
      )
      if (typeof data.warning === 'string' && data.warning.trim()) {
        setWarning(data.warning.trim())
      }
      setEmailAckSent(typeof data.emailAckSent === 'boolean' ? data.emailAckSent : null)
      setEmail('')
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen text-white"
      style={{ background: 'linear-gradient(180deg, #0A2540 0%, #071a2e 45%, #061528 100%)' }}
    >
      <div className="mx-auto max-w-lg px-6 py-12 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Ana sayfaya dön
        </Link>

        <div className="flex flex-col items-center text-center mb-8">
          <ModulusLogo size={56} variant="light" showText />
          <h1 className="mt-6 text-2xl md:text-3xl font-bold" style={{ color: '#F8FAFC' }}>
            Beta referans kodu talebi
          </h1>
          <p className="mt-3 text-sm md:text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Talebiniz <strong className="text-[#00D4AA]">info@modulustech.app</strong> üzerinden yönetilir
            — admin onayından sonra referans kodunuz e-posta adresinize gönderilir.
          </p>
        </div>

        <div
          className="rounded-2xl p-6 md:p-8"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.35)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="space-y-2">
              <Label htmlFor="beta-email" className="text-white/90 flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#00D4AA]" />
                E-posta
              </Label>
              <Input
                id="beta-email"
                type="email"
                autoComplete="email"
                placeholder="ornek@sirket.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white/95 border-slate-200 text-[#0A2540]"
              />
            </div>
            {error && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.12)', color: '#FCA5A5' }}>
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(16,185,129,0.12)', color: '#6EE7B7' }}>
                {message}
                {emailAckSent === true && (
                  <span className="block mt-2 text-xs opacity-90">
                    Size “Talebiniz alındı” bilgilendirmesi gittiyse e-posta gönderimi çalışıyordur; gelmediyse Resend/domain ayarlarını kontrol edin.
                  </span>
                )}
              </p>
            )}
            {warning && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(251,191,36,0.15)', color: '#FDE68A' }}>
                <strong className="block mb-1">E-posta uyarısı</strong>
                {warning}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full font-semibold"
              style={{ backgroundColor: '#00D4AA', color: '#0A2540' }}
            >
              {loading ? 'Gönderiliyor…' : 'Talep gönder'}
            </Button>
          </form>

          <p className="mt-6 text-xs text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Zaten kodunuz varsa ana sayfada{' '}
            <Link href="/" className="text-[#7DD3FC] hover:underline">
              erişim kodu
            </Link>{' '}
            ile devam edebilirsiniz.
          </p>
        </div>
      </div>
    </main>
  )
}
