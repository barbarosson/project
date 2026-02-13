'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenant } from './tenant-context'

export type Currency = 'TRY' | 'USD' | 'EUR' | 'GBP' | 'CHF' | 'CAD' | 'AUD' | 'JPY' | 'SAR' | 'AED'

export const currencySymbols: Record<Currency, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CHF: 'CHF',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  SAR: 'SR',
  AED: 'AED'
}

export const currencyNames: Record<Currency, string> = {
  TRY: 'Turkish Lira',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  CHF: 'Swiss Franc',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  JPY: 'Japanese Yen',
  SAR: 'Saudi Riyal',
  AED: 'UAE Dirham'
}

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => Promise<void>
  formatCurrency: (amount: number) => string
  getCurrencySymbol: () => string
  loading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { tenantId, loading: tenantLoading } = useTenant()
  const [currency, setCurrencyState] = useState<Currency>('USD')
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

      if (data && data.currency) {
        setCurrencyState(data.currency as Currency)
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

  function formatCurrency(amount: number): string {
    const symbol = currencySymbols[currency]

    if (currency === 'TRY') {
      return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${symbol}`
    } else if (currency === 'JPY') {
      return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    } else {
      return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  function getCurrencySymbol(): string {
    return currencySymbols[currency]
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
