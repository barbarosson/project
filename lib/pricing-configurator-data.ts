/**
 * Master Pricing Configurator — Veri Katmanı
 *
 * Tüm modül tanımları, fiyatlar, AI toggle'lar, bağımlılıklar ve
 * ölçeklenebilir birimler tek dosyada.
 *
 * Fiyat değişikliği için yalnızca bu dosyayı güncelle.
 */

// ─── Ortak Tipler ─────────────────────────────────────────────

export type ModuleCategory =
  | 'core'
  | 'operational'
  | 'production'
  | 'sales_marketing'
  | 'ai'
  | 'ecommerce'
  | 'edocument'
  | 'support'

export interface PricingModule {
  id: string
  category: ModuleCategory
  labelTr: string
  labelEn: string
  descriptionTr: string
  descriptionEn: string
  monthlyPriceTRY: number
  monthlyPriceUSD: number
  /** Bu modüle ait AI bot etkinleştirilebilir mi */
  hasAiBot: boolean
  /** AI bot aylık ek ücreti */
  aiBotPriceTRY: number
  aiBotPriceUSD: number
  /** true ise temel pakete dahil, kaldırılamaz */
  includedInBase: boolean
  /** Bağımlı olduğu modül id'leri (seçilince bunlar önerilir) */
  recommends?: string[]
  /** Bu modül seçilmeden aktif olamaz */
  requires?: string[]
  /** Özel badge metni */
  badgeTr?: string
  badgeEn?: string
}

export interface ScalableUnit {
  id: string
  labelTr: string
  labelEn: string
  descriptionTr: string
  descriptionEn: string
  /** Temel pakete dahil miktar */
  includedQty: number
  /** Ek birim fiyatı */
  unitPriceTRY: number
  unitPriceUSD: number
  min: number
  max: number
  step: number
}

export interface MarketplaceBundle {
  id: string
  labelTr: string
  labelEn: string
  descriptionTr: string
  descriptionEn: string
  channelsTr: string[]
  channelsEn: string[]
  monthlyPriceTRY: number
  monthlyPriceUSD: number
}

export interface MarketplaceExtraChannel {
  id: string
  labelTr: string
  labelEn: string
  monthlyPriceTRY: number
  monthlyPriceUSD: number
}

export interface EInvoiceCreditPack {
  id: string
  qty: number
  priceTRY: number
  priceUSD: number
  /** İndirim yüzdesi (büyük paket avantajı) */
  discountPct: number
}

export interface CategoryMeta {
  id: ModuleCategory
  labelTr: string
  labelEn: string
  iconName: string
}

// ─── Kategori Sıralaması ──────────────────────────────────────

export const MODULE_CATEGORIES: CategoryMeta[] = [
  { id: 'core', labelTr: 'Temel Özellikler', labelEn: 'Core Features', iconName: 'LayoutDashboard' },
  { id: 'operational', labelTr: 'Operasyonel', labelEn: 'Operational', iconName: 'Settings2' },
  { id: 'production', labelTr: 'Üretim ve İmalat', labelEn: 'Production & Manufacturing', iconName: 'Factory' },
  { id: 'sales_marketing', labelTr: 'Satış ve Pazarlama', labelEn: 'Sales & Marketing', iconName: 'TrendingUp' },
  { id: 'ai', labelTr: 'Yapay Zeka', labelEn: 'AI Intelligence', iconName: 'Brain' },
  { id: 'ecommerce', labelTr: 'E-Ticaret', labelEn: 'E-Commerce', iconName: 'ShoppingCart' },
  { id: 'edocument', labelTr: 'E-Belge', labelEn: 'E-Document', iconName: 'FileCheck' },
  { id: 'support', labelTr: 'Destek', labelEn: 'Support', iconName: 'Headphones' },
]

// ─── Modüller ─────────────────────────────────────────────────

