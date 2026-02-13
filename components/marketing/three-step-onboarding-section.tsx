'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, UserPlus, Settings, Rocket } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import Link from 'next/link'

export function ThreeStepOnboardingSection() {
  const { language } = useLanguage()

  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title_en: 'Sign Up',
      title_tr: 'Kaydol',
      description_en: 'Create your account in 30 seconds. Just your email and name.',
      description_tr: '30 saniyede hesabınızı oluşturun. Sadece e-posta ve isim.',
      time_en: '30 seconds',
      time_tr: '30 saniye'
    },
    {
      number: 2,
      icon: Settings,
      title_en: 'Customize Your Modules',
      title_tr: 'Modüllerinizi Özelleştirin',
      description_en: 'Choose the features you need. Add or remove modules anytime.',
      description_tr: 'İhtiyacınız olan özellikleri seçin. İstediğiniz zaman modül ekleyin veya çıkarın.',
      time_en: '2 minutes',
      time_tr: '2 dakika'
    },
    {
      number: 3,
      icon: Rocket,
      title_en: 'Start Growing',
      title_tr: 'Büyümeye Başlayın',
      description_en: 'Everything is ready. Start managing your business effortlessly.',
      description_tr: 'Her şey hazır. İşletmenizi zahmetsizce yönetmeye başlayın.',
      time_en: 'Instant',
      time_tr: 'Anında'
    }
  ]

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white">
      <div className="container-marketing" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif', color: '#1a202c' }}>
            {language === 'en'
              ? 'Get Started in 3 Simple Steps'
              : '3 Basit Adımda Başlayın'
            }
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            {language === 'en'
              ? 'No complicated setup. No technical knowledge required. Just sign up and start.'
              : 'Karmaşık kurulum yok. Teknik bilgi gerekmez. Sadece kaydolun ve başlayın.'
            }
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16 relative">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === steps.length - 1

            return (
              <div key={index} className="relative">
                <Card className="p-8 bg-white hover:shadow-xl transition-all duration-300 h-full border-2 hover:border-blue-200">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm border-4 border-white">
                        {step.number}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {language === 'en' ? step.title_en : step.title_tr}
                    </h3>

                    <p className="text-gray-600 leading-relaxed mb-4">
                      {language === 'en' ? step.description_en : step.description_tr}
                    </p>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                      ⏱ {language === 'en' ? step.time_en : step.time_tr}
                    </div>
                  </div>
                </Card>

                {!isLast && (
                  <div className="hidden md:block absolute top-1/2 -right-4 z-10 transform -translate-y-1/2">
                    <ArrowRight className="h-8 w-8 text-blue-300" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Link href="/login">
            <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-lg px-8 py-6 h-auto">
              {language === 'en' ? 'Start Your Free Trial Now' : 'Ücretsiz Denemenizi Şimdi Başlatın'}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-gray-600">
            {language === 'en'
              ? 'No credit card required • Cancel anytime • Free for 14 days'
              : 'Kredi kartı gerekmez • İstediğiniz zaman iptal • 14 gün ücretsiz'
            }
          </p>
        </div>
      </div>
    </section>
  )
}
