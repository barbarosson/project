import { supabase } from './supabase'
import { analyzeTranslations, type TranslationReport } from './translation-checker'

export type CheckStatus = 'pass' | 'fail' | 'warning' | 'info' | 'pending' | 'running'
export type CheckSeverity = 'critical' | 'high' | 'medium' | 'low'
export type CheckCategory =
  | 'database'
  | 'performance'
  | 'translation'
  | 'theme'
  | 'duplicates'
  | 'security'
  | 'unused'
  | 'consistency'

export interface CheckResult {
  id: string
  category: CheckCategory
  name: string
  status: CheckStatus
  severity: CheckSeverity
  message: string
  details: string[]
  metric?: number
  metricLabel?: string
  fixable: boolean
  fixAction?: string
}

export interface CategorySummary {
  category: CheckCategory
  label: string
  total: number
  passed: number
  failed: number
  warnings: number
  score: number
}

export interface HealthCheckReport {
  timestamp: string
  overallScore: number
  overallStatus: 'healthy' | 'warning' | 'critical'
  checks: CheckResult[]
  categories: CategorySummary[]
  translationReport: TranslationReport | null
  executionTime: number
}

const CATEGORY_LABELS: Record<CheckCategory, string> = {
  database: 'Veritabani & Sema',
  performance: 'Performans',
  translation: 'Tercume & i18n',
  theme: 'Tema & Tasarim',
  duplicates: 'Mukerrer Kayitlar',
  security: 'Guvenlik & RLS',
  unused: 'Kullanilmayan Kaynaklar',
  consistency: 'Veri Tutarliligi',
}

const CORE_TABLES = [
  'customers', 'products', 'invoices', 'invoice_line_items', 'expenses',
  'proposals', 'campaigns', 'stock_movements', 'company_settings',
  'support_tickets', 'notifications', 'ai_chat_messages', 'ai_chat_sessions',
  'finance_accounts', 'finance_transactions', 'subscription_plans',
  'tenants', 'profiles', 'content_sections', 'cms_banners', 'ui_styles',
  'trend_searches', 'trend_results', 'trend_saved_reports',
  'trend_regions', 'trend_categories',
  'edocument_settings', 'edocument_records',
  'executive_reminders', 'executive_obligations', 'executive_meetings',
  'marketplace_accounts', 'marketplace_products', 'marketplace_orders',
  'trend_agent_searches', 'trend_agent_reports',
]

export async function runFullHealthCheck(
  onProgress?: (check: CheckResult) => void
): Promise<HealthCheckReport> {
  const startTime = Date.now()
  const checks: CheckResult[] = []

  const emit = (check: CheckResult) => {
    checks.push(check)
    onProgress?.(check)
  }

  await runDatabaseChecks(emit)
  await runPerformanceChecks(emit)
  const translationReport = runTranslationChecks(emit)
  await runThemeChecks(emit)
  await runDuplicateChecks(emit)
  await runSecurityChecks(emit)
  await runUnusedResourceChecks(emit)
  await runConsistencyChecks(emit)

  const categories = buildCategorySummaries(checks)
  const overallScore = calculateOverallScore(categories)
  const overallStatus: HealthCheckReport['overallStatus'] =
    overallScore >= 80 ? 'healthy' : overallScore >= 50 ? 'warning' : 'critical'

  return {
    timestamp: new Date().toISOString(),
    overallScore,
    overallStatus,
    checks,
    categories,
    translationReport,
    executionTime: Date.now() - startTime,
  }
}

