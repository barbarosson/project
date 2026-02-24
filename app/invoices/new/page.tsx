'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Save, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { CURRENCY_LIST, getCurrencyLabel } from '@/lib/currencies'
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
  product_id?: string
}

interface Customer {
  id: string
  name: string
  company_title: string
  payment_terms?: number
  payment_terms_type?: string
}

interface Product {
  id: string
  name: string
  sale_price: number
  vat_rate: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language } = useLanguage()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [projectsList, setProjectsList] = useState<{ id: string; name: string; code: string }[]>([])
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState<string>('')
  const [invoiceType, setInvoiceType] = useState<string>('sale')
  const { currency: companyCurrency, formatCurrency, displayCurrencies, defaultRateType } = useCurrency()
  const [currency, setCurrency] = useState<string>('TRY')
  const [tcmbRates, setTcmbRates] = useState<TcmbRatesByCurrency | null>(null)

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      product_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      vat_rate: 20,
      line_total: 0,
      vat_amount: 0,
      total_with_vat: 0
    }
  ])

  useEffect(() => {
    if (companyCurrency) setCurrency(companyCurrency)
  }, [companyCurrency])

  useEffect(() => {
    fetch(`/api/tcmb?date=${issueDate}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then(setTcmbRates)
      .catch(() => setTcmbRates({}))
  }, [issueDate])

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchData()
    }
  }, [tenantId, tenantLoading])

  async function fetchData() {
    if (!tenantId) return

    try {
      const [customersRes, productsRes, projectsRes] = await Promise.all([
        supabase.from('customers').select('id, name, company_title, payment_terms, payment_terms_type').eq('tenant_id', tenantId).eq('status', 'active').order('name'),
        supabase.from('products').select('id, name, sale_price, vat_rate').eq('tenant_id', tenantId).eq('status', 'active').order('name'),
        supabase.from('projects').select('id, name, code').eq('tenant_id', tenantId).in('status', ['planning', 'active']).order('name')
      ])

      setCustomers(customersRes.data || [])
      setProducts(productsRes.data || [])
      setProjectsList(projectsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId)
      if (customer && customer.payment_terms && customer.payment_terms > 0) {
        const issueDateObj = new Date(issueDate)
        const dueDateObj = new Date(issueDateObj)
        dueDateObj.setDate(dueDateObj.getDate() + customer.payment_terms)
        setDueDate(dueDateObj.toISOString().split('T')[0])
      }
    }
  }, [selectedCustomerId, issueDate, customers])

  function calculateLineItem(item: LineItem): LineItem {
    const line_total = item.quantity * item.unit_price
    const vat_amount = line_total * (item.vat_rate / 100)
    const total_with_vat = line_total + vat_amount

    return {
      ...item,
      line_total: Math.round(line_total * 100) / 100,
      vat_amount: Math.round(vat_amount * 100) / 100,
      total_with_vat: Math.round(total_with_vat * 100) / 100
    }
  }

  function updateLineItem(index: number, field: keyof LineItem, value: any) {
    const newItems = [...lineItems]
    newItems[index] = { ...newItems[index], [field]: value }
    newItems[index] = calculateLineItem(newItems[index])
    setLineItems(newItems)
  }

  function addLineItem() {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        product_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        vat_rate: 20,
        line_total: 0,
        vat_amount: 0,
        total_with_vat: 0
      }
    ])
  }

  function removeLineItem(index: number) {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  function selectProduct(index: number, productId: string) {
    const product = products.find(p => p.id === productId)
    if (product) {
      const newItems = [...lineItems]
      newItems[index] = {
        ...newItems[index],
        product_name: product.name,
        unit_price: product.sale_price,
        vat_rate: product.vat_rate,
        product_id: productId
      }
      newItems[index] = calculateLineItem(newItems[index])
      setLineItems(newItems)
    }
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0)
  const totalVat = lineItems.reduce((sum, item) => sum + item.vat_amount, 0)
  const grandTotal = lineItems.reduce((sum, item) => sum + item.total_with_vat, 0)

  async function saveInvoice() {
    if (!tenantId) return

    if (!selectedCustomerId) {
      toast.error('Please select a customer')
      return
    }

    if (lineItems.some(item => !item.product_name)) {
      toast.error('Please fill in all product names')
      return
    }

    setLoading(true)

    try {
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([
          {
            tenant_id: tenantId,
            customer_id: selectedCustomerId,
            invoice_number: invoiceNumber,
            amount: grandTotal,
            subtotal: subtotal,
            total_vat: totalVat,
            status: 'draft',
            invoice_type: invoiceType,
            currency: currency || companyCurrency || 'TRY',
            issue_date: issueDate,
            due_date: dueDate,
            notes: notes,
            project_id: selectedProjectId || null
          }
        ])
        .select()
        .single()

      if (invoiceError) throw invoiceError

      const lineItemsToInsert = lineItems.map(item => ({
        tenant_id: tenantId,
        invoice_id: invoice.id,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        line_total: item.line_total,
        vat_amount: item.vat_amount,
        total_with_vat: item.total_with_vat,
        product_id: item.product_id || null
      }))

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsToInsert)

      if (lineItemsError) throw lineItemsError

      for (const item of lineItems) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('current_stock, critical_level, total_sold')
            .eq('id', item.product_id)
            .eq('tenant_id', tenantId)
            .single()

          if (product) {
            const newStock = Number(product.current_stock) - item.quantity
            const newTotalSold = Number(product.total_sold || 0) + item.quantity

            let stockStatus = 'in_stock'
            if (newStock === 0) {
              stockStatus = 'out_of_stock'
            } else if (newStock <= Number(product.critical_level)) {
              stockStatus = 'low_stock'
            }

            await supabase
              .from('products')
              .update({
                current_stock: newStock,
                total_sold: newTotalSold,
                stock_status: stockStatus
              })
              .eq('id', item.product_id)
              .eq('tenant_id', tenantId)

            await supabase
              .from('stock_movements')
              .insert({
                tenant_id: tenantId,
                product_id: item.product_id,
                movement_type: 'out',
                quantity: item.quantity,
                reason: `Invoice ${invoiceNumber}`,
                reference_id: invoice.id,
                reference_type: 'invoice'
              })
          }
        }
      }

      toast.success('Invoice created successfully!')
      router.push('/invoices')
    } catch (error: any) {
      console.error('Error creating invoice:', error)
      toast.error(error.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Invoice</h1>
            <p className="text-gray-500 mt-1">Build a professional invoice with line items</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/invoices')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={saveInvoice}
              disabled={loading}
              className="bg-[#00D4AA] hover:bg-[#00B894]"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Invoice'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2" data-field="new-invoice-customer" data-testid="new-invoice-customer">
                <Label htmlFor="customer" data-field="new-invoice-customer-label" className="cursor-text select-text">Customer *</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger id="customer" data-field="new-invoice-customer" data-testid="new-invoice-customer-trigger">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company_title || customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2" data-field="new-invoice-type" data-testid="new-invoice-type">
                <Label htmlFor="invoice_type" data-field="new-invoice-type-label" className="cursor-text select-text">{language === 'tr' ? 'Fatura Tipi' : 'Invoice Type'}</Label>
                <Select value={invoiceType} onValueChange={setInvoiceType}>
                  <SelectTrigger id="invoice_type" data-field="new-invoice-type" data-testid="new-invoice-type-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">{language === 'tr' ? 'Satış' : 'Sale'}</SelectItem>
                    <SelectItem value="sale_return">{language === 'tr' ? 'Satıştan İade' : 'Sale Return'}</SelectItem>
                    <SelectItem value="devir">{language === 'tr' ? 'Devir' : 'Carry Forward'}</SelectItem>
                    <SelectItem value="devir_return">{language === 'tr' ? 'Devir İade' : 'Carry Fwd Return'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2" data-field="new-invoice-currency" data-testid="new-invoice-currency">
                <Label htmlFor="currency" data-field="new-invoice-currency-label" className="cursor-text select-text">{language === 'tr' ? 'Para Birimi' : 'Currency'}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" data-field="new-invoice-currency" data-testid="new-invoice-currency-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_LIST.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {getCurrencyLabel(c, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2" data-field="new-invoice-issue-date" data-testid="new-invoice-issue-date">
                <Label htmlFor="issue_date" data-field="new-invoice-issue-date-label" className="cursor-text select-text">{language === 'tr' ? 'Düzenleme Tarihi' : 'Issue Date'}</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  data-field="new-invoice-issue-date"
                  data-testid="new-invoice-issue-date-input"
                />
              </div>

              <div className="space-y-2" data-field="new-invoice-due-date" data-testid="new-invoice-due-date">
                <Label htmlFor="due_date" data-field="new-invoice-due-date-label" className="cursor-text select-text">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  data-field="new-invoice-due-date"
                  data-testid="new-invoice-due-date-input"
                />
              </div>
            </div>

            {projectsList.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={selectedProjectId || 'none'} onValueChange={v => setSelectedProjectId(v === 'none' ? '' : v)}>
                  <SelectTrigger id="project" data-field="new-invoice-project">
                    <SelectValue placeholder="Select project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projectsList.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code ? `[${p.code}] ` : ''}{p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button
              onClick={addLineItem}
              size="sm"
              className="bg-[#00D4AA] hover:bg-[#00B894]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-semibold">Product/Service</th>
                    <th className="text-left p-2 text-sm font-semibold">Description</th>
                    <th className="text-right p-2 text-sm font-semibold w-24">Qty</th>
                    <th className="text-right p-2 text-sm font-semibold w-32">Unit Price</th>
                    <th className="text-right p-2 text-sm font-semibold w-24">VAT %</th>
                    <th className="text-right p-2 text-sm font-semibold w-32">Total</th>
                    {currency !== companyCurrency && (
                      <th className="text-right p-2 text-sm font-semibold w-32">
                        {language === 'tr' ? `Çevrilmiş (${companyCurrency})` : `Converted (${companyCurrency})`}
                      </th>
                    )}
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">
                        <Select
                          value={item.product_id || ''}
                          onValueChange={(value) => selectProduct(index, value)}
                        >
                          <SelectTrigger className="w-full" data-field={`line-item-${index}-product`}>
                            <SelectValue placeholder="Select or type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={item.product_name}
                          onChange={(e) => updateLineItem(index, 'product_name', e.target.value)}
                          placeholder="Or type custom name"
                          className="mt-1"
                          data-field={`line-item-${index}-product-name`}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder="Optional"
                          data-field={`line-item-${index}-description`}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="text-right"
                          data-field={`line-item-${index}-quantity`}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="text-right"
                          data-field={`line-item-${index}-unit-price`}
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          value={item.vat_rate.toString()}
                          onValueChange={(value) => updateLineItem(index, 'vat_rate', parseFloat(value))}
                        >
                          <SelectTrigger data-field={`line-item-${index}-vat`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="1">1%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 text-right font-semibold">
                        {formatCurrency(item.total_with_vat, currency)}
                      </td>
                      {currency !== companyCurrency && (
                        <td className="p-2 text-right text-muted-foreground text-sm">
                          {tcmbRates
                            ? (() => {
                                const conv = convertAmount(item.total_with_vat, currency, companyCurrency, tcmbRates, defaultRateType)
                                return conv != null ? formatCurrency(conv, companyCurrency) : '–'
                              })()
                            : '–'}
                        </td>
                      )}
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Total VAT:</span>
                  <span className="font-semibold">{formatCurrency(totalVat, currency)}</span>
                </div>
                <div className="flex justify-between py-3 bg-[#00D4AA] text-white px-4 rounded-lg">
                  <span className="font-bold text-lg">Grand Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(grandTotal, currency)}</span>
                </div>
                {currency !== companyCurrency && (
                  <div className="pt-3 mt-3 border-t border-white/30 space-y-2">
                    <div className="text-xs font-medium text-white/90">
                      {language === 'tr' ? `Çevrilmiş tutar (tercih: ${companyCurrency})` : `Converted amount (preference: ${companyCurrency})`}
                    </div>
                    {(() => {
                      const targetCode = companyCurrency
                      const rateFrom = tcmbRates && getRateForType(tcmbRates[currency], defaultRateType)
                      const rateTo = targetCode === 'TRY' ? null : tcmbRates && getRateForType(tcmbRates[targetCode], defaultRateType)
                      const rateDisplay =
                        rateFrom != null && rateTo != null
                          ? targetCode === 'TRY'
                            ? rateTo
                            : rateFrom
                          : null
                      const converted = tcmbRates ? convertAmount(grandTotal, currency, targetCode, tcmbRates, defaultRateType) : null
                      const rateLabel = `1 ${currency} = ${rateDisplay != null ? rateDisplay.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '–'} ${targetCode}`
                      return (
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm text-white/95">
                          <span className="font-medium w-10">{targetCode}</span>
                          <span className="text-white/80">
                            {language === 'tr' ? 'Kur:' : 'Rate:'} {rateLabel}
                          </span>
                          <span className="font-semibold">
                            {converted != null ? formatCurrency(converted, targetCode) : '–'}
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or terms..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      <Toaster />
    </DashboardLayout>
  )
}