export const PRICING_MODULES: PricingModule[] = [
  // ── Core (temel pakete dahil) ───
  {
    id: 'dashboard',
    category: 'core',
    labelTr: 'Kontrol Paneli',
    labelEn: 'Dashboard',
    descriptionTr: 'İş analitiği, KPI takibi ve özet raporlar',
    descriptionEn: 'Business analytics, KPI tracking, and summary reports',
    monthlyPriceTRY: 0,
    monthlyPriceUSD: 0,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: true,
  },
  {
    id: 'contacts',
    category: 'core',
    labelTr: 'Cariler',
    labelEn: 'Contacts (CRM)',
    descriptionTr: 'Müşteri ve tedarikçi yönetimi, sınırsız kayıt',
    descriptionEn: 'Customer & supplier management, unlimited records',
    monthlyPriceTRY: 0,
    monthlyPriceUSD: 0,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: true,
  },
  {
    id: 'sales_invoices',
    category: 'core',
    labelTr: 'Satış Faturaları',
    labelEn: 'Sales Invoices',
    descriptionTr: 'Fatura oluşturma, takip, sınırsız satış faturası',
    descriptionEn: 'Invoice creation, tracking, unlimited sales invoices',
    monthlyPriceTRY: 0,
    monthlyPriceUSD: 0,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: true,
  },
  {
    id: 'purchase_invoices',
    category: 'core',
    labelTr: 'Alış Faturaları / Gider',
    labelEn: 'Purchase / Expense',
    descriptionTr: 'Alım faturaları ve gider takibi',
    descriptionEn: 'Purchase invoices and expense tracking',
    monthlyPriceTRY: 0,
    monthlyPriceUSD: 0,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: true,
  },
  {
    id: 'cash_management',
    category: 'core',
    labelTr: 'Nakit Yönetimi',
    labelEn: 'Cash Management',
    descriptionTr: 'Kasa, banka hesapları ve nakit akış takibi',
    descriptionEn: 'Cash, bank accounts and cash flow tracking',
    monthlyPriceTRY: 0,
    monthlyPriceUSD: 0,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: true,
  },
  {
    id: 'hr_basic',
    category: 'core',
    labelTr: 'İnsan Kaynakları (Temel)',
    labelEn: 'HR (Basic)',
    descriptionTr: 'Çalışan kayıtları, izin ve maaş takibi',
    descriptionEn: 'Employee records, leave and payroll tracking',
    monthlyPriceTRY: 0,
    monthlyPriceUSD: 0,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: true,
  },

  // ── Operational (a-la-carte) ───
  {
    id: 'orders',
    category: 'operational',
    labelTr: 'Siparişler',
    labelEn: 'Orders',
    descriptionTr: 'Satış ve alış sipariş yönetimi',
    descriptionEn: 'Sales and purchase order management',
    monthlyPriceTRY: 149,
    monthlyPriceUSD: 9,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: false,
  },
  {
    id: 'procurement',
    category: 'operational',
    labelTr: 'Satınalma İşlemleri',
    labelEn: 'Purchasing',
    descriptionTr: 'Tedarikçi teklif toplama, karşılaştırma ve onay akışları',
    descriptionEn: 'Supplier RFQ, comparison and approval workflows',
    monthlyPriceTRY: 149,
    monthlyPriceUSD: 9,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: false,
  },
  {
    id: 'products_services',
    category: 'operational',
    labelTr: 'Ürün ve Hizmetler',
    labelEn: 'Products & Services',
    descriptionTr: 'Ürün kataloğu, barkod, varyant ve fiyat listeleri',
    descriptionEn: 'Product catalog, barcode, variants and price lists',
    monthlyPriceTRY: 99,
    monthlyPriceUSD: 6,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: false,
  },
  {
    id: 'warehouse',
    category: 'operational',
    labelTr: 'Depo ve Stok Yönetimi',
    labelEn: 'Warehouse & Inventory',
    descriptionTr: 'Çoklu depo, stok hareketleri, sayım ve transfer',
    descriptionEn: 'Multi-warehouse, stock movements, counting and transfer',
    monthlyPriceTRY: 199,
    monthlyPriceUSD: 12,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: false,
    recommends: ['products_services'],
  },
  {
    id: 'branches',
    category: 'operational',
    labelTr: 'Şube Yönetimi',
    labelEn: 'Branch Management',
    descriptionTr: 'Çoklu şube, lokasyon ve şubeler arası transfer',
    descriptionEn: 'Multi-branch, locations and inter-branch transfers',
    monthlyPriceTRY: 199,
    monthlyPriceUSD: 12,
    hasAiBot: false,
    aiBotPriceTRY: 0,
    aiBotPriceUSD: 0,
    includedInBase: false,
  },

  // ── Production & Manufacturing ───
  {
    id: 'manufacturing',
    category: 'production',
    labelTr: 'Üretim',
    labelEn: 'Manufacturing',
    descriptionTr: 'İş emirleri, reçeteler, üretim planlaması',
    descriptionEn: 'Work orders, bill of materials, production planning',
    monthlyPriceTRY: 299,
    monthlyPriceUSD: 18,
    hasAiBot: true,
    aiBotPriceTRY: 79,
    aiBotPriceUSD: 5,
    includedInBase: false,
    recommends: ['costing', 'warehouse'],
  },
  {
    id: 'costing',
    category: 'production',
    labelTr: 'Maliyet',
    labelEn: 'Costing',
    descriptionTr: 'Ürün maliyetlendirme, ABC analizi, kar marjı',
    descriptionEn: 'Product costing, ABC analysis, profit margins',
    monthlyPriceTRY: 199,
    monthlyPriceUSD: 12,
    hasAiBot: true,
    aiBotPriceTRY: 79,
    aiBotPriceUSD: 5,
    includedInBase: false,
  },
  {
    id: 'quality',
    category: 'production',
    labelTr: 'Kalite',
    labelEn: 'Quality',
    descriptionTr: 'Kalite kontrol, uygunsuzluk, CAPA ve denetim',
    descriptionEn: 'Quality control, non-conformance, CAPA and audits',
    monthlyPriceTRY: 149,
    monthlyPriceUSD: 9,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: false,
  },

  // ── Sales & Marketing ───
  {
    id: 'quotes',
    category: 'sales_marketing',
    labelTr: 'Teklifler',
    labelEn: 'Quotes',
    descriptionTr: 'Teklif oluşturma, onay akışı ve dönüşüm takibi',
    descriptionEn: 'Quote creation, approval workflow and conversion tracking',
    monthlyPriceTRY: 99,
    monthlyPriceUSD: 6,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: false,
  },
  {
    id: 'campaigns',
    category: 'sales_marketing',
    labelTr: 'Kampanyalar',
    labelEn: 'Campaigns',
    descriptionTr: 'Promosyon, indirim ve kampanya yönetimi',
    descriptionEn: 'Promotions, discounts and campaign management',
    monthlyPriceTRY: 99,
    monthlyPriceUSD: 6,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: false,
  },
  {
    id: 'projects',
    category: 'sales_marketing',
    labelTr: 'Proje Yönetimi',
    labelEn: 'Project Management',
    descriptionTr: 'Proje takibi, zaman çizelgesi ve bütçe kontrolü',
    descriptionEn: 'Project tracking, timelines and budget control',
    monthlyPriceTRY: 149,
    monthlyPriceUSD: 9,
    hasAiBot: true,
    aiBotPriceTRY: 49,
    aiBotPriceUSD: 3,
    includedInBase: false,
  },
  {
    id: 'live_support',
    category: 'support',
    labelTr: 'Canlı Destek Modülü',
    labelEn: 'Live Support Module',
    descriptionTr: 'Müşterilerinize canlı chat ile destek verin',
    descriptionEn: 'Provide live chat support to your customers',
    monthlyPriceTRY: 99,
    monthlyPriceUSD: 6,
    hasAiBot: false,
    aiBotPriceTRY: 0,
    aiBotPriceUSD: 0,
    includedInBase: false,
  },

  // ── AI (standalone) ───
  {
    id: 'ai_global_chatbot',
    category: 'ai',
    labelTr: 'AI Genel Chatbot',
    labelEn: 'AI Global Chatbot',
    descriptionTr: 'Son kullanıcı desteği için genel amaçlı AI asistan',
    descriptionEn: 'General purpose AI assistant for end-user support',
    monthlyPriceTRY: 199,
    monthlyPriceUSD: 12,
    hasAiBot: false,
    aiBotPriceTRY: 0,
    aiBotPriceUSD: 0,
    includedInBase: false,
  },
]

