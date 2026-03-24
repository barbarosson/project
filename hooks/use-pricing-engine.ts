'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  PRICING_MODULES,
  SCALABLE_UNITS,
  MARKETPLACE_BUNDLE,
  MARKETPLACE_EXTRA_CHANNELS,
  EINVOICE_CREDIT_PACKS,
  YEARLY_DISCOUNT_MONTHS,
  getModuleById,
  type PricingModule,
  type ScalableUnit,
} from '@/lib/pricing-configurator-data'

export type BillingCycle = 'monthly' | 'yearly'
export type CurrencyCode = 'TRY' | 'USD'

export interface PricingState {
  billingCycle: BillingCycle
  selectedModules: Set<string>
  aiBotsEnabled: Set<string>
  scalableQty: Record<string, number>
  marketplaceBundleEnabled: boolean
  marketplaceExtraChannels: Set<string>
  selectedCreditPack: string | null
}

export interface PricingLineItem {
  id: string
  labelTr: string
  labelEn: string
  monthlyTRY: number
  monthlyUSD: number
  type: 'base' | 'module' | 'ai_bot' | 'scalable' | 'marketplace' | 'credit_pack'
}

export interface PricingBreakdown {
  lineItems: PricingLineItem[]
  subtotalMonthlyTRY: number
  subtotalMonthlyUSD: number
  subtotalYearlyTRY: number
  subtotalYearlyUSD: number
  discountMonthsTRY: number
  discountMonthsUSD: number
  totalMonthlyTRY: number
  totalMonthlyUSD: number
  totalYearlyTRY: number
  totalYearlyUSD: number
  selectedModuleCount: number
  aiBotCount: number
}

function price(mod: PricingModule, cur: CurrencyCode): number {
  return cur === 'TRY' ? mod.monthlyPriceTRY : mod.monthlyPriceUSD
}

function aiPrice(mod: PricingModule, cur: CurrencyCode): number {
  return cur === 'TRY' ? mod.aiBotPriceTRY : mod.aiBotPriceUSD
}

function unitPrice(u: ScalableUnit, cur: CurrencyCode): number {
  return cur === 'TRY' ? u.unitPriceTRY : u.unitPriceUSD
}

