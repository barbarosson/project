'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModulusLogo } from '@/components/modulus-logo'
import { Lock, Sparkles } from 'lucide-react'
import {
  BETA_SESSION_STORAGE_KEY,
  REFERENCE_CODE_DISPLAY,
  safeReturnPath,
} from '@/lib/beta-access'

type BetaHomeGateProps = {
  children: ReactNode
}

export function BetaHomeGate({ children }: BetaHomeGateProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    setReturnTo(safeReturnPath(p.get('returnTo')))
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/beta/status', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!cancelled && data?.unlocked === true) {
          try {
            sessionStorage.setItem(BETA_SESSION_STORAGE_KEY, '1')
          } catch {
            /* ignore */
          }
          setUnlocked(true)
        } else if (!cancelled) {
          try {
            if (sessionStorage.getItem(BETA_SESSION_STORAGE_KEY) === '1') {
              /* Eski oturum: çerez yoksa tekrar kod gerekir */
            }
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setMounted(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = code.trim()
    if (!trimmed) {
      setError('Lütfen erişim kodunu girin.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/beta/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError('Erişim kodu hatalı. Davetli beta kullanıcıları için doğru kodu girin.')
        return
      }
      try {
        sessionStorage.setItem(BETA_SESSION_STORAGE_KEY, '1')
      } catch {
        /* ignore */
      }
      setUnlocked(true)
      const dest = safeReturnPath(returnTo) || '/'
      if (dest !== '/' || (typeof window !== 'undefined' && window.location.search)) {
        router.replace(dest)
      }
    } catch {
      setError('Bağlantı hatası. Tekrar deneyin.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0A2540 0%, #061528 100%)' }}
      >
        <div className="h-10 w-10 border-2 border-white/30 border-t-[#00D4AA] rounded-full animate-spin" />
      </div>
    )
  }

  if (unlocked) {
    return <>{children}</>
  }

  return (
    <main
      className="min-h-screen text-white"
      style={{ background: 'linear-gradient(180deg, #0A2540 0%, #071a2e 45%, #061528 100%)' }}
    >
      <div className="mx-auto max-w-lg px-6 py-16 md:py-24">
        <div className="flex flex-col items-center text-center mb-10">
          <ModulusLogo size={64} variant="light" showText />
          <span
            className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.35)', color: '#7DD3FC' }}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#00D4AA]" />
            Yapım aşamasında
          </span>
          <h1 className="mt-6 text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#F8FAFC' }}>
            Modulus SaaS — Beta ön izleme
          </h1>
          <p className="mt-3 text-sm md:text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            <strong className="text-white/95">Beta sürümü</strong> yalnızca{' '}
            <strong className="text-[#00D4AA]">sınırlı kullanıcı</strong> ve davet kapsamında açılmıştır.
          </p>
          <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Henüz referans kodunuz yok mu?{' '}
            <Link href="/beta-talep" className="font-semibold text-[#7DD3FC] hover:underline">
              Beta referans kodu talep edin
            </Link>{' '}
            — onay sonrası kod e-postanıza gönderilir.
          </p>
          {returnTo && (
            <p className="mt-4 text-xs rounded-lg px-3 py-2 max-w-md" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)' }}>
              Erişim sonrası sizi şu adrese yönlendireceğiz:{' '}
              <span className="font-mono text-[#00D4AA]">{returnTo}</span>
            </p>
          )}
        </div>

        <div
          className="rounded-2xl p-6 md:p-8 mb-8"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.35)',
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="text-left">
              <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Referans kodu
              </p>
              <p className="text-lg font-mono font-bold tracking-wide mt-0.5" style={{ color: '#00D4AA' }}>
                {REFERENCE_CODE_DISPLAY}
              </p>
            </div>
            <div
              className="text-[10px] font-medium px-2 py-1 rounded-md"
              style={{ background: 'rgba(251,191,36,0.12)', color: '#FCD34D', border: '1px solid rgba(251,191,36,0.25)' }}
            >
              Ön üretim
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="space-y-2">
              <Label htmlFor="beta-access" className="text-white/90 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-[#00D4AA]" />
                Erişim kodu
              </Label>
              <Input
                id="beta-access"
                type="password"
                autoComplete="off"
                placeholder="Davet erişim kodunuzu girin"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-12 bg-white/95 border-slate-200 text-[#0A2540] placeholder:text-slate-400"
              />
            </div>
            {error && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.12)', color: '#FCA5A5' }}>
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-full font-semibold text-base"
              style={{ backgroundColor: '#00D4AA', color: '#0A2540' }}
            >
              {submitting ? 'Doğrulanıyor…' : 'Devam et'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="font-semibold text-[#7DD3FC] hover:underline">
              Giriş yapın
            </Link>
          </p>
        </div>

        <section
          className="rounded-2xl p-6 text-left"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Yakında hayata geçecek Modulus SaaS
          </h2>
          <ul className="space-y-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            <li className="flex gap-2">
              <span className="text-[#00D4AA] mt-0.5">●</span>
              <span>
                <strong className="text-white/90">Modulus SaaS</strong>, KOBİ ve büyüyen ekipler için bulut tabanlı modüler
                işletme yazılımı olarak tasarlanmaktadır.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#00D4AA] mt-0.5">●</span>
              <span>
                Faturalama, stok, CRM ve raporlama modülleri tek çatı altında; ihtiyaca göre genişleyen yapı.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#00D4AA] mt-0.5">●</span>
              <span>
                Resmi lansman öncesi bu ekranlar geliştirilmektedir. Geri bildiriminiz ürün yol haritamıza
                katkı sağlar.
              </span>
            </li>
          </ul>
          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Ticari unvan ve iletişim:{' '}
            <Link href="/contact" className="text-[#7DD3FC] hover:underline">
              İletişim
            </Link>
            {' · '}
            <Link href="/landing" className="text-[#7DD3FC] hover:underline">
              Tanıtım sayfası
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