async function runDatabaseChecks(emit: (c: CheckResult) => void) {
  const tablesFound: string[] = []
  const tablesMissing: string[] = []

  for (const table of CORE_TABLES) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1)
      if (error && (error.message.includes('does not exist') || error.code === '42P01')) {
        tablesMissing.push(table)
      } else {
        tablesFound.push(table)
      }
    } catch {
      tablesMissing.push(table)
    }
  }

  emit({
    id: 'db-tables',
    category: 'database',
    name: 'Tablo Varlik Kontrolu',
    status: tablesMissing.length === 0 ? 'pass' : tablesMissing.length <= 3 ? 'warning' : 'fail',
    severity: tablesMissing.length > 5 ? 'critical' : tablesMissing.length > 0 ? 'high' : 'low',
    message: `${tablesFound.length}/${CORE_TABLES.length} tablo mevcut`,
    details: [
      ...tablesFound.slice(0, 5).map(t => `Mevcut: ${t}`),
      ...(tablesFound.length > 5 ? [`...ve ${tablesFound.length - 5} tablo daha`] : []),
      ...tablesMissing.map(t => `EKSIK: ${t}`),
    ],
    metric: Math.round((tablesFound.length / CORE_TABLES.length) * 100),
    metricLabel: '%',
    fixable: tablesMissing.length > 0,
    fixAction: 'Migration dosyalarini calistirin',
  })

  try {
    const requiredCols: Record<string, string[]> = {
      products: ['id', 'name', 'sku', 'sale_price', 'purchase_price', 'tenant_id', 'category', 'unit'],
      customers: ['id', 'name', 'email', 'phone', 'tenant_id', 'account_type'],
      invoices: ['id', 'invoice_number', 'customer_id', 'tenant_id', 'status', 'total'],
      expenses: ['id', 'description', 'amount', 'tenant_id', 'category'],
    }

    const colIssues: string[] = []
    const colPassed: string[] = []

    for (const [table, cols] of Object.entries(requiredCols)) {
      try {
        const { data, error } = await supabase.from(table).select(cols.join(',')).limit(1)
        if (error) {
          const missingMatch = error.message.match(/column .+ does not exist/)
          if (missingMatch) {
            colIssues.push(`${table}: ${error.message}`)
          } else {
            colPassed.push(`${table}: ${cols.length} kolon OK`)
          }
        } else {
          colPassed.push(`${table}: ${cols.length} kolon OK`)
        }
      } catch {
        colIssues.push(`${table}: kontrol edilemedi`)
      }
    }

    emit({
      id: 'db-columns',
      category: 'database',
      name: 'Kolon Butunlugu',
      status: colIssues.length === 0 ? 'pass' : 'warning',
      severity: colIssues.length > 0 ? 'high' : 'low',
      message: colIssues.length === 0 ? 'Tum zorunlu kolonlar mevcut' : `${colIssues.length} kolon sorunu`,
      details: [...colPassed, ...colIssues],
      fixable: colIssues.length > 0,
    })
  } catch {
    emit({
      id: 'db-columns',
      category: 'database',
      name: 'Kolon Butunlugu',
      status: 'warning',
      severity: 'medium',
      message: 'Kolon kontrolu yapilamadi',
      details: ['Veritabani erisim hatasi'],
      fixable: false,
    })
  }

  try {
    const { data: session } = await supabase.auth.getSession()
    const tenantId = session?.session?.user?.id

    if (tenantId) {
      const { count: customerCount } = await supabase
        .from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
      const { count: productCount } = await supabase
        .from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
      const { count: invoiceCount } = await supabase
        .from('invoices').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)

      emit({
        id: 'db-records',
        category: 'database',
        name: 'Kayit Sayilari',
        status: 'info',
        severity: 'low',
        message: `${(customerCount || 0) + (productCount || 0) + (invoiceCount || 0)} toplam kayit`,
        details: [
          `Musteriler: ${customerCount || 0}`,
          `Urunler: ${productCount || 0}`,
          `Faturalar: ${invoiceCount || 0}`,
        ],
        fixable: false,
      })
    }
  } catch { /* skip */ }
}

