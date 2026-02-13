'use client'

import { Card } from '@/components/ui/card'
import {
  FileCheck,
  PiggyBank,
  Package,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

export function ParasutFeaturesSection() {
  const { language } = useLanguage()

  const features = [
    {
      icon: FileCheck,
      title_en: 'Invoicing & Collections',
      title_tr: 'Faturalama ve Tahsilat',
      description_en: 'Create professional invoices in seconds and get paid faster with automated reminders.',
      description_tr: 'Saniyeler içinde profesyonel faturalar oluşturun ve otomatik hatırlatmalarla daha hızlı ödemelerinizi alın.',
      benefit_en: 'Get paid 40% faster',
      benefit_tr: '%40 daha hızlı tahsilat'
    },
    {
      icon: PiggyBank,
      title_en: 'Track Your Spending',
      title_tr: 'Harcamalarınızı Takip Edin',
      description_en: 'See exactly where your money goes with simple expense tracking and smart categorization.',
      description_tr: 'Basit harcama takibi ve akıllı kategorizasyon ile paranızın nereye gittiğini görün.',
      benefit_en: 'Save 20+ hours monthly',
      benefit_tr: 'Ayda 20+ saat tasarruf'
    },
    {
      icon: Package,
      title_en: 'Smart Stock Tracking',
      title_tr: 'Akıllı Stok Takibi',
      description_en: 'Never run out of stock again. Get alerts when inventory is low and automate reordering.',
      description_tr: 'Bir daha stokta kalma. Stok azaldığında uyarı alın ve yeniden sipariş vermeyi otomatikleştirin.',
      benefit_en: 'Reduce stockouts by 90%',
      benefit_tr: '%90 daha az stoksuzluk'
    },
    {
      icon: TrendingUp,
      title_en: 'Financial Insights',
      title_tr: 'Finansal İçgörüler',
      description_en: 'Make better decisions with clear reports and charts that show your business health at a glance.',
      description_tr: 'İşletmenizin sağlığını gösteren net raporlar ve grafiklerle daha iyi kararlar alın.',
      benefit_en: 'Understand your numbers',
      benefit_tr: 'Rakamlarınızı anlayın'
    },
    {
      icon: Users,
      title_en: 'Customer Management',
      title_tr: 'Müşteri Yönetimi',
      description_en: 'Keep all customer information in one place and never miss a follow-up or payment.',
      description_tr: 'Tüm müşteri bilgilerini tek yerde tutun ve hiçbir takibi veya ödemeyi kaçırmayın.',
      benefit_en: 'Build stronger relationships',
      benefit_tr: 'Daha güçlü ilişkiler kurun'
    },
    {
      icon: Zap,
      title_en: 'Automated Workflows',
      title_tr: 'Otomatik İş Akışları',
      description_en: 'Set it and forget it. Automate repetitive tasks and focus on growing your business.',
      description_tr: 'Kur ve unut. Tekrarlayan görevleri otomatikleştirin ve işinizi büyütmeye odaklanın.',
      benefit_en: 'Work smarter, not harder',
      benefit_tr: 'Daha akıllı çalışın'
    }
  ]

  return (
    <section id="features" className="py-20 lg:py-28 bg-white">
      <div className="container-marketing" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif', color: '#1a202c' }}>
            {language === 'en'
              ? 'Everything You Need to Run Your Business'
              : 'İşletmenizi Yönetmek İçin İhtiyacınız Olan Her Şey'
            }
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            {language === 'en'
              ? 'Simple tools that work together seamlessly. No complexity, just results.'
              : 'Sorunsuz çalışan basit araçlar. Karmaşıklık yok, sadece sonuçlar.'
            }
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-2 hover:border-blue-200"
              >
                <div className="mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {language === 'en' ? feature.title_en : feature.title_tr}
                </h3>

                <p className="text-gray-600 leading-relaxed mb-4">
                  {language === 'en' ? feature.description_en : feature.description_tr}
                </p>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-blue-600">
                    ✓ {language === 'en' ? feature.benefit_en : feature.benefit_tr}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