// ─── Ölçeklenebilir Birimler ──────────────────────────────────

export const SCALABLE_UNITS: ScalableUnit[] = [
  {
    id: 'extra_users',
    labelTr: 'Ek Kullanıcı',
    labelEn: 'Extra Users',
    descriptionTr: 'Temel pakete 1 kullanıcı dahildir',
    descriptionEn: '1 user included in base package',
    includedQty: 1,
    unitPriceTRY: 49,
    unitPriceUSD: 3,
    min: 1,
    max: 100,
    step: 1,
  },
]

// ─── Marketplace ──────────────────────────────────────────────

export const MARKETPLACE_BUNDLE: MarketplaceBundle = {
  id: 'big3_bundle',
  labelTr: 'Büyük 3 Paketi',
  labelEn: 'The Big 3 Bundle',
  descriptionTr: 'Türkiye\'nin en büyük 3 pazaryeri tek pakette',
  descriptionEn: 'Turkey\'s top 3 marketplaces in one bundle',
  channelsTr: ['Amazon', 'Hepsiburada', 'Trendyol'],
  channelsEn: ['Amazon', 'Hepsiburada', 'Trendyol'],
  monthlyPriceTRY: 399,
  monthlyPriceUSD: 24,
}

export const MARKETPLACE_EXTRA_CHANNELS: MarketplaceExtraChannel[] = [
  { id: 'n11', labelTr: 'n11', labelEn: 'n11', monthlyPriceTRY: 99, monthlyPriceUSD: 6 },
  { id: 'etsy', labelTr: 'Etsy', labelEn: 'Etsy', monthlyPriceTRY: 99, monthlyPriceUSD: 6 },
  { id: 'ciceksepeti', labelTr: 'Çiçeksepeti', labelEn: 'Ciceksepeti', monthlyPriceTRY: 99, monthlyPriceUSD: 6 },
  { id: 'epttavm', labelTr: 'ePttAVM', labelEn: 'ePttAVM', monthlyPriceTRY: 99, monthlyPriceUSD: 6 },
  { id: 'gittigidiyor', labelTr: 'GittiGidiyor', labelEn: 'GittiGidiyor', monthlyPriceTRY: 99, monthlyPriceUSD: 6 },
]