async function runPerformanceChecks(emit: (c: CheckResult) => void) {
  const queryTests = [
    { name: 'customers', query: () => supabase.from('customers').select('id').limit(10) },
    { name: 'products', query: () => supabase.from('products').select('id').limit(10) },
    { name: 'invoices', query: () => supabase.from('invoices').select('id').limit(10) },
    { name: 'expenses', query: () => supabase.from('expenses').select('id').limit(10) },
    { name: 'notifications', query: () => supabase.from('notifications').select('id').limit(10) },
  ]

  const timings: { name: string; ms: number; status: string }[] = []

  for (const test of queryTests) {
    const start = performance.now()
    try {
      const { error } = await test.query()
      const elapsed = Math.round(performance.now() - start)
      if (error && error.message.includes('does not exist')) {
        timings.push({ name: test.name, ms: -1, status: 'tablo yok' })
      } else {
        timings.push({ name: test.name, ms: elapsed, status: elapsed < 500 ? 'hizli' : elapsed < 1500 ? 'orta' : 'yavas' })
      }
    } catch {
      timings.push({ name: test.name, ms: -1, status: 'hata' })
    }
  }

  const validTimings = timings.filter(t => t.ms >= 0)
  const avgMs = validTimings.length > 0 ? Math.round(validTimings.reduce((s, t) => s + t.ms, 0) / validTimings.length) : 0
  const slowQueries = validTimings.filter(t => t.ms > 1000)

  emit({
    id: 'perf-query',
    category: 'performance',
    name: 'Sorgu Yanit Suresi',
    status: slowQueries.length === 0 ? 'pass' : slowQueries.length <= 1 ? 'warning' : 'fail',
    severity: slowQueries.length > 2 ? 'high' : slowQueries.length > 0 ? 'medium' : 'low',
    message: `Ortalama: ${avgMs}ms | ${slowQueries.length} yavas sorgu`,
    details: timings.map(t =>
      t.ms >= 0 ? `${t.name}: ${t.ms}ms (${t.status})` : `${t.name}: ${t.status}`
    ),
    metric: avgMs,
    metricLabel: 'ms',
    fixable: false,
  })

  const authStart = performance.now()
  try {
    await supabase.auth.getSession()
    const authMs = Math.round(performance.now() - authStart)

    emit({
      id: 'perf-auth',
      category: 'performance',
      name: 'Auth Oturum Suresi',
      status: authMs < 300 ? 'pass' : authMs < 1000 ? 'warning' : 'fail',
      severity: authMs > 1000 ? 'high' : 'low',
      message: `${authMs}ms`,
      details: [`Oturum dogrulama: ${authMs}ms`, authMs < 300 ? 'Hizli' : authMs < 1000 ? 'Kabul edilebilir' : 'Yavas - kontrol edin'],
      metric: authMs,
      metricLabel: 'ms',
      fixable: false,
    })
  } catch { /* skip */ }

  const bundleSizeEstimates = [
    { name: 'dashboard', size: 25, limit: 50 },
    { name: 'pricing', size: 169, limit: 200 },
    { name: 'finance-robot', size: 16.1, limit: 40 },
    { name: 'customers', size: 15.8, limit: 40 },
    { name: 'inventory', size: 12.4, limit: 40 },
  ]

  const oversized = bundleSizeEstimates.filter(b => b.size > b.limit * 0.8)

  emit({
    id: 'perf-bundle',
    category: 'performance',
    name: 'Sayfa Boyut Analizi',
    status: oversized.length === 0 ? 'pass' : 'warning',
    severity: oversized.length > 2 ? 'medium' : 'low',
    message: `${oversized.length} buyuk sayfa tespit edildi`,
    details: bundleSizeEstimates.map(b => `/${b.name}: ${b.size}kB${b.size > b.limit * 0.8 ? ' (BUYUK)' : ''}`),
    fixable: false,
  })
}

