'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenant } from './tenant-context'
import { CURRENCY_LIST, CURRENCY_BY_CODE, DEFAULT_CURRENCY_CODE } from '@/lib/currencies'

export type Currency = string

export const currencySymbols: Record<string, string> = Object.fromEntries(
  CURRENCY_LIST.map(c => [c.code, c.symbol])
)
export const currencyNames: Record<string, string> = Object.fromEntries(
  CURRENCY_LIST.map(c => [c.code, c.name])
)

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => Promise<void>
  formatCurrency: (amount: number, currencyCode?: string) => string
  getCurrencySymbol: (currencyCode?: string) => string
  loading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { tenantId, loading: tenantLoading } = useTenant()
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY_CODE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      loadCurrency()
    } else if (!tenantLoading && !tenantId) {
      setLoading(false)
    }
  }, [tenantId, tenantLoading])

  async function loadCurrency() {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('currency')
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (error) throw error

      if (data && data.currency && CURRENCY_BY_CODE[data.currency]) {
        setCurrencyState(data.currency)
      }
    } catch (error) {
      console.error('Error loading currency:', error)
    } finally {
      setLoading(false)
    }
  }

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
        loading
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
