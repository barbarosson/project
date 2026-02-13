'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'
import { useRouter } from 'next/navigation'
import { useContentSection } from '@/hooks/use-content-section'

interface ParasutHeroSectionProps {
  isAuthenticated?: boolean
}

export function ParasutHeroSection({ isAuthenticated = false }: ParasutHeroSectionProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const { config } = useSiteConfig()
  const [scrolled, setScrolled] = useState(false)

  const heroTitle = useContentSection('landing_hero_main_title', language, {
    en: 'Focus on Your Business, Not Your Accounting.',
    tr: 'Isletmenize Odaklanin, Muhasebenize Degil.'
  })

  const heroSubtitle = useContentSection('landing_hero_main_subtitle', language, {
    en: 'Modulus Business makes business management as simple as sending a text. No accounting degree required.',
    tr: 'Modulus Business, is yonetimini mesaj gondermek kadar basit hale getirir. Muhasebe diplomasi gerektirmez.'
  })

  const ctaStartFree = useContentSection('landing_hero_cta_start_free', language, {
    en: 'Start Free',
    tr: 'Ucretsiz Basla'
  })

  const ctaSeeHow = useContentSection('landing_hero_cta_see_how', language, {
    en: 'See How It Works',
    tr: 'Nasil Calisir?'
  })

  const ctaDashboard = useContentSection('landing_hero_cta_dashboard', language, {
    en: 'Go to Dashboard',
    tr: 'Panoya Git'
  })

  const benefit1 = useContentSection('landing_hero_benefit_1', language, {
    en: 'No credit card required',
    tr: 'Kredi karti gerekmez'
  })

  const benefit2 = useContentSection('landing_hero_benefit_2', language, {
    en: '14-day free trial',
    tr: '14 gunluk ucretsiz deneme'
  })

  const benefit3 = useContentSection('landing_hero_benefit_3', language, {
    en: 'Setup in 5 minutes',
    tr: '5 dakikada kurulum'
  })

  const floatingCta = useContentSection('landing_floating_cta', language, {
    en: 'Try for Free',
    tr: 'Ucretsiz Dene'
  })

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const benefits = [
    benefit1.content,
    benefit2.content,
    benefit3.content
  ]

  return (
    <>
      <section className="stripe-hero-gradient relative" style={{ paddingTop: '160px', paddingBottom: '120px' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black select-none"
            style={{
              fontSize: 'clamp(140px, 22vw, 320px)',
              color: 'rgba(255,255,255,0.06)',
              letterSpacing: '-0.04em',
              lineHeight: 0.9,
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
            }}
          >
            MODULUS
          </div>
          <div className="absolute top-20 right-[10%] w-[500px] h-[500px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.3) 0%, transparent 70%)' }} />
          <div className="absolute bottom-10 left-[5%] w-[400px] h-[400px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, rgba(0,115,230,0.3) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-10"
            style={{ background: 'radial-gradient(ellipse, rgba(0,212,170,0.2) 0%, transparent 60%)' }} />
        </div>

        <div className="relative z-10" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-10"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Sparkles className="h-4 w-4 text-[#00D4AA]" />
              <span className="text-sm font-semibold text-white/90">
                {config
                  ? (language === 'en' ? config.trust_badge_en : config.trust_badge_tr)
                  : (language === 'en' ? 'Trusted by 10,000+ businesses' : '10.000+ isletme tarafindan guveniliyor')
                }
              </span>
            </div>

            <h1 className="mb-8 animate-fade-in" style={{
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
              color: '#ffffff',
              fontSize: 'clamp(36px, 5vw, 64px)',
              lineHeight: '1.1',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}>
              {heroTitle.content}
            </h1>

            <p className="mb-12 max-w-3xl mx-auto animate-fade-in-delay" style={{
              fontSize: 'clamp(17px, 2vw, 21px)',
              lineHeight: '1.7',
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '-0.01em'
            }}>
              {heroSubtitle.content}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14 animate-fade-in-delay-2">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  className="gap-2 font-semibold transition-all duration-300 rounded-full text-base px-8 py-6 h-auto hover:scale-[1.02]"
                  style={{ backgroundColor: '#00D4AA', color: '#0A2540' }}
                  onClick={() => router.push('/dashboard')}
                >
                  {ctaDashboard.content}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      size="lg"
                      className="gap-2 font-semibold transition-all duration-300 rounded-full text-base px-8 py-6 h-auto hover:scale-[1.02]"
                      style={{ backgroundColor: '#00D4AA', color: '#0A2540' }}
                    >
                      {ctaStartFree.content}
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2 font-semibold transition-all duration-300 rounded-full text-base px-8 py-6 h-auto hover:bg-white/10"
                      style={{
                        borderColor: 'rgba(255,255,255,0.25)',
                        color: '#ffffff',
                        backgroundColor: 'transparent',
                      }}
                    >
                      {ctaSeeHow.content}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#00D4AA]" />
                  <span className="font-medium text-[15px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {scrolled && !isAuthenticated && (
        <div className="fixed z-50 animate-in slide-in-from-top" style={{ top: '96px', right: '8px' }}>
          <Link href="/login">
            <Button
              size="lg"
              className="gap-2 shadow-2xl rounded-full font-semibold transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: '#0A2540', color: '#00D4AA' }}
            >
              {floatingCta.content}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </>
  )
}