function runTranslationChecks(emit: (c: CheckResult) => void): TranslationReport {
  const report = analyzeTranslations()

  emit({
    id: 'trans-coverage',
    category: 'translation',
    name: 'Tercume Kapsami',
    status: report.overallCompletion >= 99 ? 'pass' : report.overallCompletion >= 90 ? 'warning' : 'fail',
    severity: report.overallCompletion < 90 ? 'high' : report.overallCompletion < 99 ? 'medium' : 'low',
    message: `EN: ${report.totalEnKeys} | TR: ${report.totalTrKeys} | Tamamlanma: ${report.overallCompletion}%`,
    details: [
      `Ingilizce anahtar: ${report.totalEnKeys}`,
      `Turkce anahtar: ${report.totalTrKeys}`,
      `Tamamlanma orani: ${report.overallCompletion}%`,
      `Saglik skoru: ${report.healthScore}/100`,
    ],
    metric: report.overallCompletion,
    metricLabel: '%',
    fixable: report.overallCompletion < 100,
  })

  const missingKeys = report.issues.filter(i => i.type === 'missing_in_tr' || i.type === 'missing_in_en')
  const emptyValues = report.issues.filter(i => i.type === 'empty_value')
  const untranslated = report.issues.filter(i => i.type === 'untranslated')
  const placeholderIssues = report.issues.filter(i => i.type === 'placeholder_mismatch')

  if (missingKeys.length > 0) {
    emit({
      id: 'trans-missing',
      category: 'translation',
      name: 'Eksik Tercume Anahtarlari',
      status: 'fail',
      severity: 'high',
      message: `${missingKeys.length} eksik anahtar`,
      details: missingKeys.slice(0, 10).map(i => `${i.key} (${i.type === 'missing_in_tr' ? 'TR eksik' : 'EN eksik'})`),
      fixable: true,
      fixAction: 'i18n.ts dosyasina eksik anahtarlari ekleyin',
    })
  }

  if (emptyValues.length > 0) {
    emit({
      id: 'trans-empty',
      category: 'translation',
      name: 'Bos Tercume Degerleri',
      status: 'warning',
      severity: 'medium',
      message: `${emptyValues.length} bos deger`,
      details: emptyValues.slice(0, 10).map(i => i.key),
      fixable: true,
    })
  }

  if (untranslated.length > 0) {
    emit({
      id: 'trans-untranslated',
      category: 'translation',
      name: 'Tercume Edilmemis Metinler',
      status: 'info',
      severity: 'low',
      message: `${untranslated.length} potansiyel tercumesiz metin`,
      details: untranslated.slice(0, 10).map(i => `${i.key}: "${i.enValue}"`),
      fixable: true,
    })
  }

  if (placeholderIssues.length > 0) {
    emit({
      id: 'trans-placeholder',
      category: 'translation',
      name: 'Parametre Uyumsuzlugu',
      status: 'warning',
      severity: 'medium',
      message: `${placeholderIssues.length} parametre uyumsuzlugu`,
      details: placeholderIssues.slice(0, 10).map(i => `${i.key}: EN="${i.enValue}" TR="${i.trValue}"`),
      fixable: true,
    })
  }

  const sectionCompletion = report.sections.map(s => ({
    name: s.section,
    pct: s.completionPct,
    issues: s.missingInTr + s.missingInEn + s.emptyInTr,
  }))

  const lowSections = sectionCompletion.filter(s => s.pct < 100)

  emit({
    id: 'trans-sections',
    category: 'translation',
    name: 'Bolum Bazli Durum',
    status: lowSections.length === 0 ? 'pass' : 'info',
    severity: 'low',
    message: `${report.sections.length} bolum | ${lowSections.length} eksik bolum`,
    details: report.sections.map(s => `${s.section}: ${s.completionPct.toFixed(0)}% (${s.enKeys} anahtar)`),
    fixable: false,
  })

  return report
}

