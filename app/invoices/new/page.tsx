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
import { Plus, Trash2, Save, Eye, Send, Loader2, Search, X, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { sendEInvoiceFromInvoiceId } from '@/lib/send-einvoice-from-invoice'
import { TevkifatReasonSendDialog } from '@/components/edocuments/tevkifat-reason-send-dialog'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { CURRENCY_LIST, getCurrencyLabel } from '@/lib/currencies'
import { convertAmount, getRateForType, type TcmbRatesByCurrency } from '@/lib/tcmb'
import { EXPORT_CODES, TEVKIFAT_CODES, TEVKIFAT_RATIOS, getTevkifatPercent, getTevkifatCodesByRatio, getTevkifatRatioFromCode } from '@/lib/invoice-line-codes'

const LINE_UNITS = [
  { value: 'adet', labelTr: 'Adet', labelEn: 'Piece' },
  { value: 'kg', labelTr: 'Kg', labelEn: 'Kg' },
  { value: 'm', labelTr: 'm', labelEn: 'm' },
  { value: 'm2', labelTr: 'm²', labelEn: 'm²' },
  { value: 'saat', labelTr: 'Saat', labelEn: 'Hour' },
  { value: 'gün', labelTr: 'Gün', labelEn: 'Day' },
]

interface LineItem {
  id: string
  product_name: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
  line_total: number
  vat_amount: number
  total_with_vat: number
  product_id?: string
  withholding_ratio?: string | null
  withholding_amount?: number
  discount?: number
  discount_type?: 'percent' | 'amount'
  otv?: number
  otv_type?: 'percent' | 'amount'
  oiv?: number
  oiv_type?: 'percent' | 'amount'
  accommodation_tax?: number
  accommodation_tax_type?: 'percent' | 'amount'
  export_code?: string | null
  withholding_reason_code?: string | null
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
  const { language, t } = useLanguage()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [selectedSubBranchId, setSelectedSubBranchId] = useState<string | null>(null)
  const [subBranches, setSubBranches] = useState<{ id: string; company_title: string; name?: string; payment_terms?: number; payment_terms_type?: string; branch_code?: string }[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [projectsList, setProjectsList] = useState<{ id: string; name: string; code: string }[]>([])
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState<string>('')
  const [invoiceType, setInvoiceType] = useState<string>('sale')
  const [staffId, setStaffId] = useState<string>('')
  const [staffList, setStaffList] = useState<{ id: string; name: string; last_name?: string | null; department?: string | null; position?: string | null }[]>([])
  const { currency: companyCurrency, formatCurrency, displayCurrencies, defaultRateType } = useCurrency()
  const [currency, setCurrency] = useState<string>('TRY')
  const [tcmbRates, setTcmbRates] = useState<TcmbRatesByCurrency | null>(null)
  const [globalWithholdingRatio, setGlobalWithholdingRatio] = useState<string>('none')
  const [globalTevkifatRatioFilter, setGlobalTevkifatRatioFilter] = useState<string | null>(null)
  const [ratioFilterByLine, setRatioFilterByLine] = useState<Record<number, string | null>>({})
  const [sendingEInvoice, setSendingEInvoice] = useState(false)
  const [pendingTevkifatSendInvoiceId, setPendingTevkifatSendInvoiceId] = useState<string | null>(null)
  const [expandedExtraLineIndex, setExpandedExtraLineIndex] = useState<number | null>(0)

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      product_name: '',
      description: '',
      quantity: 1,
      unit: 'adet',
      unit_price: 0,
      vat_rate: 20,
      line_total: 0,
      vat_amount: 0,
      total_with_vat: 0,
      withholding_ratio: null,
      withholding_amount: 0,
      discount: 0,
      discount_type: 'percent',
      otv: 0,
      otv_type: 'percent',
      oiv: 0,
      oiv_type: 'percent',
      accommodation_tax: 0,
      accommodation_tax_type: 'amount',
      export_code: null,
      withholding_reason_code: null,
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
      const [customersRes, productsRes, projectsRes, staffRes] = await Promise.all([
        supabase.from('customers').select('id, name, company_title, payment_terms, payment_terms_type').eq('tenant_id', tenantId).eq('status', 'active').or('branch_type.eq.main,parent_customer_id.is.null').order('name'),
        supabase.from('products').select('id, name, sale_price, vat_rate').eq('tenant_id', tenantId).eq('status', 'active').order('name'),
        supabase.from('projects').select('id, name, code').eq('tenant_id', tenantId).in('status', ['planning', 'active']).order('name'),
        supabase.from('staff').select('id, name, last_name, department, position').eq('tenant_id', tenantId).eq('status', 'active').order('name')
      ])

      setCustomers(customersRes.data || [])
      setProducts(productsRes.data || [])
      setProjectsList(projectsRes.data || [])
      setStaffList(staffRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    if (!selectedCustomerId || !tenantId) {
      setSubBranches([])
      setSelectedSubBranchId(null)
      return
    }
    supabase
      .from('customers')
      .select('id, company_title, name, payment_terms, payment_terms_type, branch_code')
      .eq('parent_customer_id', selectedCustomerId)
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('company_title')
      .then(({ data }) => {
        setSubBranches(data || [])
        setSelectedSubBranchId(null)
      })
  }, [selectedCustomerId, tenantId])

  const effectiveCustomerId = selectedSubBranchId || selectedCustomerId
  const effectiveCustomer = selectedSubBranchId
    ? subBranches.find(s => s.id === selectedSubBranchId)
    : customers.find(c => c.id === selectedCustomerId)

  useEffect(() => {
    if (effectiveCustomer && effectiveCustomer.payment_terms && effectiveCustomer.payment_terms > 0) {
      const issueDateObj = new Date(issueDate)
      const dueDateObj = new Date(issueDateObj)
      dueDateObj.setDate(dueDateObj.getDate() + effectiveCustomer.payment_terms)
      setDueDate(dueDateObj.toISOString().split('T')[0])
    }
  }, [effectiveCustomerId, issueDate, customers, subBranches])

  function applyKonaklamaVerDefault() {
    setLineItems((prev) =>
      prev.map((item) => {
        const updated = { ...item, accommodation_tax: 2, accommodation_tax_type: 'percent' as const }
        return calculateLineItem(updated)
      })
    )
  }

  function calculateLineItem(item: LineItem): LineItem {
    const raw_total = item.quantity * item.unit_price
    const discountVal = Number(item.discount ?? 0) || 0
    const discountAmount =
      item.discount_type === 'amount'
        ? discountVal
        : raw_total * (discountVal / 100)
    const line_total = Math.max(0, Math.round((raw_total - discountAmount) * 100) / 100)
    const vat_amount = Math.round(line_total * (item.vat_rate / 100) * 100) / 100
    let total_with_vat = line_total + vat_amount

    const otvVal = Number(item.otv ?? 0) || 0
    const otvAmount = item.otv_type === 'amount' ? otvVal : line_total * (otvVal / 100)
    const oivVal = Number(item.oiv ?? 0) || 0
    const oivAmount = item.oiv_type === 'amount' ? oivVal : line_total * (oivVal / 100)
    const accomRateOrAmount = Number(item.accommodation_tax ?? 0) || 0
    const accomVal = item.accommodation_tax_type === 'percent' ? line_total * (accomRateOrAmount / 100) : accomRateOrAmount
    total_with_vat = Math.round((total_with_vat + otvAmount + oivAmount + accomVal) * 100) / 100

    let withholding_amount = 0
    const ratioOrCode = item.withholding_ratio
    if (ratioOrCode && ratioOrCode !== 'none' && vat_amount > 0) {
      const percent = getTevkifatPercent(ratioOrCode)
      if (percent > 0) {
        withholding_amount = Math.round(vat_amount * (percent / 100) * 100) / 100
      }
    }

    return {
      ...item,
      line_total,
      vat_amount,
      total_with_vat,
      withholding_amount,
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
        unit: 'adet',
        unit_price: 0,
        vat_rate: 20,
        line_total: 0,
        vat_amount: 0,
        total_with_vat: 0,
        withholding_ratio: null,
        withholding_amount: 0,
        discount: 0,
        discount_type: 'percent',
        otv: 0,
        otv_type: 'percent',
        oiv: 0,
        oiv_type: 'percent',
        accommodation_tax: invoiceType === 'konaklama_ver' ? 2 : 0,
        accommodation_tax_type: invoiceType === 'konaklama_ver' ? 'percent' : 'amount',
        export_code: null,
        withholding_reason_code: null,
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
  const totalWithholding = lineItems.reduce((sum, item) => sum + (item.withholding_amount || 0), 0)

  async function saveInvoice(andSendEInvoice = false) {
    if (!tenantId) return

    if (!selectedCustomerId) {
      toast.error(t.invoices.selectCustomerRequired)
      return
    }

    if (lineItems.some(item => !item.product_name)) {
      toast.error(t.invoices.fillProductNames)
      return
    }

    // Tevkifat oranı seçildiyse tevkifat nedeni zorunludur (genel)
    if (globalTevkifatRatioFilter && globalWithholdingRatio === 'none') {
      toast.error(language === 'tr' ? 'Tevkifat oranı seçildi. Lütfen tevkifat nedenini de seçin.' : 'Withholding ratio is selected. Please select a withholding reason.')
      return
    }

    // Satır bazında: oran seçilip neden seçilmemişse uyar
    const lineMissingReason = lineItems.findIndex((item, idx) => {
      const ratioForLine = ratioFilterByLine[idx] ?? getTevkifatRatioFromCode(item.withholding_ratio)
      return ratioForLine && ratioForLine !== 'none' && !item.withholding_ratio
    })
    if (lineMissingReason >= 0) {
      toast.error(language === 'tr' ? `Satır ${lineMissingReason + 1}: Tevkifat oranı seçildi. Lütfen tevkifat nedenini de seçin.` : `Line ${lineMissingReason + 1}: Withholding ratio is selected. Please select a withholding reason.`)
      return
    }

    setLoading(true)
    if (andSendEInvoice) setSendingEInvoice(true)

    try {
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([
          {
            tenant_id: tenantId,
            customer_id: effectiveCustomerId,
            invoice_number: invoiceNumber,
            amount: grandTotal,
            total: grandTotal,
            subtotal: subtotal,
            total_vat: totalVat,
            withholding_amount: totalWithholding || 0,
            status: 'draft',
            invoice_type: invoiceType,
            currency: currency || companyCurrency || 'TRY',
            issue_date: issueDate,
            due_date: dueDate,
            notes: notes,
            project_id: selectedProjectId || null,
            staff_id: staffId || null
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
        product_id: item.product_id || null,
        discount: item.discount ?? 0,
        discount_type: item.discount_type ?? 'percent',
        otv: item.otv ?? 0,
        otv_type: item.otv_type ?? 'percent',
        oiv: item.oiv ?? 0,
        oiv_type: item.oiv_type ?? 'percent',
        accommodation_tax: item.accommodation_tax_type === 'percent'
          ? Math.round((item.line_total * (item.accommodation_tax ?? 0) / 100) * 100) / 100
          : (item.accommodation_tax ?? 0),
        export_code: item.export_code || null,
        withholding_reason_code: item.withholding_reason_code || null,
        withholding_ratio: item.withholding_ratio || null,
      }))

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsToInsert)

      if (lineItemsError) throw lineItemsError

      if (effectiveCustomerId && grandTotal > 0) {
        const { data: customer } = await supabase
          .from('customers')
          .select('balance')
          .eq('id', effectiveCustomerId)
          .eq('tenant_id', tenantId)
          .single()
        if (customer) {
          await supabase
            .from('customers')
            .update({ balance: Number(customer.balance ?? 0) + grandTotal })
            .eq('id', effectiveCustomerId)
            .eq('tenant_id', tenantId)
        }
      }

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

      if (andSendEInvoice) {
        if (totalWithholding > 0) {
          setPendingTevkifatSendInvoiceId(invoice.id)
          toast.success(t.invoices.invoiceCreatedSuccess)
          return
        }
        const result = await sendEInvoiceFromInvoiceId(tenantId, invoice.id)
        if (result.success) {
          toast.success(language === 'tr' ? 'Fatura kaydedildi ve e-fatura gönderildi.' : 'Invoice saved and e-invoice sent.')
        } else {
          toast.warning(t.invoices.invoiceCreatedSuccess + (result.error ? ` ${result.error}` : ''))
        }
      } else {
        toast.success(t.invoices.invoiceCreatedSuccess)
      }
      router.push('/invoices')
    } catch (error: any) {
      console.error('Error creating invoice:', error)
      toast.error(error.message || t.invoices.failedToCreateInvoice)
    } finally {
      setLoading(false)
      setSendingEInvoice(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.invoices.createNewInvoice}</h1>
            <p className="text-gray-500 mt-1">{t.invoices.createNewInvoiceDesc}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/invoices')}
              disabled={loading}
              className="font-semibold text-contrast-body"
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={() => saveInvoice(false)}
              disabled={loading}
              className="bg-[#00D4AA] hover:bg-[#00B894] font-semibold text-contrast-body"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading && !sendingEInvoice ? t.common.adding : t.invoices.saveInvoice}
            </Button>
            {invoiceType !== 'proforma' && (
            <Button
              variant="secondary"
              onClick={() => saveInvoice(true)}
              disabled={loading}
              className="font-semibold"
            >
              {loading && sendingEInvoice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {loading && sendingEInvoice ? (language === 'tr' ? 'Gönderiliyor…' : 'Sending…') : (language === 'tr' ? 'Kaydet ve E-Fatura Gönder' : 'Save and Send E-Invoice')}
            </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold leading-none tracking-tight text-gray-900">{t.invoices.invoiceDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-lg border p-4 bg-muted/30">
              <Label htmlFor="invoice_type" data-field="new-invoice-type-label" className="cursor-text select-text">{language === 'tr' ? 'Fatura Tipi' : 'Invoice Type'} *</Label>
              <Select
                value={invoiceType}
                onValueChange={(value) => {
                  setInvoiceType(value)
                  if (value === 'konaklama_ver') applyKonaklamaVerDefault()
                }}
              >
                <SelectTrigger id="invoice_type" data-field="new-invoice-type" data-testid="new-invoice-type-trigger" className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">{language === 'tr' ? 'Satış' : 'Sale'}</SelectItem>
                  <SelectItem value="proforma">{language === 'tr' ? 'Proforma faturası oluştur' : 'Create Proforma invoice'}</SelectItem>
                  <SelectItem value="perakende">{language === 'tr' ? 'Perakende faturası oluştur' : 'Create Retail invoice'}</SelectItem>
                  <SelectItem value="konaklama_ver">{language === 'tr' ? 'Konaklama Ver. faturası oluştur' : 'Create Accommodation Tax invoice'}</SelectItem>
                  <SelectItem value="sale_return">{language === 'tr' ? 'Satıştan İade' : 'Sale Return'}</SelectItem>
                  <SelectItem value="devir">{language === 'tr' ? 'Devir' : 'Carry Forward'}</SelectItem>
                  <SelectItem value="devir_return">{language === 'tr' ? 'Devir İade' : 'Carry Fwd Return'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <div className="space-y-2" data-field="new-invoice-customer" data-testid="new-invoice-customer">
                <Label htmlFor="customer" data-field="new-invoice-customer-label" className="cursor-text select-text">{t.invoices.customer} *</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger id="customer" data-field="new-invoice-customer" data-testid="new-invoice-customer-trigger">
                    <SelectValue placeholder={t.invoices.selectCustomer} />
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
              <div className="space-y-2" data-field="new-invoice-sub-branch">
                <Label htmlFor="sub_branch">{t.invoices.subBranch}</Label>
                {subBranches.length > 0 ? (
                  <>
                    <Select
                      value={selectedSubBranchId || '__main__'}
                      onValueChange={(v) => setSelectedSubBranchId(v === '__main__' ? null : v)}
                    >
                      <SelectTrigger id="sub_branch" data-field="new-invoice-sub-branch-trigger">
                        <SelectValue placeholder={t.invoices.mainCustomer} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__main__">{t.invoices.mainCustomer}</SelectItem>
                        {subBranches.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.company_title || sub.name}{sub.branch_code ? ` (${sub.branch_code})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{t.invoices.subBranchHelp}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">{selectedCustomerId ? t.invoices.noSubBranchesForCustomer : '—'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="due_date" data-field="new-invoice-due-date-label" className="cursor-text select-text">{t.invoices.dueDate}</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  data-field="new-invoice-due-date"
                  data-testid="new-invoice-due-date-input"
                />
              </div>

              <div className="space-y-2" data-field="new-invoice-staff">
                <Label htmlFor="staff">{t.hr.selectStaff}</Label>
                <Select value={staffId || 'none'} onValueChange={(v) => setStaffId(v === 'none' ? '' : v)}>
                  <SelectTrigger id="staff" data-field="new-invoice-staff-trigger">
                    <SelectValue placeholder={t.hr.selectStaff} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{language === 'tr' ? 'Yok' : 'None'}</SelectItem>
                    {staffList.map((s) => {
                      const fullName = [s.name, s.last_name].filter(Boolean).join(' ') || s.name
                      return (
                        <SelectItem key={s.id} value={s.id}>
                          {fullName}{s.department || s.position ? ` — ${[s.department, s.position].filter(Boolean).join(', ')}` : ''}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{language === 'tr' ? 'İsteğe bağlı. Seçilen personel performansına yansır.' : 'Optional. Affects staff performance.'}</p>
              </div>
            </div>

            {projectsList.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="project">{t.invoices.project}</Label>
                <Select value={selectedProjectId || 'none'} onValueChange={v => setSelectedProjectId(v === 'none' ? '' : v)}>
                  <SelectTrigger id="project" data-field="new-invoice-project">
                    <SelectValue placeholder={t.invoices.selectProjectOptional} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.invoices.noProject}</SelectItem>
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
          <CardHeader>
            <CardTitle className="text-2xl font-semibold leading-none tracking-tight text-gray-900">
              {language === 'tr' ? 'Hizmet ve Ürünler' : 'Services and Products'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[15px] text-gray-900">
            <div className="flex flex-wrap justify-end mb-4 gap-3 items-center">
              <span className="text-[15px] font-semibold text-gray-800">
                {language === 'tr' ? 'Tevkifat (tüm satırlar)' : 'Withholding (all lines)'}
              </span>
              <div className="flex items-center gap-2">
                <Label className="text-[15px] font-semibold text-gray-800">{language === 'tr' ? 'Oran' : 'Ratio'}</Label>
                <Select
                  value={globalTevkifatRatioFilter ?? 'none'}
                  onValueChange={(value) => {
                    const v = value === 'none' ? null : value
                    setGlobalTevkifatRatioFilter(v)
                    if (v && globalWithholdingRatio !== 'none') {
                      const codeRatio = getTevkifatRatioFromCode(globalWithholdingRatio)
                      if (codeRatio !== v) {
                        setGlobalWithholdingRatio('none')
                        setLineItems((prev) => prev.map((li) => calculateLineItem({ ...li, withholding_ratio: null })))
                      }
                    }
                  }}
                >
                  <SelectTrigger className="relative w-24 border-2 border-gray-300 rounded-md bg-white h-10 pl-3 pr-8 text-gray-900 font-medium text-[15px] [&>span:first-child]:opacity-0 [&>span:first-child]:w-0 [&>span:first-child]:overflow-hidden [&>span:first-child]:min-w-0">
                    <SelectValue placeholder={language === 'tr' ? 'Oran' : 'Ratio'} />
                    <span className="absolute left-3 right-8 text-left text-gray-900 font-medium text-[15px] truncate pointer-events-none">
                      {globalTevkifatRatioFilter && globalTevkifatRatioFilter !== 'none' ? globalTevkifatRatioFilter : (language === 'tr' ? 'Yok' : 'None')}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{language === 'tr' ? 'Yok' : 'None'}</SelectItem>
                    {TEVKIFAT_RATIOS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-[15px] font-semibold text-gray-800">
                  {language === 'tr' ? 'Tevkifat nedeni' : 'Reason'}
                  {globalTevkifatRatioFilter && <span className="text-red-600 ml-0.5">*</span>}
                </Label>
                <Select
                  value={globalWithholdingRatio}
                  onValueChange={(value) => {
                    setGlobalWithholdingRatio(value)
                    setLineItems((prev) =>
                      prev.map((li) =>
                        calculateLineItem({
                          ...li,
                          withholding_ratio: value === 'none' ? null : value,
                        })
                      )
                    )
                    if (value !== 'none') setGlobalTevkifatRatioFilter(getTevkifatRatioFromCode(value))
                  }}
                >
                  <SelectTrigger className="relative w-56 border-2 border-gray-300 rounded-md bg-white h-10 pl-3 pr-8 text-gray-900 font-medium text-[15px] [&>span:first-child]:opacity-0 [&>span:first-child]:w-0 [&>span:first-child]:overflow-hidden [&>span:first-child]:min-w-0">
                    <SelectValue placeholder={globalTevkifatRatioFilter ? (language === 'tr' ? 'Neden seçin' : 'Select reason') : (language === 'tr' ? 'Önce oran seçin' : 'Select ratio first')} />
                    <span className="absolute left-3 right-8 text-left text-gray-900 font-medium text-[15px] truncate pointer-events-none">
                      {globalWithholdingRatio && globalWithholdingRatio !== 'none'
                        ? (() => {
                            const tc = TEVKIFAT_CODES.find((c) => c.code === globalWithholdingRatio)
                            return tc ? `${tc.code} – ${language === 'tr' ? tc.labelTr : tc.labelEn}` : globalWithholdingRatio
                          })()
                        : (globalTevkifatRatioFilter ? (language === 'tr' ? 'Neden seçin' : 'Select reason') : (language === 'tr' ? 'Önce oran seçin' : 'Select ratio first'))}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    <SelectItem value="none">{language === 'tr' ? 'Tevkifat yok' : 'No withholding'}</SelectItem>
                    {getTevkifatCodesByRatio(globalTevkifatRatioFilter).map((tc) => (
                      <SelectItem key={tc.code} value={tc.code}>
                        {tc.code} – {language === 'tr' ? tc.labelTr : tc.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-6">
              {lineItems.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="space-y-4">
                    {/* Üst: Hizmet/Ürün seçimi */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                      <div className="space-y-2">
                        <Label className="text-[15px] font-semibold text-gray-800">
                          {language === 'tr' ? 'Hizmet / Ürün' : 'Service / Product'} *
                        </Label>
                        <div className="flex flex-wrap items-center gap-2">
                          <Select
                            value={item.product_id || ''}
                            onValueChange={(value) => selectProduct(index, value)}
                          >
                            <SelectTrigger
                              className="border-2 border-gray-300 rounded-md bg-white px-3 py-2 text-gray-900 font-medium text-[15px] h-10 min-w-[12rem] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20"
                              data-field={`line-item-${index}-product`}
                            >
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
                            value={item.product_name}
                            onChange={(e) => updateLineItem(index, 'product_name', e.target.value)}
                            placeholder={language === 'tr' ? 'Veya özel ad yazın' : 'Or type custom name'}
                            className="border-2 border-gray-300 rounded-md bg-white px-3 py-2 text-gray-900 font-medium text-[15px] h-10 flex-1 min-w-[10rem] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20"
                            data-field={`line-item-${index}-product-name`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Alt: Miktar, Birim, Fiyat, KDV, Toplam + ek alanlar */}
                    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                      <div className="overflow-x-auto">
                        <div className="grid grid-cols-2 lg:grid-cols-[minmax(6rem,1.25fr)_minmax(2.75rem,0.5fr)_minmax(8rem,1.6fr)_minmax(3rem,0.6fr)_minmax(7.5rem,1.25fr)] gap-x-4 gap-y-3 items-center min-w-0">
                          <div className="space-y-1 min-w-0">
                            <Label className="text-[15px] font-semibold text-gray-800 block">
                              {language === 'tr' ? 'Miktar' : 'Quantity'}
                            </Label>
                            <div className="relative min-w-0">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="pl-8 border-2 border-gray-300 rounded-md bg-white h-10 text-right text-gray-900 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20 w-full min-w-0 max-w-full"
                                data-field={`line-item-${index}-quantity`}
                              />
                            </div>
                          </div>
                          <div className="space-y-1 min-w-0 flex flex-col items-center justify-center">
                            <Label className="text-[15px] font-semibold text-gray-800 block">
                              {language === 'tr' ? 'Birim' : 'Unit'}
                            </Label>
                            <Select
                              value={item.unit || 'adet'}
                              onValueChange={(v) => updateLineItem(index, 'unit', v)}
                            >
                              <SelectTrigger className="relative border-2 border-gray-300 rounded-md bg-white h-10 pl-2 pr-7 text-gray-900 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20 w-full min-w-0 max-w-[4.5rem] [&>span:first-child]:!absolute [&>span:first-child]:!-left-[9999px] [&>span:first-child]:!opacity-0 [&>span:first-child]:!w-0 [&>span:first-child]:!overflow-hidden">
                                <SelectValue placeholder={language === 'tr' ? 'Birim' : 'Unit'} />
                                <span className="absolute left-2 right-7 text-left text-gray-900 font-medium text-[15px] truncate pointer-events-none">
                                  {(() => {
                                    const u = LINE_UNITS.find((x) => x.value === (item.unit || 'adet'))
                                    return u ? (language === 'tr' ? u.labelTr : u.labelEn) : (item.unit || 'adet')
                                  })()}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                {LINE_UNITS.map((u) => (
                                  <SelectItem key={u.value} value={u.value}>
                                    {language === 'tr' ? u.labelTr : u.labelEn}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1 min-w-0">
                            <Label className="text-[15px] font-semibold text-gray-800 block">
                              {t.invoices.unitPrice}
                            </Label>
                            <div className="flex border-2 border-gray-300 rounded-md bg-white overflow-hidden min-w-0">
                              <span className="flex items-center px-2 text-gray-800 text-[15px] font-semibold bg-gray-100 border-r border-gray-300 shrink-0">
                                {currency === 'TRY' ? '₺' : currency}
                              </span>
                              <Input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="border-0 rounded-none h-10 text-right text-gray-900 font-medium text-[15px] flex-1 min-w-0 w-12 focus-visible:ring-0"
                                data-field={`line-item-${index}-unit-price`}
                              />
                            </div>
                          </div>
                          <div className="space-y-1 min-w-0 flex flex-col items-center justify-center">
                            <Label className="text-[15px] font-semibold text-gray-800 block">KDV</Label>
                            <Select
                              value={item.vat_rate.toString()}
                              onValueChange={(value) => updateLineItem(index, 'vat_rate', parseFloat(value))}
                            >
                              <SelectTrigger className="relative border-2 border-gray-300 rounded-md bg-white h-10 pl-2 pr-7 text-gray-900 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20 w-full min-w-0 max-w-[4.5rem] [&>span:first-child]:!absolute [&>span:first-child]:!-left-[9999px] [&>span:first-child]:!opacity-0 [&>span:first-child]:!w-0 [&>span:first-child]:!overflow-hidden" data-field={`line-item-${index}-vat`}>
                                <SelectValue placeholder="KDV" />
                                <span className="absolute left-2 right-7 text-left text-gray-900 font-medium text-[15px] truncate pointer-events-none">
                                    %{item.vat_rate}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">%0</SelectItem>
                                <SelectItem value="1">%1</SelectItem>
                                <SelectItem value="10">%10</SelectItem>
                                <SelectItem value="20">%20</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1 min-w-0">
                            <Label className="text-[15px] font-semibold text-gray-800 block">{t.invoices.total}</Label>
                            <div className="flex border-2 border-gray-300 rounded-md bg-gray-100 overflow-hidden min-w-0">
                              <span className="flex items-center px-2 text-gray-800 text-[15px] font-semibold border-r border-gray-300 shrink-0">
                                {currency === 'TRY' ? '₺' : currency}
                              </span>
                              <span className="text-right text-gray-900 font-semibold text-[15px] py-2 px-2 flex-1 min-w-0 truncate">
                                {formatCurrency(item.total_with_vat, currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ek alanlar: ilk satırda varsayılan açık; tıklayınca açılır/kapanır */}
                      <div className="border-t border-gray-200 pt-2">
                        <button
                          type="button"
                          onClick={() => setExpandedExtraLineIndex((prev) => (prev === index ? null : index))}
                          className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-md hover:bg-gray-200/60 text-gray-800 text-[15px] font-semibold"
                        >
                          {expandedExtraLineIndex === index ? (
                            <ChevronUp className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          )}
                          <span>{language === 'tr' ? 'Ek alanlar' : 'Extra fields'}</span>
                          <span className="text-gray-600 text-[15px] font-medium">
                            ({language === 'tr' ? 'İndirim' : 'Disc'}, {language === 'tr' ? 'Tevkifat' : 'Withh'}, ÖTV, ÖİV, {language === 'tr' ? 'Konaklama' : 'Accom'}, {language === 'tr' ? 'İhraç' : 'Export'})
                          </span>
                          {(item.discount !== 0 || item.withholding_ratio || (item.otv ?? 0) !== 0 || (item.oiv ?? 0) !== 0 || (item.accommodation_tax ?? 0) !== 0 || item.export_code) && (
                            <span className="ml-1 size-1.5 rounded-full bg-[#0A2540]/40" title={language === 'tr' ? 'Dolu' : 'Filled'} />
                          )}
                        </button>
                        {expandedExtraLineIndex === index && (
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <p className="col-span-full text-[15px] text-gray-700 mb-0.5">
                              {language === 'tr' ? 'İndirim, tevkifat, ÖTV, ÖİV, konaklama vergisi ve ihraç kodu.' : 'Discount, withholding, SCT, SIT, accommodation tax and export code.'}
                            </p>
                            <div className="rounded-lg border-2 border-gray-200 bg-white p-2 space-y-1">
                              <Label className="text-[15px] font-semibold text-gray-800 block">{language === 'tr' ? 'İndirim' : 'Discount'}</Label>
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  className="w-16 max-w-[4.5rem] border-2 border-gray-300 rounded-md bg-white h-8 text-right text-gray-900 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20"
                                  value={item.discount ? item.discount : ''}
                                  onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                />
                                <Select
                                  value={item.discount_type || 'percent'}
                                  onValueChange={(v) => updateLineItem(index, 'discount_type', v as 'percent' | 'amount')}
                                >
                                  <SelectTrigger className="relative w-11 border border-gray-300 rounded-md bg-white h-8 pl-1.5 pr-6 text-gray-900 font-medium text-[15px] shrink-0 focus-visible:ring-2 focus-visible:ring-[#0A2540]/20 [&>span:first-child]:opacity-0 [&>span:first-child]:w-0 [&>span:first-child]:overflow-hidden [&>span:first-child]:min-w-0">
                                    <SelectValue />
                                    <span className="absolute left-1.5 right-6 text-left text-gray-900 font-medium text-[15px] truncate pointer-events-none">
                                      {item.discount_type === 'amount' ? '₺' : '%'}
                                    </span>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percent">%</SelectItem>
                                    <SelectItem value="amount">₺</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="rounded-lg border-2 border-gray-200 bg-white p-2 space-y-1">
                              <Label className="text-[15px] font-semibold text-gray-800 block">{language === 'tr' ? 'Tevkifat oranı' : 'Withholding ratio'}</Label>
                              <Select
                                value={ratioFilterByLine[index] ?? getTevkifatRatioFromCode(item.withholding_ratio) ?? 'none'}
                                onValueChange={(v) => {
                                  const ratio = v === 'none' ? null : v
                                  setRatioFilterByLine((prev) => ({ ...prev, [index]: ratio }))
                                  if (ratio && item.withholding_ratio) {
                                    const codeRatio = getTevkifatRatioFromCode(item.withholding_ratio)
                                    if (codeRatio !== ratio) updateLineItem(index, 'withholding_ratio', null)
                                  }
                                }}
                              >
                                <SelectTrigger className="relative border-2 border-gray-300 rounded-md bg-white h-8 pl-2 pr-7 text-gray-900 font-medium text-[15px] w-full focus-visible:ring-2 focus-visible:ring-[#0A2540]/20 [&>span:first-child]:opacity-0 [&>span:first-child]:w-0 [&>span:first-child]:overflow-hidden [&>span:first-child]:min-w-0">
                                  <SelectValue placeholder={language === 'tr' ? 'Oran' : 'Ratio'} />
<span className="absolute left-2 right-7 text-left text-gray-900 font-medium text-[15px] truncate pointer-events-none">
                                      {(ratioFilterByLine[index] ?? getTevkifatRatioFromCode(item.withholding_ratio)) && (ratioFilterByLine[index] ?? getTevkifatRatioFromCode(item.withholding_ratio)) !== 'none'
                                      ? (ratioFilterByLine[index] ?? getTevkifatRatioFromCode(item.withholding_ratio))
                                      : (language === 'tr' ? 'Yok' : 'None')}
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">{language === 'tr' ? 'Yok' : 'None'}</SelectItem>
                                  {TEVKIFAT_RATIOS.map((r) => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="rounded-lg border-2 border-gray-200 bg-white p-2 space-y-1">
                              <Label className="text-[15px] font-semibold text-gray-800 block">
                                {language === 'tr' ? 'Tevkifat nedeni' : 'Withholding reason'}
                                {(ratioFilterByLine[index] ?? getTevkifatRatioFromCode(item.withholding_ratio)) && (ratioFilterByLine[index] ?? getTevkifatRatioFromCode(item.withholding_ratio)) !== 'none' && <span className="text-red-600 ml-0.5">*</span>}
                              </Label>
                              <div className="flex items-center gap-1.5">
                                <Select
                                  value={item.withholding_ratio || 'none'}
                                  onValueChange={(v) => {
                                    updateLineItem(index, 'withholding_ratio', v === 'none' ? null : v)
                                    if (v !== 'none') setRatioFilterByLine((prev) => ({ ...prev, [index]: getTevkifatRatioFromCode(v) ?? null }))
                                  }}
                                >
                                  <SelectTrigger className="relative flex-1 min-w-0 border-2 border-gray-300 rounded-md bg-white h-8 pl-2 pr-7 text-gray-900 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20 [&>span:first-child]:opacity-0 [&>span:first-child]:w-0 [&>span:first-child]:overflow-hidden [&>span:first-child]:min-w-0">
                                    <SelectValue placeholder={(ratioFilterByLine[index] ?? getTevkifatRatioFromCode(item.withholding_ratio)) ? (language === 'tr' ? 'Neden seçin' : 'Select reason') : (language === 'tr' ? 'Önce oran seçin' : 'Select ratio first')} />
                                    <span className="absolute left-2 right-7 text-left text-gray-900 font-medium text-[15px] truncate pointer-events-none">
                                      {item.withholding_ratio && item.withholding_ratio !== 'none'
                                        ? (() => {
                                            const tc = TEVKIFAT_CODES.find((c) => c.code === item.withholding_ratio)
                                            return tc ? `${tc.code} – ${language === 'tr' ? tc.labelTr : tc.labelEn}` : item.withholding_ratio
                                          })()
                                        : ((ratioFilterByLine[index] ?? getTevkifatRatioFromCode(item.withholding_ratio)) ? (language === 'tr' ? 'Neden seçin' : 'Select reason') : (language === 'tr' ? 'Önce oran seçin' : 'Select ratio first'))}
                                    </span>
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[280px]">
                                    <SelectItem value="none">{language === 'tr' ? 'Yok' : 'None'}</SelectItem>
                                    {getTevkifatCodesByRatio(ratioFilterByLine[index] ?? getTevkifatRatioFromCode(item.withholding_ratio)).map((tc) => (
                                      <SelectItem key={tc.code} value={tc.code}>
                                        {tc.code} – {language === 'tr' ? tc.labelTr : tc.labelEn}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="rounded-lg border-2 border-gray-200 bg-white p-2 space-y-1">
                              <Label className="text-[15px] font-semibold text-gray-800 block">ÖTV</Label>
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  className="w-16 max-w-[4.5rem] border-2 border-gray-300 rounded-md bg-white h-8 text-right text-gray-900 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20"
                                  value={item.otv ? item.otv : ''}
                                  onChange={(e) => updateLineItem(index, 'otv', parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-gray-800 text-[15px] font-semibold">%</span>
                              </div>
                            </div>
                            <div className="rounded-lg border-2 border-gray-200 bg-white p-2 space-y-1">
                              <Label className="text-[15px] font-semibold text-gray-800 block">ÖİV</Label>
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  className="w-16 max-w-[4.5rem] border-2 border-gray-300 rounded-md bg-white h-8 text-right text-gray-900 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20"
                                  value={item.oiv ? item.oiv : ''}
                                  onChange={(e) => updateLineItem(index, 'oiv', parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-gray-800 text-[15px] font-semibold">%</span>
                              </div>
                            </div>
                            <div className="rounded-lg border-2 border-gray-200 bg-white p-2 space-y-1">
                              <Label className="text-[15px] font-semibold text-gray-800 block">{language === 'tr' ? 'Konaklama Vergisi' : 'Accom. Tax'}</Label>
                              {invoiceType === 'konaklama_ver' && (
                                <p className="text-xs text-muted-foreground">
                                  {language === 'tr' ? 'Oran %2, KDV hariç konaklama bedeli üzerinden hesaplanır.' : 'Rate 2%, calculated on accommodation amount excluding VAT.'}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  className="w-16 max-w-[4.5rem] border-2 border-gray-300 rounded-md bg-white h-8 text-right text-gray-900 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20"
                                  value={item.accommodation_tax ? item.accommodation_tax : ''}
                                  onChange={(e) => updateLineItem(index, 'accommodation_tax', parseFloat(e.target.value) || 0)}
                                />
                                {item.accommodation_tax_type === 'percent' && <span className="text-gray-800 text-[15px] font-semibold">%</span>}
                              </div>
                            </div>
                            <div className="rounded-lg border-2 border-gray-200 bg-white p-2 space-y-1">
                              <Label className="text-[15px] font-semibold text-gray-800 block">{language === 'tr' ? 'İhraç Kodu' : 'Export Code'}</Label>
                              <div className="flex items-center gap-1.5">
                                <Select
                                  value={item.export_code || 'none'}
                                  onValueChange={(v) => updateLineItem(index, 'export_code', v === 'none' ? null : v)}
                                >
                                  <SelectTrigger className="relative flex-1 min-w-0 border-2 border-gray-300 rounded-md bg-white h-8 pl-2 pr-7 text-gray-900 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20 [&>span:first-child]:opacity-0 [&>span:first-child]:w-0 [&>span:first-child]:overflow-hidden [&>span:first-child]:min-w-0">
                                    <SelectValue placeholder={language === 'tr' ? 'Seçin' : 'Select'} />
                                    <span className="absolute left-2 right-7 text-left text-gray-900 font-medium text-[15px] truncate pointer-events-none">
                                      {item.export_code && item.export_code !== 'none'
                                        ? (() => {
                                            const ex = EXPORT_CODES.find((c) => c.code === item.export_code)
                                            return ex ? `${ex.code} – ${language === 'tr' ? ex.labelTr : ex.labelEn}` : item.export_code
                                          })()
                                        : (language === 'tr' ? 'Seçin' : 'Select')}
                                    </span>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">—</SelectItem>
                                    {EXPORT_CODES.map((c) => (
                                      <SelectItem key={c.code} value={c.code}>
                                        {c.code} – {language === 'tr' ? c.labelTr : c.labelEn}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <p className="text-[15px] text-gray-600 flex items-center gap-1 mt-1">
                                <Info className="h-3.5 w-3.5 shrink-0" />
                                {language === 'tr' ? 'İhraç kodu tüm satırlara uygulanır.' : 'Export code applies to all lines.'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Açıklama (en alt) */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                      <div className="space-y-2">
                        <Label className="text-[15px] font-semibold text-gray-800">
                          {language === 'tr' ? 'Açıklama' : 'Description'}
                        </Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder={t.invoices.optional}
                          className="min-h-[80px] border-2 border-gray-300 rounded-md bg-white px-3 py-2 text-gray-900 font-medium text-[15px] resize-none focus-visible:ring-2 focus-visible:ring-[#0A2540]/20"
                          data-field={`line-item-${index}-description`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addLineItem}
              className="mt-6 text-[15px] font-semibold text-[#0A2540] border-[#0A2540]/30 hover:bg-[#0A2540]/5"
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === 'tr' ? 'Yeni satır ekle' : 'Add new line'}
            </Button>

            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-[15px] font-semibold text-gray-800">{t.invoices.subtotal}:</span>
                  <span className="text-[15px] font-semibold text-gray-900">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-[15px] font-semibold text-gray-800">{t.invoices.vatTotal}:</span>
                  <span className="text-[15px] font-semibold text-gray-900">{formatCurrency(totalVat, currency)}</span>
                </div>
                <div className="flex justify-between py-3 bg-[#00D4AA] text-white px-4 rounded-lg">
                  <span className="text-[15px] font-bold">{t.invoices.grandTotal}:</span>
                  <span className="text-[15px] font-bold">{formatCurrency(grandTotal, currency)}</span>
                </div>
                {totalWithholding > 0 && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-[15px] font-semibold text-gray-800">
                        {language === 'tr' ? 'Tevkifat toplamı:' : 'Total withholding:'}
                      </span>
                      <span className="text-[15px] font-semibold text-gray-900">{formatCurrency(totalWithholding, currency)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[15px] font-semibold text-gray-800">
                        {language === 'tr' ? 'Ödenecek tutar:' : 'Payable amount:'}
                      </span>
                      <span className="text-[15px] font-semibold text-gray-900">
                        {formatCurrency(Math.round((grandTotal - totalWithholding) * 100) / 100, currency)}
                      </span>
                    </div>
                  </>
                )}
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
            <CardTitle>{t.invoices.additionalNotes}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.invoices.additionalNotesPlaceholder}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      {pendingTevkifatSendInvoiceId && tenantId && (
        <TevkifatReasonSendDialog
          open={!!pendingTevkifatSendInvoiceId}
          onOpenChange={(open) => {
            if (!open) {
              setPendingTevkifatSendInvoiceId(null)
              router.push('/invoices')
            }
          }}
          tenantId={tenantId}
          invoiceId={pendingTevkifatSendInvoiceId}
          language={language}
          onSent={() => {
            toast.success(language === 'tr' ? 'Fatura kaydedildi ve e-fatura gönderildi.' : 'Invoice saved and e-invoice sent.')
            setPendingTevkifatSendInvoiceId(null)
            router.push('/invoices')
          }}
          onError={(msg) => {
            toast.error(msg)
            setPendingTevkifatSendInvoiceId(null)
            router.push('/invoices')
          }}
        />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
