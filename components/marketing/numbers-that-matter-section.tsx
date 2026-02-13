'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Zap, Headphones, Users, TrendingUp, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

export function NumbersThatMatterSection() {
  const { language } = useLanguage()

  const stats = [
    {
      icon: Users,
      number: '10,000+',
      label_en: 'Active Businesses',
      label_tr: 'Aktif İşletme',
      color: 'blue'
    },
    {
      icon: CheckCircle2,
      number: '99.9%',
      label_en: 'Uptime Guarantee',
      label_tr: 'Çalışma Süresi',
      color: 'green'
    },
    {
      icon: Zap,
      number: '<100ms',
      label_en: 'Response Time',
      label_tr: 'Yanıt Süresi',
      color: 'yellow'
    },
    {
      icon: Headphones,
      number: '24/7',
      label_en: 'Support Available',
      label_tr: 'Destek Hizmeti',
      color: 'purple'
    },
    {
      icon: TrendingUp,
      number: '₺50M+',
      label_en: 'Processed Monthly',
      label_tr: 'Aylık İşlem',
      color: 'indigo'
    },
    {
      icon: Shield,
      number: '100%',
      label_en: 'Data Security',
      label_tr: 'Veri Güvenliği',
      color: 'red'
    }
  ]

  const trustBadges = [
    {
      icon: Shield,
      title_en: 'Enterprise-Grade Security',
      title_tr: 'Kurumsal Düzey Güvenlik',
      description_en: 'Powered by Supabase - Bank-level encryption',
      description_tr: 'Supabase ile güçlendirilmiş - Banka düzeyinde şifreleme'
    },
    {
      icon: Zap,
      title_en: 'Lightning Fast',
      title_tr: 'Yıldırım Hızı',
      description_en: 'Next.js powered for instant page loads',
      description_tr: 'Next.js ile anlık sayfa yüklemeleri'
    },
    {
      icon: Headphones,
      title_en: 'Always Here for You',
      title_tr: 'Her Zaman Yanınızdayız',
      description_en: 'Real human support, 24/7 availability',
      description_tr: 'Gerçek insan desteği, 7/24 erişilebilirlik'
    }
  ]

  const sectionContent = {
    badge_text_en: 'Trusted & Reliable',
    badge_text_tr: 'Güvenilir & Sağlam',
    title_en: 'Numbers That Matter',
    title_tr: 'Önemli Rakamlar',
    subtitle_en: 'We build trust through transparency and consistent delivery',
    subtitle_tr: 'Şeffaflık ve tutarlı hizmet ile güven inşa ediyoruz'
  }

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <div className="container-marketing" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-600 text-white px-4 py-1.5">
            {language === 'en' ? sectionContent.badge_text_en : sectionContent.badge_text_tr}
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif', color: '#1a202c' }}>
            {language === 'en' ? sectionContent.title_en : sectionContent.title_tr}
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            {language === 'en' ? sectionContent.subtitle_en : sectionContent.subtitle_tr}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const colorClasses = {
              blue: 'bg-blue-50 text-blue-600',
              green: 'bg-green-50 text-green-600',
              yellow: 'bg-yellow-50 text-yellow-600',
              purple: 'bg-purple-50 text-purple-600',
              indigo: 'bg-indigo-50 text-indigo-600',
              red: 'bg-red-50 text-red-600'
            }
            return (
              <Card key={index} className="p-6 text-center bg-white hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${colorClasses[stat.color as keyof typeof colorClasses]} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {stat.number}
                </div>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? stat.label_en : stat.label_tr}
                </p>
              </Card>
            )
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <Card key={index} className="p-8 text-center bg-white hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {language === 'en' ? badge.title_en : badge.title_tr}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? badge.description_en : badge.description_tr}
                </p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
