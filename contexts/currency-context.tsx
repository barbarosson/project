'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenant } from './tenant-context'
import { CURRENCY_LIST, CURRENCY_BY_CODE, DEFAULT_CURRENCY_CODE } from '@/lib/currencies'

export type Currency = string
export type TcmbRateType = 'MBDA' | 'MBDS' | 'MEDA' | 'MEDS'

export const currencySymbols: Record<string, string> = Object.fromEntries(
  CURRENCY_LIST.map(c => [c.code, c.symbol])
)
export const currencyNames: Record<string, string> = Object.fromEntries(
  CURRENCY_LIST.map(c => [c.code, c.name])
)

export const TCMB_RATE_TYPE_LABELS: Record<TcmbRateType, { tr: string; en: string }> = {
  MBDA: { tr: 'Döviz Alış (MBDA)', en: 'Forex Buying (MBDA)' },
  MBDS: { tr: 'Döviz Satış (MBDS)', en: 'Forex Selling (MBDS)' },
  MEDA: { tr: 'Efektif Alış (MEDA)', en: 'Banknote Buying (MEDA)' },
  MEDS: { tr: 'Efektif Satış (MEDS)', en: 'Banknote Selling (MEDS)' }
}

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => Promise<void>
  formatCurrency: (amount: number, currencyCode?: string) => string
  getCurrencySymbol: (currencyCode?: string) => string
  loading: boolean
  /** Faturada çevrilmiş tutar gösterilecek para birimleri (tercih para birimi dışında) */
  displayCurrencies: string[]
  /** TCMB kur tipi: MBDA, MBDS, MEDA, MEDS */
  defaultRateType: TcmbRateType
  setDisplayCurrencies: (codes: string[]) => Promise<void>
  setDefaultRateType: (type: TcmbRateType) => Promise<void>
  refreshCompanySettings: () => Promise<void>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { tenantId, loading: tenantLoading } = useTenant()
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY_CODE)
  const [displayCurrencies, setDisplayCurrenciesState] = useState<string[]>([])
  const [defaultRateType, setDefaultRateTypeState] = useState<TcmbRateType>('MBDA')
  const [loading, setLoading] = useState(true)

  const loadCurrency = useCallback(async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('currency, display_currencies, default_rate_type')
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (error) throw error

      if (data) {
        if (data.currency && CURRENCY_BY_CODE[data.currency]) {
          setCurrencyState(data.currency)
        }
        const disp = data.display_currencies
        setDisplayCurrenciesState(Array.isArray(disp) ? disp : [])
        const rtype = data.default_rate_type
        setDefaultRateTypeState(
          rtype === 'MBDS' || rtype === 'MEDA' || rtype === 'MEDS' ? rtype : 'MBDA'
        )
      }
    } catch (error) {
      console.error('Error loading currency:', error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      loadCurrency()
    } else if (!tenantLoading && !tenantId) {
      setLoading(false)
    }
  }, [tenantId, tenantLoading, loadCurrency])

  async function setCurrency(newCurrency: Currency) {
    if (!tenantId) return

    try {
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('company_settings')
          .update({ currency: newCurrency })
          .eq('tenant_id', tenantId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('company_settings')
          .insert({
            tenant_id: tenantId,
            currency: newCurrency,
            company_name: '',
            company_title: '',
            tax_office: '',
            tax_number: '',
            address: '',
            city: '',
            country: '',
            postal_code: '',
            phone: '',
            email: '',
            website: '',
            iban: '',
            bank_name: ''
          })

        if (error) throw error
      }

      setCurrencyState(newCurrency)
    } catch (error) {
      console.error('Error setting currency:', error)
      throw error
    }
  }

  async function setDisplayCurrencies(codes: string[]) {
    if (!tenantId) return
    try {
      const { error } = await supabase
        .from('company_settings')
        .update({ display_currencies: codes })
        .eq('tenant_id', tenantId)
      if (error) throw error
      setDisplayCurrenciesState(codes)
    } catch (error) {
      console.error('Error setting display currencies:', error)
      throw error
    }
  }

  async function setDefaultRateType(type: TcmbRateType) {
    if (!tenantId) return
    try {
      const { error } = await supabase
        .from('company_settings')
        .update({ default_rate_type: type })
        .eq('tenant_id', tenantId)
      if (error) throw error
      setDefaultRateTypeState(type)
    } catch (error) {
      console.error('Error setting default rate type:', error)
      throw error
    }
  }

  function getCurrencySymbol(currencyCode?: string): string {
    const code = currencyCode || currency
    return CURRENCY_BY_CODE[code]?.symbol ?? code
  }

  function formatCurrency(amount: number, currencyCode?: string): string {
    const code = currencyCode || currency
    const symbol = CURRENCY_BY_CODE[code]?.symbol ?? code

    if (code === 'TRY') {
      return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`
    }
    if (code === 'JPY') {
      return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatCurrency,
        getCurrencySymbol,
        loading,
        displayCurrencies,
        defaultRateType,
        setDisplayCurrencies,
        setDefaultRateType,
        refreshCompanySettings: loadCurrency
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