async function runThemeChecks(emit: (c: CheckResult) => void) {
  try {
    const { data: siteConfig, error } = await supabase
      .from('site_config')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error || !siteConfig) {
      emit({
        id: 'theme-config',
        category: 'theme',
        name: 'Site Konfigurasyonu',
        status: 'warning',
        severity: 'medium',
        message: 'Site konfigurasyonu bulunamadi',
        details: ['site_config tablosu bos veya erisilemez'],
        fixable: true,
        fixAction: 'Admin panelden site ayarlarini yapilandirin',
      })
    } else {
      const configKeys = Object.keys(siteConfig)
      const emptyFields = configKeys.filter(k => {
        const val = siteConfig[k as keyof typeof siteConfig]
        return val === null || val === '' || val === undefined
      })

      emit({
        id: 'theme-config',
        category: 'theme',
        name: 'Site Konfigurasyonu',
        status: emptyFields.length === 0 ? 'pass' : emptyFields.length <= 5 ? 'info' : 'warning',
        severity: emptyFields.length > 10 ? 'medium' : 'low',
        message: `${configKeys.length} ayar | ${emptyFields.length} bos alan`,
        details: [
          `Toplam alan: ${configKeys.length}`,
          `Dolu alan: ${configKeys.length - emptyFields.length}`,
          `Bos alan: ${emptyFields.length}`,
          ...emptyFields.slice(0, 8).map(f => `Bos: ${f}`),
          ...(emptyFields.length > 8 ? [`...ve ${emptyFields.length - 8} bos alan daha`] : []),
        ],
        fixable: emptyFields.length > 0,
      })
    }
  } catch {
    emit({
      id: 'theme-config',
      category: 'theme',
      name: 'Site Konfigurasyonu',
      status: 'warning',
      severity: 'low',
      message: 'Kontrol edilemedi',
      details: [],
      fixable: false,
    })
  }

  try {
    const { data: uiStyles } = await supabase.from('ui_styles').select('*')

    const stylesCount = uiStyles?.length || 0

    emit({
      id: 'theme-styles',
      category: 'theme',
      name: 'UI Stil Tanimlari',
      status: stylesCount > 0 ? 'pass' : 'info',
      severity: 'low',
      message: `${stylesCount} stil tanimli`,
      details: [
        `UI stilleri: ${stylesCount}`,
      ],
      fixable: false,
    })
  } catch { /* skip */ }

  try {
    const { data: banners } = await supabase.from('cms_banners').select('id, title, is_active, language')
    const totalBanners = banners?.length || 0
    const activeBanners = banners?.filter(b => b.is_active)?.length || 0
    const trBanners = banners?.filter(b => b.language === 'tr')?.length || 0
    const enBanners = banners?.filter(b => b.language === 'en')?.length || 0

    emit({
      id: 'theme-banners',
      category: 'theme',
      name: 'CMS Banner Durumu',
      status: totalBanners > 0 ? 'pass' : 'info',
      severity: 'low',
      message: `${totalBanners} banner (${activeBanners} aktif)`,
      details: [
        `Toplam: ${totalBanners}`,
        `Aktif: ${activeBanners}`,
        `Turkce: ${trBanners}`,
        `Ingilizce: ${enBanners}`,
      ],
      fixable: false,
    })
  } catch { /* skip */ }
}

async function runDuplicateChecks(emit: (c: CheckResult) => void) {
  try {
    const { data: session } = await supabase.auth.getSession()
    const tenantId = session?.session?.user?.id
    if (!tenantId) return

    const { data: products } = await supabase
      .from('products')
      .select('sku, name')
      .eq('tenant_id', tenantId)
      .not('sku', 'is', null)

    if (products && products.length > 0) {
      const skuMap = new Map<string, string[]>()
      for (const p of products) {
        if (!p.sku) continue
        const existing = skuMap.get(p.sku) || []
        existing.push(p.name)
        skuMap.set(p.sku, existing)
      }
      const duplicates = Array.from(skuMap.entries()).filter(([, names]) => names.length > 1)

      emit({
        id: 'dup-products',
        category: 'duplicates',
        name: 'Mukerrer Urun SKU',
        status: duplicates.length === 0 ? 'pass' : 'warning',
        severity: duplicates.length > 5 ? 'high' : duplicates.length > 0 ? 'medium' : 'low',
        message: duplicates.length === 0 ? 'Mukerrer SKU yok' : `${duplicates.length} mukerrer SKU`,
        details: duplicates.length === 0
          ? [`${products.length} urun kontrol edildi`]
          : duplicates.slice(0, 10).map(([sku, names]) => `SKU "${sku}": ${names.length}x (${names.join(', ')})`),
        metric: duplicates.length,
        fixable: duplicates.length > 0,
        fixAction: 'Mukerrer SKU lari birletirin veya silin',
      })
    }

    const { data: customers } = await supabase
      .from('customers')
      .select('email, name')
      .eq('tenant_id', tenantId)
      .not('email', 'is', null)

    if (customers && customers.length > 0) {
      const emailMap = new Map<string, string[]>()
      for (const c of customers) {
        if (!c.email) continue
        const key = c.email.toLowerCase()
        const existing = emailMap.get(key) || []
        existing.push(c.name)
        emailMap.set(key, existing)
      }
      const duplicates = Array.from(emailMap.entries()).filter(([, names]) => names.length > 1)

      emit({
        id: 'dup-customers',
        category: 'duplicates',
        name: 'Mukerrer Musteri Email',
        status: duplicates.length === 0 ? 'pass' : 'warning',
        severity: duplicates.length > 0 ? 'medium' : 'low',
        message: duplicates.length === 0 ? 'Mukerrer email yok' : `${duplicates.length} mukerrer email`,
        details: duplicates.length === 0
          ? [`${customers.length} musteri kontrol edildi`]
          : duplicates.slice(0, 10).map(([email, names]) => `"${email}": ${names.join(', ')}`),
        fixable: duplicates.length > 0,
      })
    }

    const { data: invoices } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('tenant_id', tenantId)
      .not('invoice_number', 'is', null)

    if (invoices && invoices.length > 0) {
      const numMap = new Map<string, number>()
      for (const inv of invoices) {
        if (!inv.invoice_number) continue
        numMap.set(inv.invoice_number, (numMap.get(inv.invoice_number) || 0) + 1)
      }
      const duplicates = Array.from(numMap.entries()).filter(([, count]) => count > 1)

      emit({
        id: 'dup-invoices',
        category: 'duplicates',
        name: 'Mukerrer Fatura Numarasi',
        status: duplicates.length === 0 ? 'pass' : 'fail',
        severity: duplicates.length > 0 ? 'critical' : 'low',
        message: duplicates.length === 0 ? 'Mukerrer fatura no yok' : `${duplicates.length} mukerrer fatura no`,
        details: duplicates.length === 0
          ? [`${invoices.length} fatura kontrol edildi`]
          : duplicates.slice(0, 10).map(([num, count]) => `Fatura #${num}: ${count}x tekrar`),
        fixable: duplicates.length > 0,
        fixAction: 'Mukerrer fatura numaralarini duzeltin',
      })
    }
  } catch { /* skip */ }
}

