'use client'

import { usePricingEngine, type BillingCycle } from '@/hooks/use-pricing-engine'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/hooks/use-currency'
import {
  MODULE_CATEGORIES,
  getModulesByCategory,
  SCALABLE_UNITS,
  MARKETPLACE_BUNDLE,
  MARKETPLACE_EXTRA_CHANNELS,
  EINVOICE_CREDIT_PACKS,
  YEARLY_DISCOUNT_LABEL_TR,
  YEARLY_DISCOUNT_LABEL_EN,
  type PricingModule,
} from '@/lib/pricing-configurator-data'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sparkles,
  Check,
  Package,
  ShoppingCart,
  FileCheck,
  Plus,
  Minus,
  LayoutDashboard,
  Settings2,
  Factory,
  TrendingUp,
  Brain,
  Headphones,
  Lock,
  Info,
} from 'lucide-react'
import { OrderSummary } from './order-summary'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  LayoutDashboard,
  Settings2,
  Factory,
  TrendingUp,
  Brain,
  ShoppingCart,
  FileCheck,
  Headphones,
}

function ModuleCard({
  mod,
  isSelected,
  isAiBotEnabled,
  onToggle,
  onToggleAi,
  language,
  formatCurrency,
  currency,
  isRecommended,
}: {
  mod: PricingModule
  isSelected: boolean
  isAiBotEnabled: boolean
  onToggle: () => void
  onToggleAi: () => void
  language: string
  formatCurrency: (n: number) => string
  currency: string
  isRecommended?: boolean
}) {
  const label = language === 'en' ? mod.labelEn : mod.labelTr
  const description = language === 'en' ? mod.descriptionEn : mod.descriptionTr
  const p = currency === 'TRY' ? mod.monthlyPriceTRY : mod.monthlyPriceUSD
  const aiP = currency === 'TRY' ? mod.aiBotPriceTRY : mod.aiBotPriceUSD

  return (
    <div
      className={`group relative rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
      }`}
      onClick={mod.includedInBase ? undefined : onToggle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">{label}</h4>
            {mod.includedInBase && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {language === 'en' ? 'Included' : 'Dahil'}
              </Badge>
            )}
            {isRecommended && !isSelected && (
              <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 animate-pulse">
                {language === 'en' ? 'Recommended' : 'Önerilen'}
              </Badge>
            )}
            {mod.badgeTr && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {language === 'en' ? mod.badgeEn : mod.badgeTr}
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{description}</p>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {p === 0 ? (
            <span className="text-xs font-medium text-gray-400">
              {language === 'en' ? 'Free' : 'Dahil'}
            </span>
          ) : (
            <span className="text-sm font-bold">
              {formatCurrency(p)}
              <span className="text-xs font-normal text-gray-500">/{language === 'en' ? 'mo' : 'ay'}</span>
            </span>
          )}
          <Checkbox
            checked={isSelected}
            disabled={mod.includedInBase}
            onCheckedChange={mod.includedInBase ? undefined : onToggle}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            variant="round"
            className="data-[state=checked]:border-emerald-500 [&_span]:bg-emerald-500"
          />
        </div>
      </div>

      {/* AI Bot Toggle */}
      {mod.hasAiBot && isSelected && (
        <div
          className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-medium text-violet-700 dark:text-violet-400">
              {language === 'en' ? `AI Bot for ${mod.labelEn}` : `AI Bot: ${mod.labelTr}`}
            </span>
            {aiP > 0 && (
              <span className="text-[10px] text-gray-500">
                +{formatCurrency(aiP)}/{language === 'en' ? 'mo' : 'ay'}
              </span>
            )}
          </div>
          <Checkbox
            checked={isAiBotEnabled}
            onCheckedChange={onToggleAi}
            variant="round"
            className="data-[state=checked]:border-violet-500 [&_span]:bg-violet-500"
          />
        </div>
      )}
    </div>
  )
}

export function PricingConfigurator() {
  const engine = usePricingEngine()
  const { language } = useLanguage()
  const { currency, formatCurrency } = useCurrency()

  const recommendedIds = new Set(engine.recommendations.map((r) => r.moduleId))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* Billing Toggle */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-3 rounded-full bg-gray-100 dark:bg-gray-800 p-1.5">
          <Tabs
            value={engine.billingCycle}
            onValueChange={(v) => engine.setBillingCycle(v as BillingCycle)}
          >
            <TabsList className="bg-transparent gap-1">
              <TabsTrigger
                value="monthly"
                className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700"
              >
                {language === 'en' ? 'Monthly' : 'Aylık'}
              </TabsTrigger>
              <TabsTrigger
                value="yearly"
                className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700 relative"
              >
                {language === 'en' ? 'Yearly' : 'Yıllık'}
                <Badge className="absolute -top-3 -right-4 bg-green-600 text-white text-[10px] px-1.5 py-0 shadow">
                  {language === 'en' ? YEARLY_DISCOUNT_LABEL_EN : YEARLY_DISCOUNT_LABEL_TR}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Left: Modules */}
        <div className="space-y-6">
          {/* Scalable Units */}
          <Card className="p-6 border-2 border-blue-100 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              {language === 'en' ? 'Team & Scale' : 'Ekip ve Ölçek'}
            </h3>
            <div className="space-y-6">
              {SCALABLE_UNITS.map((unit) => {
                const qty = engine.scalableQty[unit.id] ?? unit.min
                const extra = Math.max(0, qty - unit.includedQty)
                const unitP = currency === 'TRY' ? unit.unitPriceTRY : unit.unitPriceUSD
                return (
                  <div key={unit.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold text-sm">
                          {language === 'en' ? unit.labelEn : unit.labelTr}
                        </span>
                        <p className="text-xs text-gray-500">
                          {language === 'en' ? unit.descriptionEn : unit.descriptionTr}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-[#0A2540] text-[#0A2540] hover:bg-[#0A2540] hover:text-white"
                          onClick={() => engine.setScalableQuantity(unit.id, qty - unit.step)}
                          disabled={qty <= unit.min}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-bold text-sm" style={{ color: '#0A2540' }}>{qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-[#0A2540] text-[#0A2540] hover:bg-[#0A2540] hover:text-white"
                          onClick={() => engine.setScalableQuantity(unit.id, qty + unit.step)}
                          disabled={qty >= unit.max}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Slider
                      value={[qty]}
                      min={unit.min}
                      max={unit.max}
                      step={unit.step}
                      onValueChange={([v]) => engine.setScalableQuantity(unit.id, v)}
                      className="mb-1"
                    />
                    {extra > 0 && (
                      <p className="text-xs text-right text-gray-500">
                        +{extra} x {formatCurrency(unitP)} = {formatCurrency(extra * unitP)}/{language === 'en' ? 'mo' : 'ay'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Module Categories */}
          <Accordion type="multiple" defaultValue={MODULE_CATEGORIES.map((c) => c.id)} className="space-y-3">
            {MODULE_CATEGORIES.map((cat) => {
              const modules = getModulesByCategory(cat.id)
              if (modules.length === 0) return null
              const IconComp = CATEGORY_ICONS[cat.iconName] || LayoutDashboard

              return (
                <AccordionItem key={cat.id} value={cat.id} className="border rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <IconComp className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-sm">
                          {language === 'en' ? cat.labelEn : cat.labelTr}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          {modules.filter((m) => engine.selectedModules.has(m.id)).length}/{modules.length}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {modules.map((mod) => (
                        <ModuleCard
                          key={mod.id}
                          mod={mod}
                          isSelected={engine.selectedModules.has(mod.id)}
                          isAiBotEnabled={engine.aiBotsEnabled.has(mod.id)}
                          onToggle={() => engine.toggleModule(mod.id)}
                          onToggleAi={() => engine.toggleAiBot(mod.id)}
                          language={language}
                          formatCurrency={formatCurrency}
                          currency={currency}
                          isRecommended={recommendedIds.has(mod.id)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>

          {/* Marketplace */}
          <Card className="p-6 border-2 border-orange-100 dark:border-orange-900 bg-orange-50/30 dark:bg-orange-950/20">
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
              {language === 'en' ? 'E-Commerce Connect' : 'E-Ticaret Bağlantısı'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {language === 'en'
                ? 'Connect your store to Turkey\'s biggest marketplaces'
                : 'Mağazanızı Türkiye\'nin en büyük pazaryerlerine bağlayın'}
            </p>

            <div
              className={`rounded-xl border-2 p-4 mb-4 transition-all cursor-pointer ${
                engine.marketplaceBundleEnabled
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={engine.toggleMarketplaceBundle}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {language === 'en' ? MARKETPLACE_BUNDLE.labelEn : MARKETPLACE_BUNDLE.labelTr}
                    <Badge className="bg-orange-500 text-white text-[10px]">
                      {language === 'en' ? 'Best Value' : 'En Avantajlı'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(language === 'en' ? MARKETPLACE_BUNDLE.channelsEn : MARKETPLACE_BUNDLE.channelsTr).join(' + ')}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="font-bold text-sm">
                    {formatCurrency(currency === 'TRY' ? MARKETPLACE_BUNDLE.monthlyPriceTRY : MARKETPLACE_BUNDLE.monthlyPriceUSD)}
                    <span className="text-xs font-normal text-gray-500">/{language === 'en' ? 'mo' : 'ay'}</span>
                  </span>
                  <Checkbox
                    checked={engine.marketplaceBundleEnabled}
                    onCheckedChange={engine.toggleMarketplaceBundle}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    variant="round"
                    className="data-[state=checked]:border-orange-500 [&_span]:bg-orange-500"
                  />
                </div>
              </div>
            </div>

            {engine.marketplaceBundleEnabled && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {language === 'en' ? 'Add Extra Channels' : 'Ek Kanal Ekle'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MARKETPLACE_EXTRA_CHANNELS.map((ch) => {
                    const sel = engine.marketplaceExtraChannels.has(ch.id)
                    return (
                      <div
                        key={ch.id}
                        className={`rounded-lg border p-3 text-center cursor-pointer transition-all text-sm ${
                          sel
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 font-semibold'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => engine.toggleExtraChannel(ch.id)}
                      >
                        {language === 'en' ? ch.labelEn : ch.labelTr}
                        <br />
                        <span className="text-xs text-gray-500">
                          +{formatCurrency(currency === 'TRY' ? ch.monthlyPriceTRY : ch.monthlyPriceUSD)}/{language === 'en' ? 'mo' : 'ay'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* E-Invoice */}
          <Card className="p-6 border-2 border-green-100 dark:border-green-900 bg-green-50/30 dark:bg-green-950/20">
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-green-600" />
              {language === 'en' ? 'E-Invoice Integration' : 'E-Fatura Entegrasyonu'}
              <Badge className="bg-green-600 text-white text-[10px]">
                {language === 'en' ? 'Free Integration' : 'Ücretsiz Entegrasyon'}
              </Badge>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {language === 'en'
                ? 'Integration is free. Purchase credit packs as needed.'
                : 'Entegrasyon ücretsizdir. İhtiyacınıza göre kredi paketi satın alın.'}
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {EINVOICE_CREDIT_PACKS.map((pack) => {
                const sel = engine.selectedCreditPack === pack.id
                const p = currency === 'TRY' ? pack.priceTRY : pack.priceUSD
                return (
                  <div
                    key={pack.id}
                    className={`rounded-xl border-2 p-4 text-center cursor-pointer transition-all ${
                      sel
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => engine.setSelectedCreditPack(sel ? null : pack.id)}
                  >
                    <p className="text-2xl font-bold">{pack.qty}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      {language === 'en' ? 'credits' : 'kredi'}
                    </p>
                    <p className="font-bold text-sm">{formatCurrency(p)}</p>
                    {pack.discountPct > 0 && (
                      <Badge className="mt-1 bg-green-100 text-green-700 text-[10px]">
                        %{pack.discountPct} {language === 'en' ? 'savings' : 'tasarruf'}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right: Sticky Order Summary */}
        <div className="lg:sticky lg:top-24">
          <OrderSummary
            breakdown={engine.breakdown}
            billingCycle={engine.billingCycle}
            language={language}
            currency={currency}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  )
}
