'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Receipt,
  FileSearch,
  Wallet,
  Boxes,
  ShoppingCart,
  Factory,
  FolderKanban,
  Users,
  Brain,
  LineChart,
  CalendarClock
} from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'

export function ModulusModulesOverviewSection() {
  const { language } = useLanguage()

  const modules = [
    {
      icon: FileText,
      key: 'sales',
      title_en: 'Sales Invoices & E-Invoice',
      title_tr: 'Satış Faturaları & E-Fatura',
      description_en:
        'Create proforma, retail and accommodation tax invoices in seconds, then send as e-invoice or e-archive with one click.',
      description_tr:
        'Proforma, perakende ve konaklama vergisi faturalarını saniyeler içinde oluşturun, tek tıkla e-fatura veya e-arşiv olarak gönderin.',
      bullets_en: [
        'Advanced invoice types (proforma, retail, accommodation tax)',
        'Direct GİB / NES e-invoice integration',
        'Status tracking and XML / PDF view'
      ],
      bullets_tr: [
        'Gelişmiş fatura tipleri (proforma, perakende, konaklama vergisi)',
        'GİB / NES e-fatura entegrasyonu',
        'Durum takibi ve XML / PDF görüntüleme'
      ]
    },
    {
      icon: Receipt,
      key: 'expenses',
      title_en: 'Expenses & Purchase Invoices',
      title_tr: 'Giderler & Alış Faturaları',
      description_en:
        'Track all your supplier invoices and expenses in one place, including receipts scanned with AI.',
      description_tr:
        'Tüm tedarikçi faturalarınızı ve giderlerinizi, yapay zeka ile taranan fişler dahil tek ekrandan yönetin.',
      bullets_en: [
        'Incoming purchase invoice list and approval flow',
        'AI-powered receipt OCR for fast entry',
        'Automatic supplier and balance updates'
      ],
      bullets_tr: [
        'Gelen alış faturası listesi ve onay akışı',
        'Hızlı giriş için yapay zeka ile fiş okuma (OCR)',
        'Otomatik tedarikçi ve bakiye güncelleme'
      ]
    },
    {
      icon: FileSearch,
      key: 'einvoice',
      title_en: 'E-Invoice Center',
      title_tr: 'E-Fatura Merkezi',
      description_en:
        'See all incoming and outgoing e-documents in one hub, preview the invoice and import to expenses with one click.',
      description_tr:
        'Tüm gelen ve giden e-dokümanları tek merkezde görün, faturayı önizleyin ve tek tıkla giderlere aktarın.',
      bullets_en: [
        'Incoming / outgoing e-invoice and e-archive dashboard',
        'Preview screen before importing incoming invoices',
        '"Import to expenses" flow that creates supplier and purchase invoice automatically'
      ],
      bullets_tr: [
        'Gelen / giden e-fatura ve e-arşiv panosu',
        'Gelen faturayı içeri aktarmadan önce önizleme ekranı',
        'Cari ve alış faturasını otomatik oluşturan “giderlere aktar” akışı'
      ]
    },
    {
      icon: Wallet,
      key: 'finance',
      title_en: 'Finance & Cash Flow',
      title_tr: 'Finans & Nakit Akışı',
      description_en:
        'Monitor receivables, payables and collections to always know your cash position.',
      description_tr:
        'Alacak, borç ve tahsilatları izleyerek nakit durumunuzu her an görün.',
      bullets_en: [
        'Customer and supplier balances updated from invoices and expenses',
        'Finance transactions and account statements',
        'AI-powered cash flow and finance assistants'
      ],
      bullets_tr: [
        'Fatura ve giderlerden güncellenen cari bakiyeler',
        'Finans hareketleri ve hesap ekstreleri',
        'Yapay zeka destekli nakit akışı ve finans asistanları'
      ]
    },
    {
      icon: Boxes,
      key: 'inventory',
      title_en: 'Inventory & Stocks',
      title_tr: 'Envanter & Stoklar',
      description_en:
        'Track products, stock levels and movements directly from your purchase and sales flows.',
      description_tr:
        'Ürünlerinizi, stok seviyelerinizi ve hareketlerinizi alış ve satış akışlarıyla birlikte takip edin.',
      bullets_en: [
        'Real-time stock levels from invoices and purchase orders',
        'Critical stock alerts',
        'SKUs, warehouses and stock reports'
      ],
      bullets_tr: [
        'Fatura ve siparişlerden gerçek zamanlı stok seviyeleri',
        'Kritik stok uyarıları',
        'Stok kartları, depolar ve stok raporları'
      ]
    },
    {
      icon: ShoppingCart,
      key: 'procurement',
      title_en: 'Procurement & Purchasing',
      title_tr: 'Satınalma & Tedarik',
      description_en:
        'Manage purchase requests, suppliers and orders in one place and connect them to stock and expenses.',
      description_tr:
        'Satınalma taleplerini, tedarikçileri ve siparişleri tek merkezden yönetin, stok ve giderlerle bağlayın.',
      bullets_en: [
        'Procurement dashboard and purchase orders',
        'Supplier management and price control',
        'Direct link to inventory and expenses'
      ],
      bullets_tr: [
        'Satınalma panosu ve satınalma siparişleri',
        'Tedarikçi yönetimi ve fiyat kontrolü',
        'Stok ve gider modülleriyle doğrudan bağlantı'
      ]
    },
    {
      icon: Factory,
      key: 'production',
      title_en: 'Production & Manufacturing',
      title_tr: 'Üretim & İmalat',
      description_en:
        'Plan, track and analyze your production orders with integrated material and cost tracking.',
      description_tr:
        'Üretim emirlerinizi malzeme ve maliyet takibiyle birlikte planlayın, izleyin ve analiz edin.',
      bullets_en: [
        'Production orders linked to inventory',
        'Material consumption and cost breakdowns',
        'AI production advisor module'
      ],
      bullets_tr: [
        'Stok ile bağlantılı üretim emirleri',
        'Malzeme sarfiyatı ve maliyet kırılımları',
        'Yapay zeka destekli üretim danışmanı'
      ]
    },
    {
      icon: FolderKanban,
      key: 'projects',
      title_en: 'Projects & Jobs',
      title_tr: 'Projeler & İşler',
      description_en:
        'Group invoices, expenses and tasks under projects to see profitability by job or customer.',
      description_tr:
        'Fatura, gider ve işleri projeler altında gruplayarak proje veya müşteri bazında kârlılığı görün.',
      bullets_en: [
        'Project-level income, cost and profit views',
        'Link sales, purchases and production to projects',
        'Executive and AI assistants for project insights'
      ],
      bullets_tr: [
        'Proje bazında gelir, gider ve kârlılık görünümü',
        'Satış, alış ve üretimi projelere bağlama',
        'Yönetici ve yapay zeka asistanları ile proje içgörüleri'
      ]
    },
    {
      icon: Users,
      key: 'crm',
      title_en: 'CRM & Customers',
      title_tr: 'CRM & Müşteriler',
      description_en:
        'Keep all customer information, balances and interactions in one place.',
      description_tr:
        'Tüm müşteri bilgilerini, bakiyelerini ve etkileşimlerini tek yerde yönetin.',
      bullets_en: [
        'Customer cards with contact, tax and balance details',
        'Merge and clean up duplicate customers',
        'CRM board and follow-up tools'
      ],
      bullets_tr: [
        'İletişim, vergi ve bakiye bilgileriyle müşteri kartları',
        'Çift kayıtları birleştirme ve temizleme',
        'CRM panosu ve takip araçları'
      ]
    },
    {
      icon: Brain,
      key: 'ai',
      title_en: 'AI Assistants & Insights',
      title_tr: 'Yapay Zeka Asistanları & İçgörüler',
      description_en:
        'Use AI to understand your numbers, forecast cash flow and get recommendations across modules.',
      description_tr:
        'Rakamlarınızı anlamak, nakit akışını tahmin etmek ve modüller arasında öneriler almak için yapay zeka kullanın.',
      bullets_en: [
        'Accounting, finance and production AI advisors',
        'Context-aware answers from your own data',
        'Scenario analysis and “what if” questions'
      ],
      bullets_tr: [
        'Muhasebe, finans ve üretim için yapay zeka danışmanları',
        'Kendi verilerinizden bağlamsal yanıtlar',
        'Senaryo analizi ve “ya şöyle olursa?” soruları'
      ]
    },
    {
      icon: LineChart,
      key: 'reporting',
      title_en: 'Reporting & Dashboards',
      title_tr: 'Raporlama & Panolar',
      description_en:
        'See the full picture with dashboards, executive summaries and exportable reports.',
      description_tr:
        'Panolar, yönetici özetleri ve dışa aktarılabilir raporlarla büyük resmi görün.',
      bullets_en: [
        'Executive dashboard with cash, sales and expenses',
        'Module-specific reports (invoices, stocks, projects)',
        'Excel / CSV export for deeper analysis'
      ],
      bullets_tr: [
        'Nakit, satış ve giderleri içeren yönetici panosu',
        'Fatura, stok, proje gibi modül bazlı raporlar',
        'Detaylı analiz için Excel / CSV dışa aktarma'
      ]
    },
    {
      icon: CalendarClock,
      key: 'appointflow',
      href: '/products/appointflow',
      badge_en: 'NEW',
      badge_tr: 'YENİ',
      title_en: 'AppointFlow — Autonomous Appointment Agent',
      title_tr: 'AppointFlow — Otonom Randevu Ajanı',
      description_en:
        'A 24/7 AI agent that books, reminds and manages client appointments over WhatsApp + Google Calendar — perfect for service businesses.',
      description_tr:
        'WhatsApp ve Google Calendar üzerinden 7/24 randevu alan, hatırlatan ve yöneten yapay zeka ajanı — hizmet işletmeleri için birebir.',
      bullets_en: [
        'Inbound WhatsApp replies in 9 languages',
        'Auto-books slots from your Google Calendar',
        '24h + 2h reminders, no-show recovery, full billing'
      ],
      bullets_tr: [
        '9 dilde WhatsApp mesajlarına otomatik yanıt',
        'Google Calendar\'dan otomatik uygun saat önerisi',
        '24s + 2s hatırlatma, gelmeyen telafisi, tam faturalama'
      ]
    }
  ]

  return (
    <section id="modules" className="py-20 lg:py-28 bg-gradient-to-b from-white via-gray-50 to-white">
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-600 text-white px-4 py-1.5">
            {language === 'en' ? 'All-in-One Modules' : 'Tüm Modüller Tek Yerde'}
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif', color: '#1a202c' }}>
            {language === 'en'
              ? 'Everything Your Business Needs, Connected'
              : 'İşletmenizin İhtiyaç Duyduğu Her Şey, Birbirine Bağlı'}
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto">
            {language === 'en'
              ? 'Modulus connects sales, expenses, stocks, production, projects and AI assistants into a single, coherent system. Start with the modules you need and grow at your own pace.'
              : 'Modulus; satış, gider, stok, üretim, projeler ve yapay zeka asistanlarını tek bir bütünleşik sistemde birleştirir. İhtiyacınız olan modüllerle başlayın, işiniz büyüdükçe adım adım ekleyin.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
          {modules.map((mod) => {
            const Icon = mod.icon
            const bullets = language === 'en' ? mod.bullets_en : mod.bullets_tr
            const badge = (mod as any).badge_en && (mod as any).badge_tr
              ? (language === 'en' ? (mod as any).badge_en : (mod as any).badge_tr)
              : null
            const href = (mod as any).href as string | undefined

            const card = (
              <Card
                key={mod.key}
                className={`p-7 bg-white border transition-all duration-300 flex flex-col h-full ${
                  href
                    ? 'border-[#00D4AA]/40 hover:border-[#00D4AA] hover:shadow-2xl cursor-pointer'
                    : 'border-gray-200 hover:border-blue-200 hover:shadow-xl'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    href ? 'bg-[#00D4AA]/10' : 'bg-blue-50'
                  }`}>
                    <Icon className={`h-6 w-6 ${href ? 'text-[#00D4AA]' : 'text-blue-600'}`} />
                  </div>
                  <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif', color: '#1a202c' }}>
                    <span>{language === 'en' ? mod.title_en : mod.title_tr}</span>
                    {badge && (
                      <Badge className="bg-[#00D4AA] text-white text-[10px] px-2 py-0.5 leading-none">
                        {badge}
                      </Badge>
                    )}
                  </h3>
                </div>

                <p className="text-sm text-gray-700 mb-4">
                  {language === 'en' ? mod.description_en : mod.description_tr}
                </p>

                <ul className="space-y-1.5 text-sm text-gray-600 mt-auto">
                  {bullets.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className={`mt-1 ${href ? 'text-[#00D4AA]' : 'text-blue-500'}`}>•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {href && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <span className="text-sm font-semibold text-[#0A2540] inline-flex items-center gap-1">
                      {language === 'en' ? 'Learn more' : 'Detayları gör'} <span aria-hidden>→</span>
                    </span>
                  </div>
                )}
              </Card>
            )

            return href ? (
              <Link key={mod.key} href={href} className="block h-full">
                {card}
              </Link>
            ) : (
              <div key={mod.key} className="h-full">
                {card}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

