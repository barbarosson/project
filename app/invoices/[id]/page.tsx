'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Eye, Loader2, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EInvoicePreview } from '@/components/e-invoice-preview'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { convertAmount, getRateForType, type TcmbRatesByCurrency } from '@/lib/tcmb'

interface LineItem {
  id: string
  product_name: string
  description: string
  quantity: number
  unit_price: number
  vat_rate: number
  line_total: number
  vat_amount: number
  total_with_vat: number
}

export type ExchangeRateOverride = { rate?: number; converted_amount?: number }

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  amount: number
  subtotal: number
  total_vat: number
  status: string
  currency?: string
  issue_date: string
  due_date: string
  notes: string
  exchange_rate_overrides?: Record<string, ExchangeRateOverride>
  customers: {
    id: string
    name: string
    company_title: string
    tax_office: string
    tax_number: string
    address: string
  }
}

export default function InvoiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language } = useLanguage()
  const {
    formatCurrency,
    displayCurrencies,
    defaultRateType
  } = useCurrency()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const curr = (invoice?.currency || 'TRY') as string
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showEInvoice, setShowEInvoice] = useState(false)
  const [tcmbRates, setTcmbRates] = useState<TcmbRatesByCurrency | null>(null)
  const [editingOverrideFor, setEditingOverrideFor] = useState<string | null>(null)
  const [overrideRate, setOverrideRate] = useState('')
  const [overrideAmount, setOverrideAmount] = useState('')
  const [savingOverride, setSavingOverride] = useState(false)

  useEffect(() => {
    if (!tenantLoading && tenantId && invoiceId) {
      fetchInvoiceDetails()
    }
  }, [tenantId, tenantLoading, invoiceId])

  useEffect(() => {
    if (!invoice?.issue_date) return
    fetch(`/api/tcmb?date=${invoice.issue_date}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then(setTcmbRates)
      .catch(() => setTcmbRates({}))
  }, [invoice?.issue_date])

  async function fetchInvoiceDetails() {
    if (!tenantId) return

    try {
      const [invoiceRes, lineItemsRes] = await Promise.all([
        supabase
          .from('invoices')
          .select(`
            *,
            customers (
              id,
              name,
              company_title,
              tax_office,
              tax_number,
              address
            )
          `)
          .eq('id', invoiceId)
          .eq('tenant_id', tenantId)
          .single(),
        supabase
          .from('invoice_line_items')
          .select('*')
          .eq('invoice_id', invoiceId)
          .eq('tenant_id', tenantId)
          .order('created_at')
      ])

      if (invoiceRes.error) throw invoiceRes.error

      setInvoice(invoiceRes.data)
      setLineItems(lineItemsRes.data || [])
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  function getConvertedAmount(targetCurrency: string): { value: number; source: 'manual_amount' | 'manual_rate' | 'tcmb' } | null {
    if (!invoice || targetCurrency === curr) return null
    const overrides = invoice.exchange_rate_overrides || {}
    const ov = overrides[targetCurrency]
    if (ov?.converted_amount != null) return { value: ov.converted_amount, source: 'manual_amount' }
    if (ov?.rate != null && ov.rate !== 0) {
      const r = ov.rate
      if (curr === 'TRY') return { value: invoice.amount / r, source: 'manual_rate' }
      if (targetCurrency === 'TRY') return { value: invoice.amount * r, source: 'manual_rate' }
      const tryAmount = invoice.amount * (getRateForType(tcmbRates?.[curr], defaultRateType) ?? 0)
      return { value: tryAmount / r, source: 'manual_rate' }
    }
    if (tcmbRates) {
      const converted = convertAmount(invoice.amount, curr, targetCurrency, tcmbRates, defaultRateType)
      if (converted != null) return { value: converted, source: 'tcmb' }
    }
    return null
  }

  async function saveOverride(targetCurrency: string) {
    if (!invoice || !tenantId) return
    setSavingOverride(true)
    try {
      const overrides = { ...(invoice.exchange_rate_overrides || {}) }
      const rateVal = overrideRate.trim() ? parseFloat(overrideRate.replace(',', '.')) : undefined
      const amountVal = overrideAmount.trim() ? parseFloat(overrideAmount.replace(',', '.')) : undefined
      if (rateVal != null && !isNaN(rateVal)) overrides[targetCurrency] = { ...overrides[targetCurrency], rate: rateVal }
      if (amountVal != null && !isNaN(amountVal)) overrides[targetCurrency] = { ...overrides[targetCurrency], converted_amount: amountVal }
      if (!rateVal && amountVal == null) delete overrides[targetCurrency]
      const { error } = await supabase
        .from('invoices')
        .update({ exchange_rate_overrides: overrides })
        .eq('id', invoice.id)
        .eq('tenant_id', tenantId)
      if (error) throw error
      setInvoice({ ...invoice, exchange_rate_overrides: overrides })
      setEditingOverrideFor(null)
      setOverrideRate('')
      setOverrideAmount('')
      toast.success(language === 'tr' ? 'Kur / tutar kaydedildi' : 'Rate / amount saved')
    } catch (err: any) {
      toast.error(err.message || (language === 'tr' ? 'Kaydedilemedi' : 'Failed to save'))
    } finally {
      setSavingOverride(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-400 text-white',
      sent: 'bg-blue-500 text-white',
      paid: 'bg-[#00D4AA] text-white',
      cancelled: 'bg-red-500 text-white',
      pending: 'bg-orange-500 text-white',
      overdue: 'bg-red-600 text-white'
    }
    return colors[status] || 'bg-gray-400 text-white'
  }

  if (loading || tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">{language === 'tr' ? 'Fatura bulunamadı' : 'Invoice not found'}</p>
          <Button onClick={() => router.push('/invoices')} className="mt-4" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'tr' ? 'Faturalara Geri Dön' : 'Back to Invoices'}
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/invoices')}
              className="shrink-0 bg-white border-[#0A2540]/20 text-[#0A2540] hover:bg-[#0A2540]/5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'tr' ? 'Geri Dön' : 'Back'}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{invoice.invoice_number}</h1>
              <p className="text-gray-500 mt-1">{language === 'tr' ? 'Fatura Detayı' : 'Invoice Details'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowEInvoice(true)}
              className="bg-[#00D4AA] hover:bg-[#00B894]"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview E-Invoice
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <Badge className={getStatusBadge(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-gray-600">Issue Date</div>
                <div className="font-medium">{new Date(invoice.issue_date).toLocaleDateString('tr-TR')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Due Date</div>
                <div className="font-medium">{new Date(invoice.due_date).toLocaleDateString('tr-TR')}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Company</div>
                <div className="font-medium">{invoice.customers.company_title || invoice.customers.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Tax Office</div>
                <div className="font-medium">{invoice.customers.tax_office || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Tax Number</div>
                <div className="font-medium font-mono">{invoice.customers.tax_number || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-semibold">Product/Service</th>
                    <th className="text-right p-2 text-sm font-semibold">Qty</th>
                    <th className="text-right p-2 text-sm font-semibold">Unit Price</th>
                    <th className="text-right p-2 text-sm font-semibold">Subtotal</th>
                    <th className="text-right p-2 text-sm font-semibold">VAT</th>
                    <th className="text-right p-2 text-sm font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">
                        <div className="font-medium">{item.product_name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500">{item.description}</div>
                        )}
                      </td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-right">{formatCurrency(item.unit_price, curr)}</td>
                      <td className="p-2 text-right">{formatCurrency(item.line_total, curr)}</td>
                      <td className="p-2 text-right">
                        {formatCurrency(item.vat_amount, curr)}
                        <span className="text-xs text-gray-500 ml-1">({item.vat_rate}%)</span>
                      </td>
                      <td className="p-2 text-right font-semibold">{formatCurrency(item.total_with_vat, curr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(invoice.subtotal, curr)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Total VAT:</span>
                  <span className="font-semibold">{formatCurrency(invoice.total_vat, curr)}</span>
                </div>
                <div className="flex justify-between py-3 bg-[#00D4AA] text-white px-4 rounded-lg">
                  <span className="font-bold text-lg">Grand Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(invoice.amount, curr)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {displayCurrencies.length > 0 && displayCurrencies.filter((c) => c !== curr).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'tr' ? 'Çevrilmiş tutarlar' : 'Converted amounts'}
              </CardTitle>
              <p className="text-sm text-gray-500 font-normal">
                {language === 'tr'
                  ? `Fatura tarihi (${new Date(invoice.issue_date).toLocaleDateString('tr-TR')}) TCMB kuru (${defaultRateType}). Manuel kur veya tutar girebilirsiniz.`
                  : `Invoice date (${new Date(invoice.issue_date).toLocaleDateString()}) TCMB rate (${defaultRateType}). You can enter manual rate or amount.`}
                {(!tcmbRates || Object.keys(tcmbRates).length === 0) && (
                  <span className="block mt-1 text-amber-600">
                    {language === 'tr'
                      ? 'TCMB kurları yüklenemedi veya bu tarih için yayım yok. Kur sütunundan manuel girebilirsiniz.'
                      : 'TCMB rates could not be loaded for this date. You can enter the rate manually in the rate column.'}
                  </span>
                )}
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500 font-medium">
                      <th className="py-2 pr-4">{language === 'tr' ? 'Para birimi' : 'Currency'}</th>
                      <th className="py-2 pr-4">{language === 'tr' ? 'Kur (1 birim = TRY)' : 'Rate (1 unit = TRY)'}</th>
                      <th className="py-2 pr-4">{language === 'tr' ? 'Çevrilmiş tutar' : 'Converted amount'}</th>
                      <th className="py-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {displayCurrencies
                      .filter((c) => c !== curr)
                      .map((targetCurrency) => {
                        const result = getConvertedAmount(targetCurrency)
                        const isEditing = editingOverrideFor === targetCurrency
                        const override = (invoice.exchange_rate_overrides || {})[targetCurrency]
                        const rateDisplay =
                          override?.rate != null && override.rate !== 0
                            ? override.rate
                            : targetCurrency === 'TRY'
                              ? getRateForType(tcmbRates?.[curr], defaultRateType)
                              : getRateForType(tcmbRates?.[targetCurrency], defaultRateType)
                        const rateLabel =
                          targetCurrency === 'TRY'
                            ? `1 ${curr} = ${rateDisplay != null ? rateDisplay.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '–'} TRY`
                            : `1 ${targetCurrency} = ${rateDisplay != null ? rateDisplay.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '–'} TRY`
                        return (
                          <tr key={targetCurrency} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{targetCurrency}</td>
                            <td className="py-2 pr-4">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs whitespace-nowrap sr-only">
                                    {targetCurrency === 'TRY' ? `1 ${curr} = ? TRY` : `1 ${targetCurrency} = ? TRY`}
                                  </Label>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder={override?.rate?.toString() || ''}
                                    value={overrideRate}
                                    onChange={(e) => setOverrideRate(e.target.value)}
                                    className="w-28 h-8"
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-700">{rateLabel}</span>
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs whitespace-nowrap sr-only">{language === 'tr' ? 'Çevrilmiş tutar' : 'Converted amount'}</Label>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder={override?.converted_amount?.toString() || ''}
                                    value={overrideAmount}
                                    onChange={(e) => setOverrideAmount(e.target.value)}
                                    className="w-28 h-8"
                                  />
                                </div>
                              ) : result != null ? (
                                <span className="font-semibold">{formatCurrency(result.value, targetCurrency)}</span>
                              ) : (
                                <span className="text-gray-400">–</span>
                              )}
                            </td>
                            <td className="py-2">
                              {isEditing ? (
                                <>
                                  <Button size="sm" onClick={() => saveOverride(targetCurrency)} disabled={savingOverride} className="mr-1">
                                    {language === 'tr' ? 'Kaydet' : 'Save'}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => { setEditingOverrideFor(null); setOverrideRate(''); setOverrideAmount('') }}>
                                    {language === 'tr' ? 'İptal' : 'Cancel'}
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-1"
                                  onClick={() => {
                                    setEditingOverrideFor(targetCurrency)
                                    setOverrideRate(override?.rate?.toString() ?? '')
                                    setOverrideAmount(override?.converted_amount?.toString() ?? '')
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {invoice && (
        <EInvoicePreview
          isOpen={showEInvoice}
          onClose={() => setShowEInvoice(false)}
          invoice={invoice}
          customer={invoice.customers}
          lineItems={lineItems}
        />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