export function usePricingEngine() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [selectedModules, setSelectedModules] = useState<Set<string>>(() => {
    const base = new Set<string>()
    for (const m of PRICING_MODULES) {
      if (m.includedInBase) base.add(m.id)
    }
    return base
  })
  const [aiBotsEnabled, setAiBotsEnabled] = useState<Set<string>>(new Set())
  const [scalableQty, setScalableQty] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {}
    for (const u of SCALABLE_UNITS) {
      defaults[u.id] = u.includedQty || u.min
    }
    return defaults
  })
  const [marketplaceBundleEnabled, setMarketplaceBundleEnabled] = useState(false)
  const [marketplaceExtraChannels, setMarketplaceExtraChannels] = useState<Set<string>>(new Set())
  const [selectedCreditPack, setSelectedCreditPack] = useState<string | null>(null)

  // ── Modül toggle ──
  const toggleModule = useCallback((moduleId: string) => {
    setSelectedModules((prev) => {
      const mod = getModuleById(moduleId)
      if (mod?.includedInBase) return prev
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
        setAiBotsEnabled((ab) => {
          const n = new Set(ab)
          n.delete(moduleId)
          return n
        })
      } else {
        next.add(moduleId)
      }
      return next
    })
  }, [])

  // ── AI bot toggle (yalnızca parent modül aktifse) ──
  const toggleAiBot = useCallback((moduleId: string) => {
    setAiBotsEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }, [])

  // ── Scalable qty ──
  const setScalableQuantity = useCallback((unitId: string, qty: number) => {
    const unit = SCALABLE_UNITS.find((u) => u.id === unitId)
    if (!unit) return
    const clamped = Math.max(unit.min, Math.min(unit.max, qty))
    setScalableQty((prev) => ({ ...prev, [unitId]: clamped }))
  }, [])

  // ── Marketplace ──
  const toggleMarketplaceBundle = useCallback(() => {
    setMarketplaceBundleEnabled((prev) => {
      if (!prev) return true
      setMarketplaceExtraChannels(new Set())
      return false
    })
  }, [])

  const toggleExtraChannel = useCallback((channelId: string) => {
    setMarketplaceExtraChannels((prev) => {
      const next = new Set(prev)
      if (next.has(channelId)) next.delete(channelId)
      else next.add(channelId)
      return next
    })
  }, [])

  // ── Hesaplama motoru ──
  const breakdown = useMemo<PricingBreakdown>(() => {
    const lineItems: PricingLineItem[] = []
    let recurringTRY = 0
    let recurringUSD = 0
    let oneTimeTRY = 0
    let oneTimeUSD = 0

    // 1) Temel paket
    const baseTRY = PRICING_MODULES.filter((m) => m.includedInBase).reduce((s, m) => s + m.monthlyPriceTRY, 0)
    const baseUSD = PRICING_MODULES.filter((m) => m.includedInBase).reduce((s, m) => s + m.monthlyPriceUSD, 0)
    lineItems.push({
      id: '_base_package',
      labelTr: 'Temel Paket',
      labelEn: 'Base Package',
      monthlyTRY: baseTRY,
      monthlyUSD: baseUSD,
      type: 'base',
    })
    recurringTRY += baseTRY
    recurringUSD += baseUSD

    // 2) A-la-carte modüller
    for (const mod of PRICING_MODULES) {
      if (mod.includedInBase) continue
      if (!selectedModules.has(mod.id)) continue
      lineItems.push({
        id: mod.id,
        labelTr: mod.labelTr,
        labelEn: mod.labelEn,
        monthlyTRY: mod.monthlyPriceTRY,
        monthlyUSD: mod.monthlyPriceUSD,
        type: 'module',
      })
      recurringTRY += mod.monthlyPriceTRY
      recurringUSD += mod.monthlyPriceUSD
    }

    // 3) AI botlar
    let aiBotCount = 0
    for (const modId of aiBotsEnabled) {
      if (!selectedModules.has(modId)) continue
      const mod = getModuleById(modId)
      if (!mod || !mod.hasAiBot) continue
      aiBotCount++
      lineItems.push({
        id: `ai_${modId}`,
        labelTr: `AI: ${mod.labelTr}`,
        labelEn: `AI: ${mod.labelEn}`,
        monthlyTRY: mod.aiBotPriceTRY,
        monthlyUSD: mod.aiBotPriceUSD,
        type: 'ai_bot',
      })
      recurringTRY += mod.aiBotPriceTRY
      recurringUSD += mod.aiBotPriceUSD
    }

    // 4) Ölçeklenebilir birimler
    for (const unit of SCALABLE_UNITS) {
      const qty = scalableQty[unit.id] ?? unit.min
      const extra = Math.max(0, qty - unit.includedQty)
      if (extra > 0) {
        const pTRY = extra * unit.unitPriceTRY
        const pUSD = extra * unit.unitPriceUSD
        lineItems.push({
          id: unit.id,
          labelTr: `${extra} ${unit.labelTr}`,
          labelEn: `${extra} ${unit.labelEn}`,
          monthlyTRY: pTRY,
          monthlyUSD: pUSD,
          type: 'scalable',
        })
        recurringTRY += pTRY
        recurringUSD += pUSD
      }
    }

    // 5) Marketplace
    if (marketplaceBundleEnabled) {
      lineItems.push({
        id: MARKETPLACE_BUNDLE.id,
        labelTr: MARKETPLACE_BUNDLE.labelTr,
        labelEn: MARKETPLACE_BUNDLE.labelEn,
        monthlyTRY: MARKETPLACE_BUNDLE.monthlyPriceTRY,
        monthlyUSD: MARKETPLACE_BUNDLE.monthlyPriceUSD,
        type: 'marketplace',
      })
      recurringTRY += MARKETPLACE_BUNDLE.monthlyPriceTRY
      recurringUSD += MARKETPLACE_BUNDLE.monthlyPriceUSD

      for (const ch of MARKETPLACE_EXTRA_CHANNELS) {
        if (!marketplaceExtraChannels.has(ch.id)) continue
        lineItems.push({
          id: ch.id,
          labelTr: ch.labelTr,
          labelEn: ch.labelEn,
          monthlyTRY: ch.monthlyPriceTRY,
          monthlyUSD: ch.monthlyPriceUSD,
          type: 'marketplace',
        })
        recurringTRY += ch.monthlyPriceTRY
        recurringUSD += ch.monthlyPriceUSD
      }
    }

    // 6) E-fatura kredi paketi (tek seferlik ama aylık gösterimde)
    if (selectedCreditPack) {
      const pack = EINVOICE_CREDIT_PACKS.find((p) => p.id === selectedCreditPack)
      if (pack) {
        lineItems.push({
          id: pack.id,
          labelTr: `e-Fatura ${pack.qty} Kredi`,
          labelEn: `e-Invoice ${pack.qty} Credits`,
          monthlyTRY: pack.priceTRY,
          monthlyUSD: pack.priceUSD,
          type: 'credit_pack',
        })
        oneTimeTRY += pack.priceTRY
        oneTimeUSD += pack.priceUSD
      }
    }

    // Yıllık hesaplama (e-Fatura kredi paketi tek seferliktir; periyoda göre değişmez)
    const yearlyMultiplier = 12 - YEARLY_DISCOUNT_MONTHS
    const subtotalMonthlyTRY = recurringTRY + oneTimeTRY
    const subtotalMonthlyUSD = recurringUSD + oneTimeUSD
    const subtotalYearlyTRY = recurringTRY * 12 + oneTimeTRY
    const subtotalYearlyUSD = recurringUSD * 12 + oneTimeUSD
    const totalYearlyTRY = recurringTRY * yearlyMultiplier + oneTimeTRY
    const totalYearlyUSD = recurringUSD * yearlyMultiplier + oneTimeUSD

    return {
      lineItems,
      subtotalMonthlyTRY,
      subtotalMonthlyUSD,
      subtotalYearlyTRY,
      subtotalYearlyUSD,
      discountMonthsTRY: recurringTRY * YEARLY_DISCOUNT_MONTHS,
      discountMonthsUSD: recurringUSD * YEARLY_DISCOUNT_MONTHS,
      totalMonthlyTRY: subtotalMonthlyTRY,
      totalMonthlyUSD: subtotalMonthlyUSD,
      totalYearlyTRY,
      totalYearlyUSD,
      selectedModuleCount: selectedModules.size,
      aiBotCount,
    }
  }, [selectedModules, aiBotsEnabled, scalableQty, marketplaceBundleEnabled, marketplaceExtraChannels, selectedCreditPack])

  const recommendations = useMemo(() => {
    const recs: Array<{ moduleId: string; reason: string }> = []
    for (const modId of selectedModules) {
      const mod = getModuleById(modId)
      if (!mod?.recommends) continue
      for (const recId of mod.recommends) {
        if (!selectedModules.has(recId)) {
          const recMod = getModuleById(recId)
          if (recMod) {
            recs.push({
              moduleId: recId,
              reason: `${mod.labelTr} ile birlikte önerilir`,
            })
          }
        }
      }
    }
    return recs
  }, [selectedModules])

  return {
    // State
    billingCycle,
    selectedModules,
    aiBotsEnabled,
    scalableQty,
    marketplaceBundleEnabled,
    marketplaceExtraChannels,
    selectedCreditPack,

    // Actions
    setBillingCycle,
    toggleModule,
    toggleAiBot,
    setScalableQuantity,
    toggleMarketplaceBundle,
    toggleExtraChannel,
    setSelectedCreditPack,

    // Computed
    breakdown,
    recommendations,
  }
}
