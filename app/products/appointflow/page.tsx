'use client'

import Link from 'next/link'
import { MarketingLayout } from '@/components/marketing/marketing-layout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  Check,
  Bell,
  Shield,
  Globe,
  TrendingUp,
  Zap,
  Bot,
  Users,
  RefreshCcw,
  Wallet,
  UserPlus,
  Target,
  MessageCircle,
  DollarSign,
  ShieldCheck,
  Clock,
  Calendar,
  AlertTriangle,
  ChevronDown
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useState } from 'react'

type Tier = {
  key: 'starter' | 'pro' | 'business'
  name: string
  priceUsd: number
  priceYearlyUsd: number
  tagline_en: string
  tagline_tr: string
  features_en: string[]
  features_tr: string[]
  highlighted?: boolean
}

const TIERS: Tier[] = [
  {
    key: 'starter',
    name: 'Starter',
    priceUsd: 29,
    priceYearlyUsd: 290,
    tagline_en: 'For solo professionals',
    tagline_tr: 'Bireysel profesyoneller için',
    features_en: [
      '200 appointments / month',
      '800 WhatsApp messages / month',
      '1 Google Calendar',
      '9-language AI agent',
      'Automated reminders (24h + 2h)',
      'Email support',
    ],
    features_tr: [
      'Aylık 200 randevu',
      'Aylık 800 WhatsApp mesajı',
      '1 Google Calendar',
      '9 dilli yapay zeka ajanı',
      'Otomatik hatırlatma (24s + 2s)',
      'E-posta destek',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    priceUsd: 79,
    priceYearlyUsd: 790,
    tagline_en: 'For small teams (2–3 seats)',
    tagline_tr: 'Küçük ekipler için (2–3 kişi)',
    features_en: [
      '800 appointments / month',
      '3,000 WhatsApp messages / month',
      'Up to 3 Google Calendars',
      'No-show recovery & waitlist',
      'Campaign tools & promotions',
      'Priority support',
    ],
    features_tr: [
      'Aylık 800 randevu',
      'Aylık 3.000 WhatsApp mesajı',
      '3 adede kadar Google Calendar',
      'Gelmeyen telafisi + bekleme listesi',
      'Kampanya ve promosyon araçları',
      'Öncelikli destek',
    ],
    highlighted: true,
  },
  {
    key: 'business',
    name: 'Business',
    priceUsd: 199,
    priceYearlyUsd: 1990,
    tagline_en: 'For clinics & multi-location shops',
    tagline_tr: 'Klinik ve çok şubeli işletmeler',
    features_en: [
      '3,000 appointments / month',
      'Unlimited WhatsApp messages',
      'Unlimited Google Calendars',
      'Custom WhatsApp templates',
      'White-glove onboarding',
      'Dedicated account manager',
    ],
    features_tr: [
      'Aylık 3.000 randevu',
      'Sınırsız WhatsApp mesajı',
      'Sınırsız Google Calendar',
      'Özel WhatsApp şablonları',
      'Profesyonel kurulum desteği',
      'Size özel hesap yöneticisi',
    ],
  },
]

const AGENTS = [
  { icon: Target, key: 'growth', en: 'Growth Agent', tr: 'Büyüme Ajanı',
    d_en: 'Finds, qualifies and reaches out to local businesses that match your niche.',
    d_tr: 'Nişine uyan yerel işletmeleri bulur, filtreler ve ilk mesajı atar.' },
  { icon: UserPlus, key: 'qualification', en: 'Qualification Agent', tr: 'Yeterlilik Ajanı',
    d_en: 'Screens leads for fit, intent and payment ability before engaging.',
    d_tr: 'Gelen lead\'in uygunluğunu ve ödeme kabiliyetini önceden doğrular.' },
  { icon: Sparkles, key: 'conversion', en: 'Conversion Agent', tr: 'Dönüşüm Ajanı',
    d_en: 'Turns trials into paying customers with timed nudges and offers.',
    d_tr: 'Deneme kullanıcılarını zamanında dürtmeler ve tekliflerle müşteriye çevirir.' },
  { icon: Zap, key: 'onboarding', en: 'Onboarding Agent', tr: 'Kurulum Ajanı',
    d_en: 'Walks the merchant through WhatsApp and Google Calendar setup in two clicks.',
    d_tr: 'İki tıkla WhatsApp ve Google Calendar kurulumunu baştan sona yürütür.' },
  { icon: MessageCircle, key: 'messaging', en: 'Messaging Agent', tr: 'Mesajlaşma Ajanı',
    d_en: 'Understands and replies to inbound WhatsApp messages 24/7 in 9 languages.',
    d_tr: 'WhatsApp\'a gelen mesajları 9 dilde 7/24 anlar ve yanıtlar.' },
  { icon: Calendar, key: 'scheduling', en: 'Scheduling Agent', tr: 'Randevu Ajanı',
    d_en: 'Proposes free slots, creates, reschedules and cancels Google Calendar events.',
    d_tr: 'Boş saat önerir, Google Calendar etkinliği açar, erteler, iptal eder.' },
  { icon: Bell, key: 'reminders', en: 'Reminders Agent', tr: 'Hatırlatma Ajanı',
    d_en: 'Sends 24-hour and 2-hour reminders — then recovers no-show slots from the waitlist.',
    d_tr: '24 saat ve 2 saat önceden hatırlatır; gelmeyeni bekleme listesinden telafi eder.' },
  { icon: RefreshCcw, key: 'retention', en: 'Retention Agent', tr: 'Elde Tutma Ajanı',
    d_en: 'Spots churn risk early and offers tailored incentives before a cancel.',
    d_tr: 'Churn riskini önceden yakalar, iptalden önce kişiye özel teklif sunar.' },
  { icon: Wallet, key: 'billing', en: 'Billing Agent', tr: 'Faturalama Ajanı',
    d_en: 'Charges subscriptions, retries failed payments and issues receipts.',
    d_tr: 'Abonelikleri tahsil eder, başarısız ödemeleri tekrarlar, makbuz keser.' },
  { icon: DollarSign, key: 'pricing', en: 'Pricing Agent', tr: 'Fiyatlama Ajanı',
    d_en: 'Recomputes cost every day and keeps your gross margin above 10% automatically.',
    d_tr: 'Her gün maliyeti yeniden hesaplar, brüt marjı %10\'un üstünde tutar.' },
  { icon: ShieldCheck, key: 'compliance', en: 'Compliance Agent', tr: 'Uyum Ajanı',
    d_en: 'Handles GDPR / KVKK data requests and masks PII where required.',
    d_tr: 'GDPR/KVKK silme taleplerini işler, gerektiğinde kişisel veriyi maskeler.' },
]

export default function AppointFlowProductPage() {
  const { language } = useLanguage()
  const isEn = language === 'en'
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const faqs = [
    {
      q_en: 'Does my customer need to install an app?',
      q_tr: 'Müşterilerimin uygulama yüklemesi gerekiyor mu?',
      a_en: 'No. Your clients message you on WhatsApp exactly as they do today. AppointFlow runs silently on your WhatsApp Business number and replies on your behalf.',
      a_tr: 'Hayır. Müşterileriniz bugün olduğu gibi WhatsApp\'tan size yazar. AppointFlow, WhatsApp Business numaranıza arka planda bağlanır ve sizin adınıza cevap verir.',
    },
    {
      q_en: 'Which languages does the AI understand?',
      q_tr: 'Yapay zeka hangi dilleri anlıyor?',
      a_en: 'English, Turkish, Spanish, German, French, Portuguese, Arabic, Italian and Russian — with automatic detection per conversation.',
      a_tr: 'İngilizce, Türkçe, İspanyolca, Almanca, Fransızca, Portekizce, Arapça, İtalyanca ve Rusça — her konuşma için otomatik algılama ile.',
    },
    {
      q_en: 'What happens during the 7-day free trial?',
      q_tr: '7 günlük ücretsiz denemede ne oluyor?',
      a_en: 'Full product access, no credit card required. At the end of the trial you receive a one-click link to start your subscription. If you do nothing, your account quietly switches to read-only.',
      a_tr: 'Tüm özellikler açık, kredi kartı istemez. Denemenin sonunda tek tıkla abonelik başlatma linki gelir. Hiçbir şey yapmazsanız hesap sessizce salt-okunur moda geçer.',
    },
    {
      q_en: 'How does billing work globally?',
      q_tr: 'Faturalama dünya genelinde nasıl çalışıyor?',
      a_en: 'Payments are processed through Lemon Squeezy (a Merchant of Record), which collects and remits VAT / GST in 140+ countries on our behalf. You simply pay in your local currency via card, PayPal, SEPA, Apple Pay or Google Pay.',
      a_tr: 'Ödemeler, 140+ ülkede adımıza KDV/GST tahsil edip beyan eden Merchant of Record Lemon Squeezy üzerinden yapılır. Siz kartla, PayPal ile, SEPA, Apple Pay veya Google Pay ile yerel paranızla ödersiniz.',
    },
    {
      q_en: 'What data does AppointFlow store?',
      q_tr: 'AppointFlow hangi verileri saklıyor?',
      a_en: 'Only what is necessary to run the service: your Google Calendar availability tokens (encrypted), customer phone numbers and names, conversation history, and booking records. We are GDPR and KVKK compliant and provide full data export and deletion on request.',
      a_tr: 'Yalnızca hizmet için gerekli olanlar: Google Calendar müsaitlik token\'larınız (şifreli), müşteri telefon ve isimleri, konuşma geçmişi, randevu kayıtları. GDPR ve KVKK uyumluyuz, talep halinde tam veri dışa aktarma ve silme yaparız.',
    },
    {
      q_en: 'Can I cancel any time?',
      q_tr: 'İstediğim zaman iptal edebilir miyim?',
      a_en: 'Yes. Cancel from the self-service customer portal with one click. Your subscription remains active until the end of the current billing period.',
      a_tr: 'Evet. Self-servis müşteri portalından tek tıkla iptal edebilirsiniz. Aboneliğiniz içinde bulunduğunuz dönemin sonuna kadar aktif kalır.',
    },
    {
      q_en: 'What if my WhatsApp number is already registered somewhere?',
      q_tr: 'WhatsApp numaram başka bir yere kayıtlıysa ne olur?',
      a_en: 'During onboarding we migrate your number to the WhatsApp Cloud API environment in under 10 minutes, without breaking your existing conversations.',
      a_tr: 'Kurulum sırasında numaranızı 10 dakikadan kısa sürede WhatsApp Cloud API ortamına taşırız; mevcut konuşmalarınız bozulmaz.',
    },
    {
      q_en: 'Do you offer refunds?',
      q_tr: 'İade politikanız nedir?',
      a_en: 'If you are charged in error within the first 72 hours, we issue a full refund on request. After that, partial-month refunds are not provided, except where required by applicable consumer-protection law.',
      a_tr: 'İlk 72 saat içinde hatalı bir tahsilat olursa talep üzerine tam iade yaparız. Sonrasında tüketici hakları mevzuatının gerektirdiği durumlar dışında kısmi ay iadesi yapılmaz.',
    },
  ]

  return (
    <MarketingLayout>
      {/* ============ HERO ============ */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 bg-gradient-to-b from-[#F6F9FC] via-white to-white">
        <div className="container-marketing">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <Badge className="mb-5 bg-[#00D4AA] text-white px-3 py-1 text-xs font-semibold tracking-wide">
                {isEn ? 'NEW MODULE — MODULUS APPOINTFLOW' : 'YENİ MODÜL — MODULUS APPOINTFLOW'}
              </Badge>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
                style={{ color: '#0A2540', fontFamily: 'Montserrat, sans-serif' }}
              >
                {isEn
                  ? 'Your autonomous appointment agent — on WhatsApp, 24/7.'
                  : 'Otonom randevu ajanınız — WhatsApp\'ta, 7/24.'}
              </h1>
              <p className="text-lg lg:text-xl mb-8 leading-relaxed" style={{ color: '#425466' }}>
                {isEn
                  ? 'AppointFlow books, reminds, cancels and upsells your client appointments automatically — on WhatsApp, synced with Google Calendar. No receptionist, no missed bookings, no after-hours silence. Sold as a monthly subscription from $29.'
                  : 'AppointFlow; müşterilerinizin randevularını WhatsApp üzerinden, Google Calendar ile eşzamanlı olarak otomatik alır, hatırlatır, iptal eder ve tekrar getirir. Resepsiyonist gerekmez, kaçan randevu olmaz, mesai sonrası sessizlik biter. Aylık $29\'dan başlayan aboneliktir.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/products/appointflow#pricing">
                  <Button
                    size="lg"
                    className="rounded-full text-base font-semibold px-7 py-6 text-white shadow-lg hover:shadow-xl transition-all"
                    style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0D3158 100%)' }}
                  >
                    {isEn ? 'Start 7-Day Free Trial' : '7 Gün Ücretsiz Başla'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full text-base font-semibold px-7 py-6 border-2"
                    style={{ borderColor: '#00D4AA', color: '#0A2540' }}
                  >
                    {isEn ? 'Book a Demo' : 'Demo Planla'}
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-4 text-sm" style={{ color: '#425466' }}>
                {[
                  isEn ? 'No credit card required' : 'Kredi kartı gerekmez',
                  isEn ? '9 languages' : '9 dil',
                  isEn ? 'Cancel anytime' : 'Her an iptal',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4" style={{ color: '#00D4AA' }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo card — fake WhatsApp chat */}
            <div className="relative">
              <div
                className="rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
                style={{ background: 'linear-gradient(135deg, #E9F5EF 0%, #F6F9FC 100%)' }}
              >
                <div className="flex items-center gap-3 px-5 py-4 bg-[#075E54]">
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">Dr. Schmidt Dental Clinic</div>
                    <div className="text-white/70 text-xs">{isEn ? 'online · replies instantly' : 'çevrimiçi · anında yanıtlar'}</div>
                  </div>
                </div>
                <div className="p-5 space-y-3 bg-[#ECE5DD] min-h-[380px]">
                  <ChatBubble direction="in">
                    {isEn ? 'Hi, I\'d like to book a cleaning for next week' : 'Merhaba, gelecek hafta için diş temizliği randevusu alabilir miyim?'}
                  </ChatBubble>
                  <ChatBubble direction="out">
                    {isEn
                      ? 'Of course! 😊 I have these free slots: Tuesday 10:00, 11:30, or Wednesday 15:00. Which works best?'
                      : 'Elbette! 😊 Şu saatlerim boş: Salı 10:00, 11:30 veya Çarşamba 15:00. Hangisi size uygun?'}
                  </ChatBubble>
                  <ChatBubble direction="in">
                    {isEn ? 'Tuesday 11:30 please' : 'Salı 11:30 olsun'}
                  </ChatBubble>
                  <ChatBubble direction="out">
                    {isEn
                      ? 'Booked ✅ Tuesday, April 21 at 11:30. I\'ll remind you 24h before. See you then!'
                      : 'Alındı ✅ Salı, 21 Nisan 11:30. 24 saat önce hatırlatacağım. Görüşmek üzere!'}
                  </ChatBubble>
                  <div className="pt-2 text-center">
                    <span className="text-xs text-gray-500">
                      {isEn ? '↑ A real autonomous conversation' : '↑ Gerçek bir otonom konuşma'}
                    </span>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 hidden sm:block">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#00D4AA]" />
                  <div className="text-xs">
                    <div className="font-semibold text-[#0A2540]">
                      {isEn ? 'Google Calendar' : 'Google Calendar'}
                    </div>
                    <div className="text-gray-500">{isEn ? 'synced' : 'eşitlendi'}</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 hidden sm:block">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#00D4AA]" />
                  <div className="text-xs">
                    <div className="font-semibold text-[#0A2540]">
                      {isEn ? '2h reminder' : '2 saat kala hatırlatma'}
                    </div>
                    <div className="text-gray-500">{isEn ? 'scheduled' : 'planlandı'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROBLEM ============ */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container-marketing">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ color: '#0A2540', fontFamily: 'Montserrat, sans-serif' }}>
              {isEn ? 'The problem with running a service business' : 'Hizmet işletmesi yönetmenin gerçeği'}
            </h2>
            <p className="text-lg" style={{ color: '#425466' }}>
              {isEn
                ? 'If you depend on appointments, here is what is quietly costing you real money every single week.'
                : 'Randevu ile çalışıyorsanız, her hafta sessizce paranızı emen gerçekler şunlar.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: AlertTriangle,
                stat: '25%',
                en_t: 'No-show rate without reminders',
                tr_t: 'Hatırlatma yoksa gelmeyen oranı',
                en_d: 'A quarter of your bookings vanish because nobody reminded them on time.',
                tr_d: 'Randevuların dörtte biri zamanında hatırlatılmadığı için buhar olur.',
              },
              {
                icon: Clock,
                stat: '4h',
                en_t: 'Avg. WhatsApp response delay',
                tr_t: 'Ortalama WhatsApp yanıt gecikmesi',
                en_d: 'By the time you reply, the client already booked someone else.',
                tr_d: 'Siz cevap verene kadar müşteri başka bir işletmeye randevu almış olur.',
              },
              {
                icon: DollarSign,
                stat: '$1,500+',
                en_t: 'Monthly cost of a receptionist',
                tr_t: 'Resepsiyonistin aylık maliyeti',
                en_d: 'Too expensive for solo practitioners. Too slow for rush hours.',
                tr_d: 'Bireysel işletmeler için çok pahalı, yoğun saatlerde çok yavaş.',
              },
            ].map((p, i) => {
              const Icon = p.icon
              return (
                <Card key={i} className="p-7 border border-gray-200 hover:shadow-xl transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="text-4xl font-bold mb-2" style={{ color: '#0A2540' }}>{p.stat}</div>
                  <div className="text-base font-semibold mb-2" style={{ color: '#0A2540' }}>
                    {isEn ? p.en_t : p.tr_t}
                  </div>
                  <p className="text-sm" style={{ color: '#425466' }}>
                    {isEn ? p.en_d : p.tr_d}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-[#F6F9FC] to-white">
        <div className="container-marketing">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <Badge className="mb-4 bg-[#0A2540] text-white px-4 py-1.5">
              {isEn ? 'How it works' : 'Nasıl çalışır?'}
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ color: '#0A2540', fontFamily: 'Montserrat, sans-serif' }}>
              {isEn ? 'Live in 5 minutes. No app to install.' : '5 dakikada canlı. Uygulama kurmaya gerek yok.'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: '1',
                icon: MessageSquare,
                en_t: 'Connect WhatsApp',
                tr_t: 'WhatsApp\'ı bağla',
                en_d: 'We link your existing WhatsApp Business number to the Cloud API in under 10 minutes.',
                tr_d: 'Mevcut WhatsApp Business numaranızı 10 dakikadan kısa sürede Cloud API\'ye bağlarız.',
              },
              {
                step: '2',
                icon: Calendar,
                en_t: 'Connect Google Calendar',
                tr_t: 'Google Calendar\'ı bağla',
                en_d: 'One OAuth click and the agent sees your free slots — read and write, two-way sync.',
                tr_d: 'Tek OAuth tıkıyla ajan boş saatlerinizi görür; çift yönlü okuma/yazma senkronu.',
              },
              {
                step: '3',
                icon: Sparkles,
                en_t: 'Go to sleep',
                tr_t: 'Uyumaya git',
                en_d: 'From now on the agent takes inbound messages, books, reminds, and handles cancellations. You just show up.',
                tr_d: 'Bundan sonra ajan mesajları alır, randevu oluşturur, hatırlatır, iptali yönetir. Siz sadece randevuya gelirsiniz.',
              },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="relative">
                  <Card className="p-7 border border-gray-200 h-full bg-white">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-extrabold"
                           style={{ background: 'linear-gradient(135deg, #0A2540 0%, #00D4AA 100%)', color: 'white' }}>
                        {s.step}
                      </div>
                      <Icon className="h-8 w-8 text-[#00D4AA]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#0A2540' }}>
                      {isEn ? s.en_t : s.tr_t}
                    </h3>
                    <p className="text-base leading-relaxed" style={{ color: '#425466' }}>
                      {isEn ? s.en_d : s.tr_d}
                    </p>
                  </Card>
                  {i < 2 && (
                    <ArrowRight className="hidden md:block absolute top-1/2 -right-4 h-8 w-8 text-[#00D4AA] z-10" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ 11 AGENTS ============ */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container-marketing">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <Badge className="mb-4 bg-blue-600 text-white px-4 py-1.5">
              {isEn ? 'The autonomous stack' : 'Otonom yığın'}
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ color: '#0A2540', fontFamily: 'Montserrat, sans-serif' }}>
              {isEn ? '11 AI agents, one business on autopilot' : '11 AI ajanı, otomatik pilotta bir işletme'}
            </h2>
            <p className="text-lg" style={{ color: '#425466' }}>
              {isEn
                ? 'Every operational concern — from finding customers to collecting payments — is handled by a dedicated autonomous agent. You focus on the craft.'
                : 'Müşteri bulmaktan tahsilata kadar her operasyonel kaygı, kendi otonom ajanına devredilmiştir. Siz sadece işinize odaklanırsınız.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {AGENTS.map((a) => {
              const Icon = a.icon
              return (
                <Card key={a.key} className="p-5 border border-gray-200 hover:border-[#00D4AA] hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-[#00D4AA]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold mb-1" style={{ color: '#0A2540' }}>
                        {isEn ? a.en : a.tr}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#425466' }}>
                        {isEn ? a.d_en : a.d_tr}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ HIGHLIGHTS ============ */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-[#F6F9FC]">
        <div className="container-marketing">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Globe, stat: '9', en_t: 'Languages', tr_t: 'Dil' },
              { icon: Clock, stat: '24/7', en_t: 'Always on', tr_t: 'Kesintisiz' },
              { icon: TrendingUp, stat: '≥90%', en_t: 'Booking accuracy', tr_t: 'Doğru randevu' },
              { icon: Shield, stat: 'GDPR', en_t: '& KVKK compliant', tr_t: 've KVKK uyumlu' },
            ].map((h, i) => {
              const Icon = h.icon
              return (
                <Card key={i} className="p-6 text-center border border-gray-200">
                  <Icon className="h-7 w-7 mx-auto mb-3 text-[#00D4AA]" />
                  <div className="text-3xl font-extrabold mb-1" style={{ color: '#0A2540' }}>{h.stat}</div>
                  <div className="text-sm font-medium" style={{ color: '#425466' }}>
                    {isEn ? h.en_t : h.tr_t}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="py-20 lg:py-28 bg-white scroll-mt-24">
        <div className="container-marketing">
          <div className="text-center mb-10 max-w-3xl mx-auto">
            <Badge className="mb-4 bg-[#00D4AA] text-white px-4 py-1.5">
              {isEn ? 'Pricing' : 'Fiyatlandırma'}
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ color: '#0A2540', fontFamily: 'Montserrat, sans-serif' }}>
              {isEn ? 'Simple, transparent pricing' : 'Sade ve şeffaf fiyatlandırma'}
            </h2>
            <p className="text-lg mb-8" style={{ color: '#425466' }}>
              {isEn ? '7-day free trial on every plan. Cancel any time.' : 'Tüm planlarda 7 gün ücretsiz deneme. Her an iptal.'}
            </p>

            <div className="inline-flex items-center gap-2 bg-gray-100 p-1 rounded-full">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === 'monthly' ? 'bg-white shadow text-[#0A2540]' : 'text-gray-500'
                }`}
              >
                {isEn ? 'Monthly' : 'Aylık'}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly' ? 'bg-white shadow text-[#0A2540]' : 'text-gray-500'
                }`}
              >
                {isEn ? 'Yearly' : 'Yıllık'}
                <span className="bg-[#00D4AA] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  -17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {TIERS.map((tier) => {
              const price = billingCycle === 'monthly' ? tier.priceUsd : tier.priceYearlyUsd / 12
              const features = isEn ? tier.features_en : tier.features_tr
              return (
                <Card
                  key={tier.key}
                  className={`p-7 border-2 flex flex-col ${
                    tier.highlighted
                      ? 'border-[#00D4AA] shadow-2xl scale-[1.02] bg-white relative'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {tier.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00D4AA] text-white px-3 py-1 text-xs font-semibold">
                      {isEn ? 'MOST POPULAR' : 'EN POPÜLER'}
                    </Badge>
                  )}
                  <div className="mb-5">
                    <div className="text-xl font-bold mb-1" style={{ color: '#0A2540', fontFamily: 'Montserrat, sans-serif' }}>
                      {tier.name}
                    </div>
                    <div className="text-sm" style={{ color: '#425466' }}>
                      {isEn ? tier.tagline_en : tier.tagline_tr}
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-extrabold" style={{ color: '#0A2540' }}>
                        ${Math.round(price)}
                      </span>
                      <span className="text-base" style={{ color: '#425466' }}>
                        /{isEn ? 'month' : 'ay'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="text-xs mt-1" style={{ color: '#00D4AA' }}>
                        {isEn
                          ? `Billed yearly ($${tier.priceYearlyUsd})`
                          : `Yıllık faturalanır ($${tier.priceYearlyUsd})`}
                      </div>
                    )}
                  </div>
                  <ul className="space-y-2 mb-7 flex-1">
                    {features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: '#425466' }}>
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#00D4AA' }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/contact?plan=${tier.key}&cycle=${billingCycle}`}>
                    <Button
                      size="lg"
                      className={`w-full rounded-full font-semibold ${
                        tier.highlighted ? 'text-white' : ''
                      }`}
                      style={
                        tier.highlighted
                          ? { background: 'linear-gradient(135deg, #0A2540 0%, #0D3158 100%)', color: 'white' }
                          : { backgroundColor: 'white', color: '#0A2540', border: '2px solid #0A2540' }
                      }
                    >
                      {isEn ? 'Start Free Trial' : 'Ücretsiz Dene'}
                    </Button>
                  </Link>
                </Card>
              )
            })}
          </div>

          <p className="text-center mt-8 text-sm" style={{ color: '#64748b' }}>
            {isEn
              ? 'Prices in USD. Local currency conversion and all taxes are handled automatically at checkout.'
              : 'Fiyatlar USD cinsindendir. Yerel para birimine çevirim ve tüm vergiler ödeme aşamasında otomatik işlenir.'}
          </p>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="py-20 lg:py-28 bg-[#F6F9FC]">
        <div className="container-marketing">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <Badge className="mb-4 bg-blue-600 text-white px-4 py-1.5">FAQ</Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ color: '#0A2540', fontFamily: 'Montserrat, sans-serif' }}>
              {isEn ? 'Frequently asked questions' : 'Sık sorulan sorular'}
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <Card
                  key={i}
                  className={`overflow-hidden transition-all ${isOpen ? 'shadow-lg border-[#00D4AA]/40' : 'border-gray-200'}`}
                >
                  <button
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    <span className="font-semibold text-base" style={{ color: '#0A2540' }}>
                      {isEn ? faq.q_en : faq.q_tr}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      style={{ color: '#00D4AA' }}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: '#425466' }}>
                      {isEn ? faq.a_en : faq.a_tr}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container-marketing">
          <Card
            className="max-w-5xl mx-auto p-10 lg:p-16 text-center border-0 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0D3158 100%)' }}
          >
            <Users className="h-12 w-12 mx-auto mb-6 text-[#00D4AA]" />
            <h2 className="text-3xl lg:text-5xl font-bold mb-5 text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {isEn
                ? 'Stop missing bookings. Start sleeping at night.'
                : 'Randevu kaçırmayı bırakın. Geceleri uyumaya başlayın.'}
            </h2>
            <p className="text-lg mb-8 text-white/80 max-w-2xl mx-auto">
              {isEn
                ? 'Your autonomous agent sets up in 5 minutes, works 24/7 and costs less than a single missed appointment per week.'
                : 'Otonom ajanınız 5 dakikada kurulur, 7/24 çalışır ve haftada tek bir kaçan randevudan daha ucuza mal olur.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/products/appointflow#pricing">
                <Button
                  size="lg"
                  className="rounded-full text-base font-bold px-8 py-6 bg-[#00D4AA] hover:bg-[#00C099] text-[#0A2540] shadow-xl"
                >
                  {isEn ? 'Start 7-Day Free Trial' : '7 Gün Ücretsiz Başla'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full text-base font-bold px-8 py-6 border-2 border-white text-white hover:bg-white/10"
                >
                  {isEn ? 'Talk to Sales' : 'Satış ile Görüş'}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </MarketingLayout>
  )
}

function ChatBubble({ direction, children }: { direction: 'in' | 'out'; children: React.ReactNode }) {
  const isOut = direction === 'out'
  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
          isOut ? 'bg-[#DCF8C6] text-[#0A2540] rounded-br-sm' : 'bg-white text-[#0A2540] rounded-bl-sm'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
