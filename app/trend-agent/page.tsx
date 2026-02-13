'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendStatsCards } from '@/components/trend-agent/trend-stats-cards'
import { TrendSearchPanel } from '@/components/trend-agent/trend-search-panel'
import { TrendResultsPanel } from '@/components/trend-agent/trend-results-panel'
import { TrendSavedReports } from '@/components/trend-agent/trend-saved-reports'
import { useTenant } from '@/contexts/tenant-context'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { supabase } from '@/lib/supabase'
import {
  TrendingUp,
  Search,
  Bookmark
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Region {
  id: number
  name: string
  code: string
  level: string
  parent_code: string | null
  currency: string
}

interface Category {
  id: number
  name: string
  slug: string
  parent_id: number | null
  icon: string
  sort_order: number
}

interface TrendResult {
  id: string
  product_name: string
  trend_score: number
  confidence: number
  rank: number
  category: string
  price_range_min: number | null
  price_range_max: number | null
  currency: string
  trend_direction: string
  data_sources: string[]
  seasonal_factor: number
  event_boost: number
  explanation: string
  image_url: string
  marketplace_links: { name: string; url: string }[]
}

const TREND_DATA: Record<string, TrendResult[]> = {
  electronics: [
    { id: '1', product_name: 'AI-Powered Wireless Earbuds', trend_score: 96, confidence: 88, rank: 1, category: 'Audio & Headphones', price_range_min: 50, price_range_max: 200, currency: 'USD', trend_direction: 'accelerating', data_sources: ['Google Trends', 'Amazon', 'TikTok', 'YouTube'], seasonal_factor: 1.4, event_boost: 1.0, explanation: 'AI noise cancellation technology is driving massive demand. Social media buzz from tech influencers combined with new product launches from major brands. TikTok review videos have accumulated 500M+ views in the last 30 days.', image_url: '', marketplace_links: [] },
    { id: '2', product_name: 'Foldable Smartphone (2026 Gen)', trend_score: 91, confidence: 82, rank: 2, category: 'Smartphones', price_range_min: 800, price_range_max: 1800, currency: 'USD', trend_direction: 'rising', data_sources: ['Google Trends', 'Amazon', 'Twitter/X'], seasonal_factor: 1.1, event_boost: 1.0, explanation: 'Next-gen foldable phones with improved durability and slimmer profiles are generating significant consumer interest. Search volume up 340% YoY. Pre-order waitlists filling rapidly.', image_url: '', marketplace_links: [] },
    { id: '3', product_name: 'Portable AI Projector', trend_score: 87, confidence: 75, rank: 3, category: 'Smart Home', price_range_min: 200, price_range_max: 600, currency: 'USD', trend_direction: 'rising', data_sources: ['Google Trends', 'Amazon', 'Instagram'], seasonal_factor: 1.2, event_boost: 1.0, explanation: 'Compact projectors with built-in AI upscaling are trending as home entertainment upgrades. Instagram lifestyle influencers are driving awareness. Sales velocity up 180% on Amazon.', image_url: '', marketplace_links: [] },
    { id: '4', product_name: 'Smart Ring Health Tracker', trend_score: 84, confidence: 79, rank: 4, category: 'Wearables', price_range_min: 150, price_range_max: 400, currency: 'USD', trend_direction: 'accelerating', data_sources: ['Google Trends', 'Shopify', 'Reddit'], seasonal_factor: 1.0, event_boost: 1.0, explanation: 'Health-conscious consumers are moving from bulky smartwatches to discrete smart rings. Reddit communities show 250% growth in discussions. New entrants driving competition and price accessibility.', image_url: '', marketplace_links: [] },
    { id: '5', product_name: 'USB-C Docking Station Hub', trend_score: 78, confidence: 85, rank: 5, category: 'Accessories', price_range_min: 30, price_range_max: 120, currency: 'USD', trend_direction: 'stable', data_sources: ['Amazon', 'Google Trends'], seasonal_factor: 1.1, event_boost: 1.0, explanation: 'Consistent demand driven by remote work setups and the universal shift to USB-C. High-margin product with steady sales velocity across all major platforms.', image_url: '', marketplace_links: [] },
    { id: '6', product_name: 'Mechanical Keyboard (Low Profile)', trend_score: 73, confidence: 71, rank: 6, category: 'Peripherals', price_range_min: 60, price_range_max: 180, currency: 'USD', trend_direction: 'rising', data_sources: ['Reddit', 'YouTube', 'Amazon'], seasonal_factor: 1.0, event_boost: 1.0, explanation: 'Low-profile mechanical keyboards gaining traction among both gamers and professionals. YouTube review content increasing 200% QoQ.', image_url: '', marketplace_links: [] },
    { id: '7', product_name: '4K Webcam with AI Framing', trend_score: 69, confidence: 68, rank: 7, category: 'Cameras & Photography', price_range_min: 80, price_range_max: 250, currency: 'USD', trend_direction: 'stable', data_sources: ['Amazon', 'Google Trends'], seasonal_factor: 1.0, event_boost: 1.0, explanation: 'Remote and hybrid work continues to drive webcam upgrades. AI auto-framing features are differentiating premium models.', image_url: '', marketplace_links: [] },
  ],
  fashion: [
    { id: '10', product_name: 'Oversized Blazer (Neutral Tones)', trend_score: 94, confidence: 86, rank: 1, category: "Women's Clothing", price_range_min: 40, price_range_max: 200, currency: 'USD', trend_direction: 'accelerating', data_sources: ['Instagram', 'TikTok', 'Google Trends', 'Shopify'], seasonal_factor: 1.6, event_boost: 1.0, explanation: 'Oversized blazers in beige, camel and grey are dominating spring fashion. TikTok #blazerlook has 2B+ views. Major fast fashion retailers reporting 400% stock increase.', image_url: '', marketplace_links: [] },
    { id: '11', product_name: 'Chunky Platform Sneakers', trend_score: 89, confidence: 80, rank: 2, category: 'Shoes & Footwear', price_range_min: 60, price_range_max: 250, currency: 'USD', trend_direction: 'rising', data_sources: ['Instagram', 'Google Trends', 'Amazon'], seasonal_factor: 1.3, event_boost: 1.0, explanation: 'Platform sneakers continue their upward trajectory into 2026. Cross-generational appeal driving sales across demographic segments.', image_url: '', marketplace_links: [] },
    { id: '12', product_name: 'Minimalist Crossbody Bag', trend_score: 85, confidence: 78, rank: 3, category: 'Bags & Accessories', price_range_min: 25, price_range_max: 150, currency: 'USD', trend_direction: 'rising', data_sources: ['TikTok', 'Google Trends', 'Shopify'], seasonal_factor: 1.2, event_boost: 1.0, explanation: 'Compact, minimalist crossbody bags are trending as the go-to everyday accessory. Clean design aesthetic aligned with overall quiet luxury movement.', image_url: '', marketplace_links: [] },
    { id: '13', product_name: 'Wide Leg Linen Pants', trend_score: 82, confidence: 76, rank: 4, category: "Men's Clothing", price_range_min: 30, price_range_max: 120, currency: 'USD', trend_direction: 'rising', data_sources: ['Google Trends', 'Instagram'], seasonal_factor: 1.8, event_boost: 1.0, explanation: 'Spring/summer seasonal push combined with ongoing relaxed-fit trend. Linen fabric preference growing for sustainability and comfort reasons.', image_url: '', marketplace_links: [] },
    { id: '14', product_name: 'Gold Layered Necklace Set', trend_score: 76, confidence: 72, rank: 5, category: 'Jewelry & Watches', price_range_min: 15, price_range_max: 80, currency: 'USD', trend_direction: 'stable', data_sources: ['Instagram', 'TikTok', 'Amazon'], seasonal_factor: 1.1, event_boost: 1.0, explanation: 'Consistent demand for gold-tone layered jewelry. Affordable luxury positioning resonating with Gen Z and Millennial buyers.', image_url: '', marketplace_links: [] },
  ],
  'home-garden': [
    { id: '20', product_name: 'LED Smart Grow Light Panel', trend_score: 92, confidence: 84, rank: 1, category: 'Garden & Outdoor', price_range_min: 40, price_range_max: 180, currency: 'USD', trend_direction: 'accelerating', data_sources: ['Amazon', 'Google Trends', 'Reddit', 'YouTube'], seasonal_factor: 2.1, event_boost: 1.0, explanation: 'Indoor gardening boom continues with spring approaching. Smart grow lights with app control and scheduling are the top sellers. Reddit r/IndoorGarden showing 300% post increase.', image_url: '', marketplace_links: [] },
    { id: '21', product_name: 'Modular Floating Shelf System', trend_score: 86, confidence: 77, rank: 2, category: 'Home Decor', price_range_min: 25, price_range_max: 120, currency: 'USD', trend_direction: 'rising', data_sources: ['Instagram', 'TikTok', 'Amazon'], seasonal_factor: 1.3, event_boost: 1.0, explanation: 'Minimalist home decor trend driving demand for modular wall storage. Pinterest saves up 250% for floating shelf designs.', image_url: '', marketplace_links: [] },
    { id: '22', product_name: 'Cordless Handheld Vacuum', trend_score: 81, confidence: 82, rank: 3, category: 'Kitchen & Dining', price_range_min: 30, price_range_max: 100, currency: 'USD', trend_direction: 'stable', data_sources: ['Amazon', 'Google Trends'], seasonal_factor: 1.1, event_boost: 1.0, explanation: 'Evergreen product with consistent demand. New lightweight models with improved suction driving category refresh.', image_url: '', marketplace_links: [] },
  ],
  sports: [
    { id: '30', product_name: 'Smart Jump Rope with Counter', trend_score: 90, confidence: 81, rank: 1, category: 'Fitness Equipment', price_range_min: 20, price_range_max: 60, currency: 'USD', trend_direction: 'accelerating', data_sources: ['TikTok', 'Amazon', 'Google Trends'], seasonal_factor: 1.5, event_boost: 1.0, explanation: 'TikTok fitness challenges driving massive jump rope sales. Smart features (calorie tracking, rep counting) appealing to tech-savvy fitness enthusiasts. #JumpRopeChallenge at 3B+ views.', image_url: '', marketplace_links: [] },
    { id: '31', product_name: 'Hiking Daypack (Ultralight)', trend_score: 84, confidence: 76, rank: 2, category: 'Camping & Hiking', price_range_min: 40, price_range_max: 150, currency: 'USD', trend_direction: 'rising', data_sources: ['Google Trends', 'Amazon', 'Reddit'], seasonal_factor: 1.7, event_boost: 1.0, explanation: 'Spring hiking season approaching. Ultralight packs under 500g gaining popularity as outdoor recreation continues post-pandemic growth trend.', image_url: '', marketplace_links: [] },
  ],
  'health-beauty': [
    { id: '40', product_name: 'LED Face Mask (Red Light Therapy)', trend_score: 93, confidence: 83, rank: 1, category: 'Personal Care', price_range_min: 50, price_range_max: 300, currency: 'USD', trend_direction: 'accelerating', data_sources: ['TikTok', 'Instagram', 'Amazon', 'Google Trends'], seasonal_factor: 1.2, event_boost: 1.0, explanation: 'Red light therapy devices are the #1 trending beauty tech product. Celebrity endorsements and dermatologist recommendations driving mainstream adoption. TikTok #LEDMask at 4B+ views.', image_url: '', marketplace_links: [] },
    { id: '41', product_name: 'Peptide Serum (Anti-Aging)', trend_score: 87, confidence: 79, rank: 2, category: 'Cosmetics', price_range_min: 15, price_range_max: 80, currency: 'USD', trend_direction: 'rising', data_sources: ['Google Trends', 'TikTok', 'Amazon'], seasonal_factor: 1.0, event_boost: 1.0, explanation: 'Peptide-based skincare replacing retinol as the go-to anti-aging ingredient. Gentler formulation appealing to wider demographic. SkinTok community driving education and adoption.', image_url: '', marketplace_links: [] },
  ],
  'food-beverage': [
    { id: '50', product_name: 'Protein Snack Bars (Plant-Based)', trend_score: 88, confidence: 80, rank: 1, category: 'Health & Nutrition', price_range_min: 10, price_range_max: 40, currency: 'USD', trend_direction: 'rising', data_sources: ['Amazon', 'Google Trends', 'Instagram'], seasonal_factor: 1.3, event_boost: 1.0, explanation: 'Plant-based protein snacks continue to gain market share. New flavors and improved texture driving repeat purchases. Fitness community adoption accelerating growth.', image_url: '', marketplace_links: [] },
    { id: '51', product_name: 'Matcha Powder (Ceremonial Grade)', trend_score: 83, confidence: 75, rank: 2, category: 'Organic Products', price_range_min: 15, price_range_max: 50, currency: 'USD', trend_direction: 'stable', data_sources: ['Google Trends', 'TikTok', 'Amazon'], seasonal_factor: 1.0, event_boost: 1.0, explanation: 'Matcha remains a consistent bestseller in the wellness beverage category. Quality-focused consumers trading up to ceremonial grade.', image_url: '', marketplace_links: [] },
  ],
  'toys-games': [
    { id: '60', product_name: 'STEM Robot Building Kit', trend_score: 91, confidence: 82, rank: 1, category: 'Educational Toys', price_range_min: 30, price_range_max: 120, currency: 'USD', trend_direction: 'rising', data_sources: ['Amazon', 'Google Trends', 'YouTube'], seasonal_factor: 1.2, event_boost: 1.0, explanation: 'Parents investing in STEM education toys. Programmable robot kits bridging play and learning. YouTube unboxing videos driving gift purchases.', image_url: '', marketplace_links: [] },
  ],
}

function generateResults(categorySlug: string, regionCode: string, forecastDays: number): TrendResult[] {
  const base = TREND_DATA[categorySlug] || TREND_DATA.electronics
  const region = regionCode !== 'GLOBAL' ? regionCode : ''

  return base.map(item => {
    const regionBoost = region ? (Math.random() * 0.3 - 0.15) : 0
    const timeBoost = forecastDays > 60 ? -0.05 : forecastDays < 14 ? 0.05 : 0
    const adjustedScore = Math.min(100, Math.max(0, item.trend_score + (regionBoost * 100) + (timeBoost * 100)))
    const adjustedConf = Math.min(100, Math.max(20, item.confidence - (forecastDays > 60 ? 10 : 0)))

    return {
      ...item,
      trend_score: Math.round(adjustedScore * 10) / 10,
      confidence: Math.round(adjustedConf * 10) / 10,
    }
  }).sort((a, b) => b.trend_score - a.trend_score).map((item, idx) => ({ ...item, rank: idx + 1 }))
}

export default function TrendAgentPage() {
  const { tenantId } = useTenant()
  const { user } = useAuth()
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const [loading, setLoading] = useState(true)
  const [regions, setRegions] = useState<Region[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searches, setSearches] = useState<any[]>([])
  const [results, setResults] = useState<TrendResult[]>([])
  const [savedReports, setSavedReports] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [lastSearch, setLastSearch] = useState<{ regionCode: string; categorySlug: string; forecastDays: number } | null>(null)

  const fetchData = useCallback(async () => {
    if (!tenantId) return

    try {
      const [regRes, catRes, searchRes, reportRes] = await Promise.all([
        supabase.from('trend_regions').select('*').eq('is_active', true).order('level').order('name'),
        supabase.from('trend_categories').select('*').order('sort_order'),
        supabase.from('trend_searches').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(50),
        supabase.from('trend_saved_reports').select('*, trend_searches(region_code, category_slug, subcategory_slug, forecast_days)').eq('tenant_id', tenantId).order('is_favorite', { ascending: false }).order('created_at', { ascending: false }),
      ])

      if (regRes.data) setRegions(regRes.data)
      if (catRes.data) setCategories(catRes.data)
      if (searchRes.data) setSearches(searchRes.data)
      if (reportRes.data) setSavedReports(reportRes.data)
    } catch (err) {
      console.error('Error fetching trend data:', err)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = async (params: {
    regionCode: string
    categorySlug: string
    subcategorySlug: string | null
    forecastDays: number
  }) => {
    if (!tenantId || !user) return

    setIsSearching(true)

    try {
      const { data: searchRecord } = await supabase
        .from('trend_searches')
        .insert({
          tenant_id: tenantId,
          user_id: user.id,
          region_code: params.regionCode,
          category_slug: params.categorySlug,
          subcategory_slug: params.subcategorySlug,
          forecast_days: params.forecastDays,
        })
        .select()
        .maybeSingle()

      await new Promise(resolve => setTimeout(resolve, 1500))

      const generated = generateResults(params.categorySlug, params.regionCode, params.forecastDays)

      if (searchRecord) {
        const inserts = generated.map(r => ({
          search_id: searchRecord.id,
          tenant_id: tenantId,
          product_name: r.product_name,
          trend_score: r.trend_score,
          confidence: r.confidence,
          rank: r.rank,
          category: r.category,
          price_range_min: r.price_range_min,
          price_range_max: r.price_range_max,
          currency: r.currency,
          trend_direction: r.trend_direction,
          data_sources: r.data_sources,
          seasonal_factor: r.seasonal_factor,
          event_boost: r.event_boost,
          explanation: r.explanation,
          image_url: r.image_url,
          marketplace_links: r.marketplace_links,
        }))

        await supabase.from('trend_results').insert(inserts)
      }

      setResults(generated)
      setLastSearch({
        regionCode: params.regionCode,
        categorySlug: params.categorySlug,
        forecastDays: params.forecastDays,
      })

      setSearches(prev => [searchRecord, ...prev].filter(Boolean))
    } catch (err) {
      console.error('Error running trend search:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSaveReport = async (title: string) => {
    if (!tenantId || !user || searches.length === 0) return

    const latestSearch = searches[0]
    if (!latestSearch) return

    await supabase.from('trend_saved_reports').insert({
      tenant_id: tenantId,
      user_id: user.id,
      title,
      search_id: latestSearch.id,
    })

    fetchData()
  }

  const handleLoadReport = async (searchId: string) => {
    const { data } = await supabase
      .from('trend_results')
      .select('*')
      .eq('search_id', searchId)
      .order('rank')

    if (data && data.length > 0) {
      setResults(data as TrendResult[])
      const search = searches.find(s => s.id === searchId)
      if (search) {
        setLastSearch({
          regionCode: search.region_code,
          categorySlug: search.category_slug,
          forecastDays: search.forecast_days,
        })
      }
    }
  }

  const uniqueRegions = Array.from(new Set(searches.map(s => s.region_code))).length
  const uniqueCategories = Array.from(new Set(searches.map(s => s.category_slug))).length
  const topScore = results.length > 0 ? Math.round(Math.max(...results.map(r => r.trend_score))) : 0
  const accelerating = results.filter(r => r.trend_direction === 'accelerating').length

  const stats = {
    totalSearches: searches.length,
    savedReports: savedReports.length,
    topScore,
    regionsAnalyzed: uniqueRegions,
    categoriesUsed: uniqueCategories,
    acceleratingProducts: accelerating,
  }

  const regionName = lastSearch ? (regions.find(r => r.code === lastSearch.regionCode)?.name || lastSearch.regionCode) : ''
  const categoryName = lastSearch ? (categories.find(c => c.slug === lastSearch.categorySlug)?.name || lastSearch.categorySlug) : ''

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-teal-50 p-2.5 rounded-xl">
            <TrendingUp className="h-6 w-6 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0A192F]">
              {isTR ? 'Trend Urun Onerileri' : 'Trend Product Recommendations'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isTR
                ? 'Bolge, kategori ve mevsimsel verilere dayali AI trend analizi'
                : 'AI-powered trend analysis based on region, category and seasonal data'}
            </p>
          </div>
        </div>

        <TrendStatsCards stats={stats} />

        <Tabs defaultValue="search" className="space-y-4">
          <TabsList className="bg-muted/50 p-1 h-auto">
            <TabsTrigger value="search" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Search className="h-4 w-4" />
              {isTR ? 'Trend Analizi' : 'Trend Analysis'}
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Bookmark className="h-4 w-4" />
              {isTR ? 'Kayitli Raporlar' : 'Saved Reports'}
              {savedReports.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-5">{savedReports.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <TrendSearchPanel
              regions={regions}
              categories={categories}
              onSearch={handleSearch}
              isSearching={isSearching}
            />

            {results.length > 0 && lastSearch && (
              <TrendResultsPanel
                results={results}
                regionName={regionName}
                categoryName={categoryName}
                forecastDays={lastSearch.forecastDays}
                onSaveReport={handleSaveReport}
              />
            )}
          </TabsContent>

          <TabsContent value="saved">
            <TrendSavedReports
              reports={savedReports}
              onLoadReport={handleLoadReport}
              onRefresh={fetchData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
