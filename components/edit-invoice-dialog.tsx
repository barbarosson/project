'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { CURRENCY_LIST, getCurrencyLabel } from '@/lib/currencies'
import { convertAmount, getRateForType, type TcmbRatesByCurrency } from '@/lib/tcmb'
import { Plus, Trash2, Loader2 } from 'lucide-react'

interface Invoice {
  id: string
  customer_id: string
  invoice_number: string
  issue_date?: string
  due_date: string
  subtotal: number
  total_vat: number
  amount: number
  status: string
  invoice_type?: string
  currency?: string
  notes: string
}

interface EditInvoiceDialogProps {
  invoice: Invoice | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface LineItem {
  id: string
  product_id: string
  product_name: string
  description: string
  quantity: number
  unit_price: number
  vat_rate: number
  line_total: number
  vat_amount: number
  total_with_vat: number
}

export function EditInvoiceDialog({ invoice, isOpen, onClose, onSuccess }: EditInvoiceDialogProps) {
  const { tenantId } = useTenant()
  const { t, language } = useLanguage()
  const { formatCurrency, displayCurrencies, defaultRateType } = useCurrency()
  const [tcmbRates, setTcmbRates] = useState<TcmbRatesByCurrency | null>(null)
  const [loading, setLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [formKey, setFormKey] = useState(0)
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [originalLineItems, setOriginalLineItems] = useState<LineItem[]>([])
  const [formData, setFormData] = useState({
    customer_id: '',
    issue_date: '',
    due_date: '',
    tax_rate: '20',
    status: 'draft',
    invoice_type: 'sale',
    currency: 'TRY',
    notes: ''
  })

  const lastProcessedInvoiceId = useRef<string | null>(null)
  const dataLoadStarted = useRef(false)

  useEffect(() => {
    if (isOpen && formData.issue_date) {
      fetch(`/api/tcmb?date=${formData.issue_date}`)
        .then((res) => (res.ok ? res.json() : {}))
        .then(setTcmbRates)
        .catch(() => setTcmbRates({}))
    } else if (!isOpen) setTcmbRates(null)
  }, [isOpen, formData.issue_date])

  useEffect(() => {
    if (!isOpen) {
      console.log('EditInvoiceDialog - Dialog closed, full reset')
      setFormData({
        customer_id: '',
        issue_date: '',
        due_date: '',
        tax_rate: '20',
        status: 'draft',
        invoice_type: 'sale',
        currency: 'TRY',
        notes: ''
      })
      setLineItems([])
      setOriginalLineItems([])
      setCustomers([])
      setProducts([])
      setIsInitializing(true)
      setFormKey(0)
      lastProcessedInvoiceId.current = null
      dataLoadStarted.current = false
    }
  }, [isOpen])

  useEffect(() => {
    const loadAllData = async () => {
      if (!isOpen || !invoice || !tenantId) return
      if (invoice.id === lastProcessedInvoiceId.current) return
      if (dataLoadStarted.current) return

      console.log('EditInvoiceDialog - Starting data load for invoice:', invoice.id)
      dataLoadStarted.current = true
      setIsInitializing(true)
      lastProcessedInvoiceId.current = invoice.id

      try {
        const [customersData, productsData, lineItemsData] = await Promise.all([
          fetchCustomersData(),
          fetchProductsData(),
          fetchLineItemsData(invoice.id)
        ])

        console.log('EditInvoiceDialog - All data loaded:', {
          customersCount: customersData.length,
          productsCount: productsData.length,
          lineItemsCount: lineItemsData.length
        })

        setCustomers(customersData)
        setProducts(productsData)
        setLineItems(lineItemsData)
        setOriginalLineItems(JSON.parse(JSON.stringify(lineItemsData)))

        const today = new Date().toISOString().split('T')[0]
        const issueDate = invoice.issue_date
        const initialFormData = {
          customer_id: invoice.customer_id || '',
          issue_date: issueDate ? issueDate.split('T')[0] : today,
          due_date: invoice.due_date ? invoice.due_date.split('T')[0] : today,
          tax_rate: '20',
          status: invoice.status || 'draft',
          invoice_type: invoice.invoice_type || 'sale',
          currency: invoice.currency || 'TRY',
          notes: invoice.notes || ''
        }

        console.log('EditInvoiceDialog - Setting initial form data:', initialFormData)
        setFormData(initialFormData)

        setFormKey(prev => prev + 1)
        setIsInitializing(false)

        console.log('FORM_READY: Rendering form with key', formKey + 1, 'and Customer ID', initialFormData.customer_id)
      } catch (error) {
        console.error('EditInvoiceDialog - Error loading data:', error)
        toast.error(t.invoices.failedToLoadInvoiceData)
        setIsInitializing(false)
      } finally {
        dataLoadStarted.current = false
      }
    }

    loadAllData()
  }, [isOpen, invoice?.id, tenantId])

  async function fetchCustomersData(): Promise<any[]> {
    if (!tenantId) return []
    console.log('EditInvoiceDialog - Fetching customers for tenant:', tenantId)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('company_title')
    console.log('EditInvoiceDialog - Customers loaded:', data?.length, 'items, error:', error)
    return data || []
  }

  async function fetchProductsData(): Promise<any[]> {
    if (!tenantId) return []
    console.log('EditInvoiceDialog - Fetching products for tenant:', tenantId)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('name')
    console.log('EditInvoiceDialog - Products loaded:', data?.length, 'items, error:', error)
    return data || []
  }

  async function fetchLineItemsData(invoiceId: string): Promise<LineItem[]> {
    if (!tenantId) return []
    console.log('EditInvoiceDialog - Fetching line items for invoice:', invoiceId, 'tenant:', tenantId)
    const { data, error } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('tenant_id', tenantId)

    console.log('EditInvoiceDialog - Line items loaded:', data?.length, 'items, error:', error)

    if (data) {
      const normalizedData = data.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || '',
        description: item.description || '',
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        vat_rate: [0, 1, 10, 20].includes(Number(item.vat_rate)) ? Number(item.vat_rate) : 20,
        line_total: item.line_total || 0,
        vat_amount: item.vat_amount || 0,
        total_with_vat: item.total_with_vat || 0
      }))
      return normalizedData
    }
    return []
  }

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        product_id: '',
        product_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        vat_rate: parseInt(formData.tax_rate || '20', 10),
        line_total: 0,
        vat_amount: 0,
        total_with_vat: 0
      }
    ])
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'product_id') {
          const product = products.find(p => p.id === value)
          if (product) {
            updated.unit_price = product.sale_price
            updated.product_name = product.name
          }
        }

        if (field === 'quantity' || field === 'unit_price' || field === 'vat_rate' || field === 'product_id') {
          updated.line_total = updated.quantity * updated.unit_price
          updated.vat_amount = updated.line_total * (updated.vat_rate / 100)
          updated.total_with_vat = updated.line_total + updated.vat_amount
        }
        return updated
      }
      return item
    }))
  }

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.line_total || 0), 0)
    const taxAmount = lineItems.reduce((sum, item) => sum + (item.vat_amount || 0), 0)
    const total = lineItems.reduce((sum, item) => sum + (item.total_with_vat || 0), 0)
    return { subtotal, taxAmount, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!invoice) return

    const validItems = lineItems.filter(item => item.product_id && item.quantity > 0)
    if (validItems.length === 0) {
      toast.error(t.invoices.addAtLeastOneItem)
      return
    }

    setLoading(true)

    try {
      if (!tenantId) {
        throw new Error(t.invoices.noTenantId)
      }

      const { subtotal, taxAmount, total } = calculateTotals()

      const oldTotal = invoice.amount

      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          customer_id: formData.customer_id,
          issue_date: formData.issue_date,
          due_date: formData.due_date,
          subtotal,
          total_vat: taxAmount,
          amount: total,
          status: formData.status,
          invoice_type: formData.invoice_type,
          currency: formData.currency || 'TRY',
          notes: formData.notes,
          tenant_id: tenantId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id)

      if (invoiceError) throw invoiceError

      await supabase.from('invoice_line_items').delete().eq('invoice_id', invoice.id)

      const lineItemsData = validItems.map(item => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        product_name: item.product_name || '',
        description: item.description || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate || 20,
        line_total: item.line_total || 0,
        vat_amount: item.vat_amount || 0,
        total_with_vat: item.total_with_vat || 0,
        tenant_id: tenantId,
      }))

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsData)

      if (lineItemsError) throw lineItemsError

      for (const item of validItems) {
        const originalItem = originalLineItems.find(oi => oi.product_id === item.product_id)
        const quantityDiff = originalItem ? item.quantity - originalItem.quantity : item.quantity

        if (quantityDiff !== 0) {
          const { data: inventory } = await supabase
            .from('inventory')
            .select('stock_quantity')
            .eq('product_id', item.product_id)
            .single()

          if (inventory) {
            await supabase
              .from('inventory')
              .update({ stock_quantity: inventory.stock_quantity - quantityDiff })
              .eq('product_id', item.product_id)

            await supabase.from('stock_movements').insert({
              product_id: item.product_id,
              movement_type: 'out',
              quantity: Math.abs(quantityDiff),
              reference_type: 'invoice',
              reference_id: invoice.id,
              notes: t.invoices.invoiceStockMovementNote.replace('{number}', invoice.invoice_number),
              tenant_id: tenantId,
            })
          }
        }
      }

      const balanceChange = total - oldTotal
      if (balanceChange !== 0) {
        const { data: customer } = await supabase
          .from('customers')
          .select('balance')
          .eq('id', formData.customer_id)
          .single()

        if (customer) {
          await supabase
            .from('customers')
            .update({ balance: (customer.balance || 0) + balanceChange })
            .eq('id', formData.customer_id)
        }
      }

      toast.success(t.invoices.invoiceUpdatedSuccessfully)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating invoice:', error)
      toast.error(error.message || t.invoices.failedToLoadInvoiceData)
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  console.log('EditInvoiceDialog - Render state:', {
    isInitializing,
    formKey,
    formData,
    customersCount: customers.length,
    productsCount: products.length,
    lineItemsCount: lineItems.length
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.invoices.editInvoice}</DialogTitle>
          <DialogDescription>
            {t.invoices.updateInvoiceDetails}
          </DialogDescription>
        </DialogHeader>

        {isInitializing ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">{t.invoices.loadingInvoiceData}</span>
          </div>
        ) : (
          <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.invoices.customer} *</Label>
              <Select
                value={formData.customer_id || undefined}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
              >
                <SelectTrigger data-field="edit-invoice-customer">
                  <SelectValue placeholder={t.invoices.selectCustomer} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => {
                    const title = customer.company_title || customer.name
                    const isSub = customer.branch_type && customer.branch_type !== 'main'
                    const branchLabels: Record<string, string> = { branch: 'Şube', warehouse: 'Depo', department: 'Departman', center: 'Merkez' }
                    const subLabel = isSub ? (customer.branch_code ? ` (${customer.branch_code})` : ` (${branchLabels[customer.branch_type] || customer.branch_type})`) : ''
                    return (
                      <SelectItem key={customer.id} value={customer.id}>
                        {title}{subLabel}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === 'tr' ? 'Fatura Tipi' : 'Invoice Type'}</Label>
              <Select
                value={formData.invoice_type || 'sale'}
                onValueChange={(value) => setFormData({ ...formData, invoice_type: value })}
              >
                <SelectTrigger data-field="edit-invoice-type">
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

            <div className="space-y-2">
              <Label>{language === 'tr' ? 'Para Birimi' : 'Currency'}</Label>
              <Select
                value={formData.currency || 'TRY'}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger data-field="edit-invoice-currency">
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

            <div className="space-y-2">
              <Label>{t.common.status}</Label>
              <Select
                value={formData.status || undefined}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger data-field="edit-invoice-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t.common.draft}</SelectItem>
                  <SelectItem value="sent">{t.common.sent}</SelectItem>
                  <SelectItem value="cancelled">{t.common.cancelled}</SelectItem>
                </SelectContent>
              </Select>
              {['paid', 'overdue'].includes(formData.status) && (
                <p className="text-xs text-muted-foreground">
                  {t.invoices.statusSystemManaged.replace('{status}', formData.status)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.invoices.invoiceDate} *</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                required
                data-field="edit-invoice-issue-date"
              />
            </div>

            <div className="space-y-2">
              <Label>{t.invoices.dueDate} *</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
                data-field="edit-invoice-due-date"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'tr' ? 'Vergi kodu / KDV oranı' : 'Tax code / VAT rate'}</Label>
              <Select
                value={formData.tax_rate || '20'}
                onValueChange={(value) => setFormData({ ...formData, tax_rate: value })}
              >
                <SelectTrigger data-field="edit-invoice-vat-rate">
                  <SelectValue placeholder={language === 'tr' ? 'KDV oranı seçin' : 'Select VAT rate'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="1">1%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {language === 'tr' ? 'Yeni eklenen kalemler için varsayılan KDV oranı. Her satırda ayrıca KDV seçebilirsiniz.' : 'Default VAT rate for new line items. You can also set VAT per line below.'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.invoices.lineItems}</Label>
            <div className="border rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground pb-1">
                <span>{t.invoices.selectProduct}</span>
                <span>{t.invoices.quantity}</span>
                <span>{t.invoices.unitPrice}</span>
                <span>{language === 'tr' ? 'KDV' : 'VAT'}</span>
                <span>{t.invoices.total}</span>
                <span />
              </div>
              {lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center">
                  <Select
                    value={item.product_id || undefined}
                    onValueChange={(value) => updateLineItem(item.id, 'product_id', value)}
                  >
                    <SelectTrigger data-field="edit-invoice-line-product">
                      <SelectValue placeholder={t.invoices.selectProduct} />
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
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value))}
                    placeholder={t.invoices.quantity}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value))}
                    placeholder={t.invoices.unitPrice}
                  />
                  <Select
                    value={String([0, 1, 10, 20].includes(item.vat_rate) ? item.vat_rate : 20)}
                    onValueChange={(value) => updateLineItem(item.id, 'vat_rate', parseInt(value, 10))}
                  >
                    <SelectTrigger className="w-full" data-field="edit-invoice-line-vat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="1">1%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={(item.total_with_vat || 0).toFixed(2)} readOnly placeholder={t.invoices.total} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addLineItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t.invoices.addLineItem}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.invoices.notes}</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>{t.invoices.subtotal}:</span>
              <span className="font-medium">{formatCurrency(subtotal, formData.currency || 'TRY')}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.invoices.tax} ({formData.tax_rate}%):</span>
              <span className="font-medium">{formatCurrency(taxAmount, formData.currency || 'TRY')}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>{t.invoices.total}:</span>
              <span>{formatCurrency(total, formData.currency || 'TRY')}</span>
            </div>
            {displayCurrencies.length > 0 &&
              displayCurrencies.filter((c) => c !== (formData.currency || 'TRY')).length > 0 && (
                <div className="pt-2 mt-2 border-t space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    {language === 'tr' ? 'Çevrilmiş tutarlar' : 'Converted amounts'}
                  </div>
                  {displayCurrencies
                    .filter((c) => c !== (formData.currency || 'TRY'))
                    .map((targetCode) => {
                      const curr = formData.currency || 'TRY'
                      const rate = tcmbRates && getRateForType(tcmbRates[targetCode], defaultRateType)
                      const converted = tcmbRates ? convertAmount(total, curr, targetCode, tcmbRates, defaultRateType) : null
                      return (
                        <div key={targetCode} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                          <span className="font-medium w-10">{targetCode}</span>
                          <span className="text-muted-foreground">
                            {language === 'tr' ? 'Kur:' : 'Rate:'} 1 {targetCode} = {rate != null ? rate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '–'} TRY
                          </span>
                          <span className="font-semibold">
                            {converted != null ? formatCurrency(converted, targetCode) : '–'}
                          </span>
                        </div>
                      )
                    })}
                </div>
              )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t.invoices.updating : t.invoices.updateInvoice}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