// ─── E-Fatura Kredi Paketleri ─────────────────────────────────

export const EINVOICE_CREDIT_PACKS: EInvoiceCreditPack[] = [
  { id: 'credit_100', qty: 100, priceTRY: 99, priceUSD: 6, discountPct: 0 },
  { id: 'credit_500', qty: 500, priceTRY: 399, priceUSD: 24, discountPct: 20 },
  { id: 'credit_1000', qty: 1000, priceTRY: 699, priceUSD: 42, discountPct: 30 },
]

// ─── Yıllık İndirim ──────────────────────────────────────────

export const YEARLY_DISCOUNT_MONTHS = 2
export const YEARLY_DISCOUNT_LABEL_TR = '2 Ay Hediye'
export const YEARLY_DISCOUNT_LABEL_EN = '2 Months Free'

// ─── Yardımcılar ─────────────────────────────────────────────

export function getModulesByCategory(category: ModuleCategory): PricingModule[] {
  return PRICING_MODULES.filter((m) => m.category === category)
}

export function getBaseModules(): PricingModule[] {
  return PRICING_MODULES.filter((m) => m.includedInBase)
}

export function getAlaCarteModules(): PricingModule[] {
  return PRICING_MODULES.filter((m) => !m.includedInBase)
}

export function getModuleById(id: string): PricingModule | undefined {
  return PRICING_MODULES.find((m) => m.id === id)
}
