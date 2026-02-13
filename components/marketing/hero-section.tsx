'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play, CheckCircle2, LayoutDashboard } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'
import { HeroCarousel } from './hero-carousel'
import { useRouter } from 'next/navigation'

interface HeroSectionProps {
  isAuthenticated?: boolean
}

export function HeroSection({ isAuthenticated = false }: HeroSectionProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const { config, activeBanner } = useSiteConfig()
  const heroContent = {
    banners: [],
    title_en: 'Transform Your Business with Smart ERP',
    title_tr: 'İşletmenizi Akıllı ERP ile Dönüştürün',
    subtitle_en: 'All-in-one business management platform',
    subtitle_tr: 'Hepsi bir arada iş yönetim platformu',
    cta_primary_text_en: 'Start Free Trial',
    cta_primary_text_tr: 'Ücretsiz Deneyin',
    cta_primary_link: '/login',
    cta_secondary_text_en: 'Watch Demo',
    cta_secondary_text_tr: 'Demo İzleyin',
    cta_secondary_link: '#demo'
  }

  const trustedCompanies = [
    'Company A',
    'Company B',
    'Company C',
    'Company D',
    'Company E',
  ]

  const quickWins = [
    t.marketing.hero.deployMinutes,
    t.marketing.hero.noCreditCard,
    t.marketing.hero.freeTrial,
  ]

  return (
    <>
      {activeBanner && (
        <div className="relative w-full">
          {activeBanner.link_url ? (
            <a href={activeBanner.link_url} target="_blank" rel="noopener noreferrer">
              <img
                src={activeBanner.image_url}
                alt={activeBanner.title}
                className="w-full h-auto max-h-[400px] object-cover"
              />
            </a>
          ) : (
            <img
              src={activeBanner.image_url}
              alt={activeBanner.title}
              className="w-full h-auto max-h-[400px] object-cover"
            />
          )}
        </div>
      )}

      <section
        className="relative overflow-hidden"
        style={{
          paddingTop: 'var(--section-padding-top, 60px)',
          paddingBottom: 'var(--section-padding-bottom, 60px)',
          backgroundColor: 'var(--hero-section-background, #ffffff)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"></div>

        <div className="container-marketing relative" style={{ maxWidth: 'var(--container-max-width, 1280px)', padding: '0 var(--container-padding, 20px)' }}>
        <div className="grid lg:grid-cols-2 items-center" style={{ gap: 'var(--section-gap, 40px)' }}>
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                  {t.marketing.hero.nowAvailable}
                </span>
              </div>

              <h1
                className="font-bold tracking-tight text-balance text-auto-contrast-light"
                style={{
                  fontSize: 'var(--hero-title-font-size, 48px)',
                }}
              >
                {language === 'en' ? heroContent.title_en : heroContent.title_tr}
              </h1>

              <p className="text-lg lg:text-xl text-balance text-auto-contrast-muted-light">
                {language === 'en' ? heroContent.subtitle_en : heroContent.subtitle_tr}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <>
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:from-[#00B894] hover:to-[#00997a] text-white shadow-lg"
                    onClick={() => router.push('/dashboard')}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    {language === 'en' ? 'Go to Dashboard' : 'Panoya Git'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Link href={heroContent.cta_secondary_link || '#how-it-works'}>
                    <Button size="lg" variant="outline" className="gap-2">
                      <Play className="h-4 w-4" />
                      {language === 'en' ? heroContent.cta_secondary_text_en : heroContent.cta_secondary_text_tr}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href={heroContent.cta_primary_link || '/contact'}>
                    <Button size="lg" className="gap-2">
                      {language === 'en' ? heroContent.cta_primary_text_en : heroContent.cta_primary_text_tr}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={heroContent.cta_secondary_link || '#how-it-works'}>
                    <Button size="lg" variant="outline" className="gap-2">
                      <Play className="h-4 w-4" />
                      {language === 'en' ? heroContent.cta_secondary_text_en : heroContent.cta_secondary_text_tr}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4">
              {quickWins.map((win) => (
                <div key={win} className="flex items-center gap-2 text-sm text-auto-contrast-muted-light">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {win}
                </div>
              ))}
            </div>

            <div className="pt-4">
              <p className="text-sm text-auto-contrast-muted-light mb-4">{t.marketing.hero.trustedBy}</p>
              <div className="flex flex-wrap items-center gap-8">
                {trustedCompanies.map((company) => (
                  <div
                    key={company}
                    className="flex items-center justify-center h-10 px-4 bg-gray-100 rounded text-sm font-medium text-gray-600"
                  >
                    {company}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 aspect-square lg:aspect-auto lg:h-[600px] border border-primary/20 shadow-xl">
              <div className="absolute inset-4 bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="bg-gray-100 h-10 flex items-center px-4 gap-2">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="ml-4 text-xs text-muted-foreground">Dashboard</div>
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-primary/10 rounded-lg h-20"></div>
                      <div className="bg-primary/10 rounded-lg h-20"></div>
                      <div className="bg-primary/10 rounded-lg h-20"></div>
                    </div>
                    <div className="bg-gray-100 rounded-lg h-32"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-100 rounded-lg h-24"></div>
                      <div className="bg-gray-100 rounded-lg h-24"></div>
                    </div>
                    <div className="bg-gray-100 rounded-lg h-40"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
    </>
  )
}
