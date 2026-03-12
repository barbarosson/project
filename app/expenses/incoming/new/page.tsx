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
import { Plus, Trash2, Save, Loader2, Search, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
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

const PURCHASE_INVOICE_TYPES = [
  { value: 'fatura_olustur', labelTr: 'Fatura Oluştur', labelEn: 'Create Invoice' },
  { value: 'konaklama_ver_faturasi', labelTr: 'Konaklama Ver. Faturası Oluştur', labelEn: 'Create Accommodation Tax Invoice' },
  { value: 'maas_odemesi', labelTr: 'Maaş Ödemesi Oluştur', labelEn: 'Create Salary Payment' },
  { value: 'vergi_odemesi', labelTr: 'Vergi Ödemesi Oluştur', labelEn: 'Create Tax Payment' },
  { value: 'diger', labelTr: 'Diğer', labelEn: 'Other' },
] as const

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
  export_code?: string | null
  withholding_reason_code?: string | null
}

interface Supplier {
  id: string
  name: string
  company_title: string
  payment_terms?: number
  payment_terms_type?: string
}

interface Product {
  id: string
  name: string
  purchase_price: number
  vat_rate: number
}

export default function NewPurchaseInvoicePage() {
  const router = useRouter()
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language } = useLanguage()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState<string>('')
  const [invoiceType, setInvoiceType] = useState<string>('fatura_olustur')
  const { currency: companyCurrency, formatCurrency, defaultRateType } = useCurrency()
  const [currency, setCurrency] = useState<string>('TRY')
  const [tcmbRates, setTcmbRates] = useState<TcmbRatesByCurrency | null>(null)
  const [globalWithholdingRatio, setGlobalWithholdingRatio] = useState<string>('none')
  const [globalTevkifatRatioFilter, setGlobalTevkifatRatioFilter] = useState<string | null>(null)
  const [ratioFilterByLine, setRatioFilterByLine] = useState<Record<number, string | null>>({})
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
      const [suppliersRes, productsRes] = await Promise.all([
        supabase
          .from('customers')
          .select('id, name, company_title, payment_terms, payment_terms_type')
          .eq('tenant_id', tenantId)
          .eq('status', 'active')
          .in('account_type', ['vendor', 'both'])
          .or('branch_type.eq.main,parent_customer_id.is.null')
          .order('name'),
        supabase
          .from('products')
          .select('id, name, purchase_price, vat_rate')
          .eq('tenant_id', tenantId)
          .eq('status', 'active')
          .order('name')
      ])
      setSuppliers(suppliersRes.data || [])
      setProducts(productsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const effectiveSupplier = suppliers.find((s) => s.id === selectedSupplierId)

  useEffect(() => {
    if (effectiveSupplier && effectiveSupplier.payment_terms && effectiveSupplier.payment_terms > 0) {
      const issueDateObj = new Date(issueDate)
      const dueDateObj = new Date(issueDateObj)
      dueDateObj.setDate(dueDateObj.getDate() + effectiveSupplier.payment_terms)
      setDueDate(dueDateObj.toISOString().split('T')[0])
    }
  }, [selectedSupplierId, issueDate, effectiveSupplier])

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
    const accomVal = Number(item.accommodation_tax ?? 0) || 0
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

  function updateLineItem(index: number, field: keyof LineItem, value: unknown) {
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
        accommodation_tax: 0,
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
    const product = products.find((p) => p.id === productId)
    if (product) {
      const newItems = [...lineItems]
      newItems[index] = {
        ...newItems[index],
        product_name: product.name,
        unit_price: Number(product.purchase_price) || 0,
        vat_rate: product.vat_rate ?? 20,
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

  async function saveInvoice() {
    if (!tenantId) return

    if (!selectedSupplierId) {
      toast.error(language === 'tr' ? 'Lütfen tedarikçi seçin.' : 'Please select a supplier.')
      return
    }

    if (!invoiceNumber.trim()) {
      toast.error(language === 'tr' ? 'Fatura numarası girin.' : 'Enter invoice number.')
      return
    }

    if (lineItems.some((item) => !item.product_name)) {
      toast.error(language === 'tr' ? 'Tüm satırlarda hizmet/ürün adı girin.' : 'Fill product names for all lines.')
      return
    }

    if (globalTevkifatRatioFilter && globalWithholdingRatio === 'none') {
      toast.error(language === 'tr' ? 'Tevkifat oranı seçildi. Lütfen tevkifat nedenini de seçin.' : 'Withholding ratio is selected. Please select a withholding reason.')
      return
    }

    const lineMissingReason = lineItems.findIndex((item, idx) => {
      const ratioForLine = ratioFilterByLine[idx] ?? getTevkifatRatioFromCode(item.withholding_ratio)
      return ratioForLine && ratioForLine !== 'none' && !item.withholding_ratio
    })
    if (lineMissingReason >= 0) {
      toast.error(language === 'tr' ? `Satır ${lineMissingReason + 1}: Tevkifat oranı seçildi. Lütfen tevkifat nedenini de seçin.` : `Line ${lineMissingReason + 1}: Withholding ratio is selected. Please select a withholding reason.`)
      return
    }

    setLoading(true)
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .insert([
          {
            tenant_id: tenantId,
            supplier_id: selectedSupplierId,
            invoice_number: invoiceNumber.trim(),
            invoice_date: issueDate,
            due_date: dueDate || issueDate,
            invoice_type: invoiceType,
            currency: currency || companyCurrency || 'TRY',
            subtotal: Math.round(subtotal * 100) / 100,
            tax_amount: Math.round(totalVat * 100) / 100,
            total_amount: Math.round(grandTotal * 100) / 100,
            withholding_amount: Math.round(totalWithholding * 100) / 100,
            notes: notes || null,
            status: 'pending',
          }
        ])
        .select()
        .single()

      if (invoiceError) throw invoiceError

      const lineItemsToInsert = lineItems.map((item) => ({
        tenant_id: tenantId,
        purchase_invoice_id: invoice.id,
        product_id: item.product_id || null,
        product_name: item.product_name || null,
        description: item.description || '',
        quantity: item.quantity,
        unit: item.unit || 'adet',
        unit_price: item.unit_price,
        tax_rate: item.vat_rate,
        line_total: item.line_total,
        vat_amount: item.vat_amount,
        tax_amount: item.vat_amount,
        total: item.total_with_vat,
        discount: item.discount ?? 0,
        discount_type: item.discount_type ?? 'percent',
        otv: item.otv ?? 0,
        otv_type: item.otv_type ?? 'percent',
        oiv: item.oiv ?? 0,
        oiv_type: item.oiv_type ?? 'percent',
        accommodation_tax: item.accommodation_tax ?? 0,
        export_code: item.export_code || null,
        withholding_ratio: item.withholding_ratio || null,
        withholding_reason_code: item.withholding_reason_code || null,
      }))

      const { error: lineItemsError } = await supabase
        .from('purchase_invoice_line_items')
        .insert(lineItemsToInsert)

      if (lineItemsError) throw lineItemsError

      toast.success(language === 'tr' ? 'Alış faturası kaydedildi.' : 'Purchase invoice saved.')
      router.push('/expenses')
    } catch (error: unknown) {
      console.error('Error creating purchase invoice:', error)
      toast.error((error as Error)?.message || (language === 'tr' ? 'Fatura kaydedilemedi.' : 'Failed to save invoice.'))
    } finally {
      setLoading(false)
    }
  }

  const pageTitle = language === 'tr' ? 'Alış Faturası Oluştur' : 'Create Purchase Invoice'
  const pageDesc = language === 'tr' ? 'Tedarikçi alış faturası oluşturun.' : 'Create a purchase invoice from a supplier.'
  const invoiceDetailsTitle = language === 'tr' ? 'Fatura Bilgileri' : 'Invoice Details'
  const supplierLabel = language === 'tr' ? 'Tedarikçi' : 'Supplier'
  const selectSupplier = language === 'tr' ? 'Tedarikçi seçin' : 'Select supplier'
  const optional = language === 'tr' ? 'İsteğe bağlı' : 'Optional'
  const unitPriceLabel = language === 'tr' ? 'Birim Fiyat' : 'Unit Price'
  const totalLabel = language === 'tr' ? 'Toplam' : 'Total'
  const subtotalLabel = language === 'tr' ? 'Ara Toplam' : 'Subtotal'
  const vatTotalLabel = language === 'tr' ? 'Toplam KDV' : 'Total VAT'
  const grandTotalLabel = language === 'tr' ? 'Genel Toplam' : 'Grand Total'
  const selectProductPlaceholder = language === 'tr' ? 'Ürün seçin' : 'Select product'
  const additionalNotesLabel = language === 'tr' ? 'Ek notlar' : 'Additional notes'
  const additionalNotesPlaceholder = language === 'tr' ? 'Fatura ile ilgili notlar…' : 'Notes about the invoice…'
  const invoiceNumberLabel = language === 'tr' ? 'Fatura No' : 'Invoice No'

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-gray-500 mt-1">{pageDesc}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/expenses')}
              disabled={loading}
              className="font-semibold text-contrast-body"
            >
              {language === 'tr' ? 'İptal' : 'Cancel'}
            </Button>
            <Button
              onClick={() => saveInvoice()}
              disabled={loading}
              className="bg-[#00D4AA] hover:bg-[#00B894] font-semibold text-contrast-body"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? (language === 'tr' ? 'Kaydediliyor…' : 'Saving…') : (language === 'tr' ? 'Kaydet' : 'Save')}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold leading-none tracking-tight text-gray-900">{invoiceDetailsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="supplier">{supplierLabel} *</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder={selectSupplier} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.company_title || s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_number">{invoiceNumberLabel} *</Label>
                <Input
                  id="invoice_number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder={language === 'tr' ? 'örn. GFS-2025-001' : 'e.g. GFS-2025-001'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{language === 'tr' ? 'Fatura Tipi' : 'Invoice Type'}</Label>
                <Select value={invoiceType} onValueChange={setInvoiceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PURCHASE_INVOICE_TYPES.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>
                        {language === 'tr' ? pt.labelTr : pt.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === 'tr' ? 'Para Birimi' : 'Currency'}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
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
                <Label>{language === 'tr' ? 'Düzenleme Tarihi' : 'Issue Date'}</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'tr' ? 'Vade Tarihi' : 'Due Date'}</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
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
                            <SelectTrigger className="border-2 border-gray-300 rounded-md bg-white px-3 py-2 text-gray-900 font-medium text-[15px] h-10 min-w-[12rem] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20">
                              <SelectValue placeholder={selectProductPlaceholder} />
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
                          />
                        </div>
                      </div>
                    </div>

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
                              {unitPriceLabel}
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
                              />
                            </div>
                          </div>
                          <div className="space-y-1 min-w-0 flex flex-col items-center justify-center">
                            <Label className="text-[15px] font-semibold text-gray-800 block">KDV</Label>
                            <Select
                              value={item.vat_rate.toString()}
                              onValueChange={(value) => updateLineItem(index, 'vat_rate', parseFloat(value))}
                            >
                              <SelectTrigger className="relative border-2 border-gray-300 rounded-md bg-white h-10 pl-2 pr-7 text-gray-900 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20 w-full min-w-0 max-w-[4.5rem] [&>span:first-child]:!absolute [&>span:first-child]:!-left-[9999px] [&>span:first-child]:!opacity-0 [&>span:first-child]:!w-0 [&>span:first-child]:!overflow-hidden">
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
                            <Label className="text-[15px] font-semibold text-gray-800 block">{totalLabel}</Label>
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
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  className="w-16 max-w-[4.5rem] border-2 border-gray-300 rounded-md bg-white h-8 text-right text-gray-900 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-[#0A2540]/20"
                                  value={item.accommodation_tax ? item.accommodation_tax : ''}
                                  onChange={(e) => updateLineItem(index, 'accommodation_tax', parseFloat(e.target.value) || 0)}
                                />
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

                    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                      <div className="space-y-2">
                        <Label className="text-[15px] font-semibold text-gray-800">
                          {language === 'tr' ? 'Açıklama' : 'Description'}
                        </Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder={optional}
                          className="min-h-[80px] border-2 border-gray-300 rounded-md bg-white px-3 py-2 text-gray-900 font-medium text-[15px] resize-none focus-visible:ring-2 focus-visible:ring-[#0A2540]/20"
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
                  <span className="text-[15px] font-semibold text-gray-800">{subtotalLabel}:</span>
                  <span className="text-[15px] font-semibold text-gray-900">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-[15px] font-semibold text-gray-800">{vatTotalLabel}:</span>
                  <span className="text-[15px] font-semibold text-gray-900">{formatCurrency(totalVat, currency)}</span>
                </div>
                <div className="flex justify-between py-3 bg-[#00D4AA] text-white px-4 rounded-lg">
                  <span className="text-[15px] font-bold">{grandTotalLabel}:</span>
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
                {currency !== companyCurrency && tcmbRates && (
                  <div className="pt-3 mt-3 border-t border-white/30 space-y-2">
                    <div className="text-xs font-medium text-white/90">
                      {language === 'tr' ? `Çevrilmiş tutar (tercih: ${companyCurrency})` : `Converted amount (preference: ${companyCurrency})`}
                    </div>
                    {(() => {
                      const targetCode = companyCurrency
                      const rateFrom = getRateForType(tcmbRates[currency], defaultRateType)
                      const rateTo = targetCode === 'TRY' ? null : getRateForType(tcmbRates[targetCode], defaultRateType)
                      const converted = convertAmount(grandTotal, currency, targetCode, tcmbRates, defaultRateType)
                      const rateDisplay = rateFrom != null && rateTo != null ? (targetCode === 'TRY' ? rateTo : rateFrom) : null
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
            <CardTitle>{additionalNotesLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={additionalNotesPlaceholder}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      <Toaster />
    </DashboardLayout>
  )
}
