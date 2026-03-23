/**
 * Ana ekran fiyatlandırma kartlarında gösterilen "Uygulama özellikleri" listesi ve
 * paket bazlı tik matrisi. Tikleri değiştirmek için yalnızca PLAN_FEATURE_MATRIX
 * tablosunu güncellemeniz yeterli.
 */

export type PlanTierCode = 'FREE' | 'KUCUK' | 'ORTA' | 'BUYUK' | 'ENTERPRISE'

export type FeatureKey =
  | 'dashboard'
  | 'contacts'
  | 'sales_invoices'
  | 'purchase_invoices'
  | 'orders'
  | 'procurement'
  | 'products_services'
  | 'hr'
  | 'warehouse'
  | 'branches'
  | 'projects'
  | 'manufacturing'
  | 'costing'
  | 'quality'
  | 'quotes'
  | 'campaigns'
  | 'marketplace'
  | 'ai_module_bots'
  | 'edoc_efatura'
  | 'edoc_earsiv'
  | 'edoc_eirsaliye'
  | 'edoc_esmm'
  | 'support_email'
  | 'support_live_chat'
  | 'support_app_chatbot'

export type FeatureRow = {
  key: FeatureKey
  labelTr: string
  labelEn: string
  /** Küçük girinti (e-belge alt maddeleri) */
  indent?: boolean
}

export type FeatureGroup = {
  id: string
  titleTr: string
  titleEn: string
  rows: FeatureRow[]
}

export const PRICING_FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: 'modules',
    titleTr: 'Uygulama modülleri',
    titleEn: 'Application modules',
    rows: [
      { key: 'dashboard', labelTr: 'Kontrol paneli', labelEn: 'Dashboard' },
      { key: 'contacts', labelTr: 'Cariler', labelEn: 'Contacts' },
      { key: 'sales_invoices', labelTr: 'Satış faturaları', labelEn: 'Sales invoices' },
      { key: 'purchase_invoices', labelTr: 'Alış faturaları', labelEn: 'Purchase invoices' },
      { key: 'orders', labelTr: 'Siparişler', labelEn: 'Orders' },
      { key: 'procurement', labelTr: 'Satınalma işlemleri', labelEn: 'Procurement' },
      { key: 'products_services', labelTr: 'Ürün ve hizmetler', labelEn: 'Products & services' },
      { key: 'hr', labelTr: 'İnsan kaynakları', labelEn: 'Human resources' },
      { key: 'warehouse', labelTr: 'Depo ve stok yönetimi', labelEn: 'Warehouse & inventory' },
      { key: 'branches', labelTr: 'Şube yönetimi', labelEn: 'Branch management' },
      { key: 'projects', labelTr: 'Proje yönetimi', labelEn: 'Project management' },
      { key: 'manufacturing', labelTr: 'Üretim', labelEn: 'Manufacturing' },
      { key: 'costing', labelTr: 'Maliyet', labelEn: 'Costing' },
      { key: 'quality', labelTr: 'Kalite', labelEn: 'Quality' },
      { key: 'quotes', labelTr: 'Teklifler', labelEn: 'Quotes' },
      { key: 'campaigns', labelTr: 'Kampanyalar', labelEn: 'Campaigns' },
      { key: 'marketplace', labelTr: 'Pazaryeri entegrasyonları', labelEn: 'Marketplace integrations' },
    ],
  },
  {
    id: 'ai',
    titleTr: 'Yapay zeka',
    titleEn: 'Artificial intelligence',
    rows: [
      {
        key: 'ai_module_bots',
        labelTr: 'Tüm modüllere ait AI botları',
        labelEn: 'AI bots for all modules',
      },
    ],
  },
  {
    id: 'edoc',
    titleTr: 'E-belge entegrasyonları',
    titleEn: 'E-document integrations',
    rows: [
      { key: 'edoc_efatura', labelTr: 'e-Fatura', labelEn: 'e-Invoice', indent: true },
      { key: 'edoc_earsiv', labelTr: 'e-Arşiv', labelEn: 'e-Archive', indent: true },
      { key: 'edoc_eirsaliye', labelTr: 'e-İrsaliye', labelEn: 'e-Waybill', indent: true },
      { key: 'edoc_esmm', labelTr: 'e-SMM', labelEn: 'e-SMM', indent: true },
    ],
  },
  {
    id: 'support',
    titleTr: 'Destek ve iletişim',
    titleEn: 'Support',
    rows: [
      { key: 'support_email', labelTr: 'Destek hattı (e-posta)', labelEn: 'Support (email)' },
      { key: 'support_live_chat', labelTr: 'Canlı chat', labelEn: 'Live chat' },
      { key: 'support_app_chatbot', labelTr: 'Uygulama chatbot', labelEn: 'In-app chatbot' },
    ],
  },
]

const ALL_KEYS: FeatureKey[] = PRICING_FEATURE_GROUPS.flatMap((g) => g.rows.map((r) => r.key))

function buildRow(tier: PlanTierCode, defaults: Partial<Record<FeatureKey, boolean>>): Record<FeatureKey, boolean> {
  const row = {} as Record<FeatureKey, boolean>
  for (const k of ALL_KEYS) {
    row[k] = defaults[k] ?? false
  }
  return row
}

/**
 * Varsayılan matris: kademeli genişleyen paketler (istediğiniz gibi düzenleyin).
 * true = tik görünür, false = gri çarpı.
 */
export const PLAN_FEATURE_MATRIX: Record<PlanTierCode, Record<FeatureKey, boolean>> = {
  FREE: buildRow('FREE', {
    dashboard: true,
    contacts: true,
    sales_invoices: true,
    purchase_invoices: true,
    support_email: true,
  }),
  KUCUK: buildRow('KUCUK', {
    dashboard: true,
    contacts: true,
    sales_invoices: true,
    purchase_invoices: true,
    orders: true,
    products_services: true,
    warehouse: true,
    quotes: true,
    campaigns: true,
    support_email: true,
    support_live_chat: true,
  }),
  ORTA: buildRow('ORTA', {
    dashboard: true,
    contacts: true,
    sales_invoices: true,
    purchase_invoices: true,
    orders: true,
    procurement: true,
    products_services: true,
    hr: true,
    warehouse: true,
    branches: true,
    projects: true,
    quotes: true,
    campaigns: true,
    marketplace: true,
    ai_module_bots: true,
    edoc_efatura: true,
    edoc_earsiv: true,
    support_email: true,
    support_live_chat: true,
    support_app_chatbot: true,
  }),
  BUYUK: buildRow('BUYUK', {
    dashboard: true,
    contacts: true,
    sales_invoices: true,
    purchase_invoices: true,
    orders: true,
    procurement: true,
    products_services: true,
    hr: true,
    warehouse: true,
    branches: true,
    projects: true,
    manufacturing: true,
    costing: true,
    quality: true,
    quotes: true,
    campaigns: true,
    marketplace: true,
    ai_module_bots: true,
    edoc_efatura: true,
    edoc_earsiv: true,
    edoc_eirsaliye: true,
    edoc_esmm: true,
    support_email: true,
    support_live_chat: true,
    support_app_chatbot: true,
  }),
  ENTERPRISE: buildRow('ENTERPRISE', Object.fromEntries(ALL_KEYS.map((k) => [k, true])) as Record<FeatureKey, boolean>),
}

export function isFeatureEnabledForPlan(tier: string, key: FeatureKey): boolean {
  const t = tier as PlanTierCode
  if (!PLAN_FEATURE_MATRIX[t]) return false
  return !!PLAN_FEATURE_MATRIX[t][key]
}