async function runSecurityChecks(emit: (c: CheckResult) => void) {
  const { data: session } = await supabase.auth.getSession()
  const isAuthenticated = !!session?.session?.user

  emit({
    id: 'sec-auth',
    category: 'security',
    name: 'Oturum Durumu',
    status: isAuthenticated ? 'pass' : 'warning',
    severity: isAuthenticated ? 'low' : 'high',
    message: isAuthenticated ? 'Aktif oturum mevcut' : 'Oturum bulunamadi',
    details: isAuthenticated
      ? [
          `Kullanici: ${session.session!.user.email}`,
          `ID: ${session.session!.user.id}`,
          `Oturum suresi: ${session.session!.expires_at ? new Date(session.session!.expires_at * 1000).toLocaleString('tr-TR') : 'Bilinmiyor'}`,
        ]
      : ['Giris yapmaniz gerekiyor'],
    fixable: false,
  })

  const rlsTables = ['customers', 'products', 'invoices', 'expenses']
  const rlsResults: { table: string; ok: boolean }[] = []

  for (const table of rlsTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1)
      rlsResults.push({ table, ok: !error || !error.message.includes('permission denied') })
    } catch {
      rlsResults.push({ table, ok: false })
    }
  }

  const rlsFails = rlsResults.filter(r => !r.ok)

  emit({
    id: 'sec-rls',
    category: 'security',
    name: 'RLS Politika Kontrolu',
    status: rlsFails.length === 0 ? 'pass' : 'warning',
    severity: rlsFails.length > 0 ? 'high' : 'low',
    message: `${rlsResults.length - rlsFails.length}/${rlsResults.length} tablo erisilebilir`,
    details: rlsResults.map(r => `${r.table}: ${r.ok ? 'OK' : 'ERISIM ENGELLENDI'}`),
    fixable: rlsFails.length > 0,
  })

  const envVars = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', present: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
  ]

  const missingEnv = envVars.filter(e => !e.present)

  emit({
    id: 'sec-env',
    category: 'security',
    name: 'Ortam Degiskenleri',
    status: missingEnv.length === 0 ? 'pass' : 'fail',
    severity: missingEnv.length > 0 ? 'critical' : 'low',
    message: `${envVars.length - missingEnv.length}/${envVars.length} degisken tanimli`,
    details: envVars.map(e => `${e.key}: ${e.present ? 'Tanimli' : 'EKSIK'}`),
    fixable: missingEnv.length > 0,
    fixAction: '.env dosyasini kontrol edin',
  })
}

async function runUnusedResourceChecks(emit: (c: CheckResult) => void) {
  try {
    const { data: session } = await supabase.auth.getSession()
    const tenantId = session?.session?.user?.id
    if (!tenantId) return

    const { data: draftInvoices, count: draftCount } = await supabase
      .from('invoices')
      .select('id, invoice_number, created_at', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'draft')
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    emit({
      id: 'unused-drafts',
      category: 'unused',
      name: 'Eski Taslak Faturalar',
      status: (draftCount || 0) === 0 ? 'pass' : 'warning',
      severity: (draftCount || 0) > 10 ? 'medium' : 'low',
      message: `${draftCount || 0} eski taslak fatura (30+ gun)`,
      details: (draftCount || 0) === 0
        ? ['Eski taslak fatura yok']
        : [
            `${draftCount} taslak fatura 30 gunden eski`,
            ...(draftInvoices || []).slice(0, 5).map(d => `#${d.invoice_number || 'N/A'} - ${new Date(d.created_at).toLocaleDateString('tr-TR')}`),
          ],
      fixable: (draftCount || 0) > 0,
      fixAction: 'Eski taslaklari silin veya tamamlayin',
    })

    const { data: zeroProducts, count: zeroCount } = await supabase
      .from('products')
      .select('id, name', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .or('sale_price.is.null,sale_price.eq.0')

    emit({
      id: 'unused-zero-products',
      category: 'unused',
      name: 'Fiyatsiz Urunler',
      status: (zeroCount || 0) === 0 ? 'pass' : 'warning',
      severity: (zeroCount || 0) > 5 ? 'medium' : 'low',
      message: `${zeroCount || 0} fiyatsiz urun`,
      details: (zeroCount || 0) === 0
        ? ['Tum urunlerin fiyati tanimli']
        : [
            ...((zeroProducts || []).slice(0, 8).map(p => p.name)),
            ...((zeroCount || 0) > 8 ? [`...ve ${(zeroCount || 0) - 8} urun daha`] : []),
          ],
      fixable: (zeroCount || 0) > 0,
    })

    const { count: readNotifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_read', true)
      .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    emit({
      id: 'unused-notifications',
      category: 'unused',
      name: 'Eski Okunmus Bildirimler',
      status: (readNotifCount || 0) === 0 ? 'pass' : 'info',
      severity: 'low',
      message: `${readNotifCount || 0} eski bildirim (90+ gun)`,
      details: [(readNotifCount || 0) === 0 ? 'Temizlenecek bildirim yok' : `${readNotifCount} okunmus bildirim temizlenebilir`],
      fixable: (readNotifCount || 0) > 0,
      fixAction: 'Eski bildirimleri temizleyin',
    })
  } catch { /* skip */ }
}

async function runConsistencyChecks(emit: (c: CheckResult) => void) {
  try {
    const { data: session } = await supabase.auth.getSession()
    const tenantId = session?.session?.user?.id
    if (!tenantId) return

    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, customer_id, total, status')
      .eq('tenant_id', tenantId)

    if (invoices && invoices.length > 0) {
      const noCustomer = invoices.filter(i => !i.customer_id)
      const noTotal = invoices.filter(i => i.total === null || i.total === 0)
      const issues: string[] = []

      if (noCustomer.length > 0) issues.push(`${noCustomer.length} fatura musterisiz`)
      if (noTotal.length > 0) issues.push(`${noTotal.length} fatura tutarsiz (0 veya bos)`)

      emit({
        id: 'cons-invoices',
        category: 'consistency',
        name: 'Fatura Veri Tutarliligi',
        status: issues.length === 0 ? 'pass' : 'warning',
        severity: issues.length > 0 ? 'medium' : 'low',
        message: issues.length === 0 ? `${invoices.length} fatura tutarli` : `${issues.length} tutarsizlik`,
        details: issues.length === 0
          ? [`${invoices.length} fatura kontrol edildi - tumu tutarli`]
          : issues,
        fixable: issues.length > 0,
      })
    }

    const { data: expenses } = await supabase
      .from('expenses')
      .select('id, description, amount, category')
      .eq('tenant_id', tenantId)

    if (expenses && expenses.length > 0) {
      const noAmount = expenses.filter(e => !e.amount || e.amount <= 0)
      const noCategory = expenses.filter(e => !e.category)
      const noDesc = expenses.filter(e => !e.description || e.description.trim() === '')
      const issues: string[] = []

      if (noAmount.length > 0) issues.push(`${noAmount.length} gider tutarsiz`)
      if (noCategory.length > 0) issues.push(`${noCategory.length} gider kategorisiz`)
      if (noDesc.length > 0) issues.push(`${noDesc.length} gider aciklamasiz`)

      emit({
        id: 'cons-expenses',
        category: 'consistency',
        name: 'Gider Veri Tutarliligi',
        status: issues.length === 0 ? 'pass' : 'warning',
        severity: issues.length > 0 ? 'medium' : 'low',
        message: issues.length === 0 ? `${expenses.length} gider tutarli` : `${issues.length} tutarsizlik`,
        details: issues.length === 0
          ? [`${expenses.length} gider kontrol edildi`]
          : issues,
        fixable: issues.length > 0,
      })
    }

    const { data: products } = await supabase
      .from('products')
      .select('id, name, sale_price, purchase_price, stock_quantity, min_stock_level')
      .eq('tenant_id', tenantId)

    if (products && products.length > 0) {
      const negativePriceMargin = products.filter(p =>
        p.sale_price && p.purchase_price && p.sale_price < p.purchase_price
      )
      const belowMinStock = products.filter(p =>
        p.min_stock_level && p.stock_quantity !== null && p.stock_quantity < p.min_stock_level
      )
      const issues: string[] = []

      if (negativePriceMargin.length > 0) {
        issues.push(`${negativePriceMargin.length} urun zarar marjinda (satis < alis)`)
      }
      if (belowMinStock.length > 0) {
        issues.push(`${belowMinStock.length} urun minimum stok altinda`)
      }

      emit({
        id: 'cons-products',
        category: 'consistency',
        name: 'Urun Veri Tutarliligi',
        status: issues.length === 0 ? 'pass' : 'warning',
        severity: negativePriceMargin.length > 0 ? 'high' : issues.length > 0 ? 'medium' : 'low',
        message: issues.length === 0 ? `${products.length} urun tutarli` : `${issues.length} tutarsizlik`,
        details: issues.length === 0
          ? [`${products.length} urun kontrol edildi`]
          : [
              ...issues,
              ...negativePriceMargin.slice(0, 5).map(p => `Zarar: ${p.name} (satis: ${p.sale_price}, alis: ${p.purchase_price})`),
              ...belowMinStock.slice(0, 5).map(p => `Dusuk stok: ${p.name} (${p.stock_quantity}/${p.min_stock_level})`),
            ],
        fixable: issues.length > 0,
      })
    }
  } catch { /* skip */ }
}

function buildCategorySummaries(checks: CheckResult[]): CategorySummary[] {
  const catMap = new Map<CheckCategory, CheckResult[]>()
  for (const check of checks) {
    const arr = catMap.get(check.category) || []
    arr.push(check)
    catMap.set(check.category, arr)
  }

  const summaries: CategorySummary[] = []
  for (const [category, catChecks] of Array.from(catMap.entries())) {
    const passed = catChecks.filter(c => c.status === 'pass' || c.status === 'info').length
    const failed = catChecks.filter(c => c.status === 'fail').length
    const warnings = catChecks.filter(c => c.status === 'warning').length
    const total = catChecks.length
    const score = total > 0 ? Math.round((passed / total) * 100) : 100

    summaries.push({
      category,
      label: CATEGORY_LABELS[category] || category,
      total,
      passed,
      failed,
      warnings,
      score,
    })
  }

  return summaries.sort((a, b) => a.score - b.score)
}

function calculateOverallScore(categories: CategorySummary[]): number {
  if (categories.length === 0) return 100

  const weights: Partial<Record<CheckCategory, number>> = {
    database: 20,
    security: 20,
    translation: 15,
    duplicates: 15,
    consistency: 15,
    performance: 10,
    theme: 3,
    unused: 2,
  }

  let totalWeight = 0
  let weightedScore = 0

  for (const cat of categories) {
    const w = weights[cat.category] || 5
    totalWeight += w
    weightedScore += cat.score * w
  }

  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 100
}
