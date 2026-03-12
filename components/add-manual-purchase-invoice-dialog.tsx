'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, FileText } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { parseUblInvoiceLines } from '@/lib/parse-ubl-invoice'

interface Supplier {
  id: string
  company_title: string | null
  name: string | null
  email: string | null
}

interface Product {
  id: string
  name: string
  sku?: string
  purchase_price: number
  vat_rate?: number
}

interface LineItem {
  id: string
  product_id: string | null
  description: string
  quantity: string
  unit_price: string
  vat_rate: number
}

interface PurchaseInvoiceToEdit {
  id: string
  supplier_id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  invoice_type: string | null
  status?: string | null
}

interface AddManualPurchaseInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  mode?: 'add' | 'edit'
  initialInvoice?: PurchaseInvoiceToEdit | null
  /** When true, render as full page content (no dialog wrapper). Cancel button calls onOpenChange(false). */
  asPage?: boolean
}

const PURCHASE_TYPES = [
  { value: 'fatura_olustur', tr: 'Fatura Oluştur', en: 'Create Invoice' },
  { value: 'konaklama_ver_faturasi', tr: 'Konaklama Ver. Faturası Oluştur', en: 'Create Accommodation Tax Invoice' },
  { value: 'maas_odemesi', tr: 'Maaş Ödemesi Oluştur', en: 'Create Salary Payment' },
  { value: 'vergi_odemesi', tr: 'Vergi Ödemesi Oluştur', en: 'Create Tax Payment' },
  { value: 'diger', tr: 'Diğer', en: 'Other' },
] as const

const DEFAULT_VAT_RATE = 20
const ALLOWED_VAT_RATE_VALUES = [0, 1, 10, 20] as const

function normalizeVatRate(value: unknown): number {
  const n = Number(value)
  return (ALLOWED_VAT_RATE_VALUES as readonly number[]).includes(n) ? n : DEFAULT_VAT_RATE
}

const VAT_RATES = [
  { value: 0, label: '0%' },
  { value: 1, label: '1%' },
  { value: 10, label: '10%' },
  { value: 20, label: '20%' },
] as const

export function AddManualPurchaseInvoiceDialog({
  open,
  onOpenChange,
  onSuccess,
  mode = 'add',
  initialInvoice = null,
  asPage = false,
}: AddManualPurchaseInvoiceDialogProps) {
  const { tenantId } = useTenant()
  const effectiveOpen = asPage ? true : open
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    invoice_type: 'fatura_olustur' as string,
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), product_id: null, description: '', quantity: '1', unit_price: '', vat_rate: DEFAULT_VAT_RATE },
  ])
  const [products, setProducts] = useState<Product[]>([])
  const [showEInvoiceImport, setShowEInvoiceImport] = useState(false)
  const [eInvoiceXml, setEInvoiceXml] = useState('')

  useEffect(() => {
    if (effectiveOpen && tenantId) {
      fetchSuppliers()
      fetchProducts()
    }
  }, [effectiveOpen, tenantId])

  useEffect(() => {
    if (!effectiveOpen || !tenantId) return
    if (mode !== 'edit' || !initialInvoice?.id) return

    setFormData({
      supplier_id: initialInvoice.supplier_id || '',
      invoice_number: initialInvoice.invoice_number || '',
      invoice_date: initialInvoice.invoice_date || new Date().toISOString().split('T')[0],
      due_date: initialInvoice.due_date || '',
      invoice_type: (initialInvoice.invoice_type || 'fatura_olustur') as string,
    })

    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('purchase_invoice_line_items')
          .select('id, product_id, description, quantity, unit_price, tax_rate')
          .eq('tenant_id', tenantId)
          .eq('purchase_invoice_id', initialInvoice.id)
          .order('id', { ascending: true })
        if (error) throw error

        const rows = Array.isArray(data) ? data : []
        if (rows.length === 0) {
          setLineItems([{ id: crypto.randomUUID(), product_id: null, description: '', quantity: '1', unit_price: '', vat_rate: DEFAULT_VAT_RATE }])
          return
        }

        setLineItems(
          rows.map((r: any) => ({
            id: crypto.randomUUID(),
            product_id: r.product_id ?? null,
            description: String(r.description ?? ''),
            quantity: String(r.quantity ?? '1'),
            unit_price: String(r.unit_price ?? ''),
            vat_rate: normalizeVatRate(r.tax_rate),
          }))
        )
      } catch (e) {
        console.error(e)
        setLineItems([{ id: crypto.randomUUID(), product_id: null, description: '', quantity: '1', unit_price: '', vat_rate: DEFAULT_VAT_RATE }])
      }
    })()
  }, [effectiveOpen, tenantId, mode, initialInvoice?.id])

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, purchase_price, vat_rate')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('name')
      if (error) throw error
      setProducts(data || [])
    } catch (e) {
      console.error(e)
      setProducts([])
    }
  }

  async function fetchSuppliers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_title, name, email')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .in('account_type', ['vendor', 'both'])
        .order('company_title')

      if (error) {
        const { data: fallback } = await supabase
          .from('customers')
          .select('id, company_title, name, email')
          .eq('tenant_id', tenantId)
          .eq('status', 'active')
          .order('company_title')
        setSuppliers(fallback || [])
        return
      }
      setSuppliers(data || [])
    } catch (e) {
      console.error(e)
      setSuppliers([])
    }
  }

  function addLine() {
    setLineItems((prev) => [...prev, { id: crypto.randomUUID(), product_id: null, description: '', quantity: '1', unit_price: '', vat_rate: DEFAULT_VAT_RATE }])
  }

  function removeLine(id: string) {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev))
  }

  function updateLine(id: string, field: keyof LineItem, value: string | number | null) {
    setLineItems((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  function selectProductForLine(lineId: string, productId: string | null) {
    if (!productId) {
      updateLine(lineId, 'product_id', null)
      updateLine(lineId, 'description', '')
      updateLine(lineId, 'unit_price', '')
      return
    }
    const p = products.find((x) => x.id === productId)
    if (!p) return
    updateLine(lineId, 'product_id', productId)
    updateLine(lineId, 'description', p.name)
    updateLine(lineId, 'unit_price', String(p.purchase_price ?? 0))
    if (p.vat_rate != null) updateLine(lineId, 'vat_rate', normalizeVatRate(p.vat_rate))
  }

  function computeLineValues(line: LineItem) {
    const qty = parseFloat(line.quantity.replace(',', '.')) || 0
    const price = parseFloat(line.unit_price.replace(',', '.')) || 0
    const subtotal = Math.round(qty * price * 100) / 100
    const taxAmount = Math.round(subtotal * (line.vat_rate / 100) * 100) / 100
    const total = Math.round((subtotal + taxAmount) * 100) / 100
    return { subtotal, taxAmount, total }
  }

  function computeTotals() {
    let subtotal = 0
    let taxAmount = 0
    let total = 0
    lineItems.forEach((line) => {
      const v = computeLineValues(line)
      subtotal += v.subtotal
      taxAmount += v.taxAmount
      total += v.total
    })
    return { subtotal: Math.round(subtotal * 100) / 100, taxAmount: Math.round(taxAmount * 100) / 100, total: Math.round(total * 100) / 100 }
  }

  function tryImportFromEInvoice() {
    const xml = eInvoiceXml.trim()
    if (!xml) {
      toast.error(language === 'tr' ? 'XML yapıştırın veya dosya yükleyin.' : 'Paste XML or upload file.')
      return
    }
    try {
      const parsed = parseUblInvoiceLines(xml)
      const lines: LineItem[] = parsed.map((p) => ({
        id: crypto.randomUUID(),
        product_id: null,
        description: p.description,
        quantity: String(p.quantity),
        unit_price: p.unit_price.toFixed(2),
        vat_rate: p.tax_rate ?? DEFAULT_VAT_RATE,
      }))
      if (lines.length > 0) {
        setLineItems(lines)
        setShowEInvoiceImport(false)
        setEInvoiceXml('')
        toast.success(language === 'tr' ? `${lines.length} satır içe aktarıldı.` : `${lines.length} line(s) imported.`)
      } else {
        toast.info(t.expenses.importFromEInvoiceSoon)
      }
    } catch {
      toast.info(t.expenses.importFromEInvoiceSoon)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantId) {
      toast.error(t.common.noData)
      return
    }
    if (!formData.supplier_id || !formData.invoice_number || !formData.invoice_date) {
      toast.error(t.expenses.requiredFieldsIncoming)
      return
    }
    const validLines = lineItems.filter((l) => {
      const qty = parseFloat(l.quantity.replace(',', '.'))
      const price = parseFloat(l.unit_price.replace(',', '.'))
      return l.description.trim() !== '' && !isNaN(qty) && qty > 0 && !isNaN(price) && price >= 0
    })
    if (validLines.length === 0) {
      toast.error(t.expenses.atLeastOneLine)
      return
    }
    let subtotal = 0
    let taxAmount = 0
    let totalAmount = 0
    validLines.forEach((line) => {
      const v = computeLineValues(line)
      subtotal += v.subtotal
      taxAmount += v.taxAmount
      totalAmount += v.total
    })
    subtotal = Math.round(subtotal * 100) / 100
    taxAmount = Math.round(taxAmount * 100) / 100
    totalAmount = Math.round(totalAmount * 100) / 100
    if (totalAmount <= 0) {
      toast.error(t.expenses.validTotalAmount)
      return
    }
    setLoading(true)
    try {
      const dueDate = formData.due_date || formData.invoice_date
      const isEdit = mode === 'edit' && !!initialInvoice?.id

      if (isEdit && initialInvoice?.id) {
        const { error: updError } = await supabase
          .from('purchase_invoices')
          .update({
            supplier_id: formData.supplier_id,
            invoice_number: formData.invoice_number.trim(),
            invoice_date: formData.invoice_date,
            due_date: dueDate || null,
            subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            invoice_type: formData.invoice_type || 'fatura_olustur',
          })
          .eq('tenant_id', tenantId)
          .eq('id', initialInvoice.id)
        if (updError) throw updError

        const { error: delErr } = await supabase
          .from('purchase_invoice_line_items')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('purchase_invoice_id', initialInvoice.id)
        if (delErr) throw delErr

        for (const line of validLines) {
          const { taxAmount: lineTax, total: lineTotal } = computeLineValues(line)
          const { error: insErr } = await supabase.from('purchase_invoice_line_items').insert({
            tenant_id: tenantId,
            purchase_invoice_id: initialInvoice.id,
            product_id: line.product_id || null,
            description: line.description.trim(),
            quantity: parseFloat(line.quantity.replace(',', '.')),
            unit_price: parseFloat(line.unit_price.replace(',', '.')),
            tax_rate: line.vat_rate,
            tax_amount: lineTax,
            total: lineTotal,
          })
          if (insErr) throw insErr
        }
        toast.success(language === 'tr' ? 'Fatura güncellendi.' : 'Invoice updated.')
      } else {
        const { data: inserted, error: invError } = await supabase
          .from('purchase_invoices')
          .insert({
            tenant_id: tenantId,
            supplier_id: formData.supplier_id,
            invoice_number: formData.invoice_number.trim(),
            invoice_date: formData.invoice_date,
            due_date: dueDate || null,
            subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            status: 'pending',
            invoice_type: formData.invoice_type || 'fatura_olustur',
          })
          .select('id')
          .single()
        if (invError || !inserted) throw invError || new Error('Insert failed')
        for (const line of validLines) {
          const { taxAmount: lineTax, total: lineTotal } = computeLineValues(line)
          await supabase.from('purchase_invoice_line_items').insert({
            tenant_id: tenantId,
            purchase_invoice_id: inserted.id,
            product_id: line.product_id || null,
            description: line.description.trim(),
            quantity: parseFloat(line.quantity.replace(',', '.')),
            unit_price: parseFloat(line.unit_price.replace(',', '.')),
            tax_rate: line.vat_rate,
            tax_amount: lineTax,
            total: lineTotal,
          })
        }
        toast.success(t.expenses.invoiceAdded)
      }
      onSuccess()
      if (!asPage) onOpenChange(false)
      setFormData({
        supplier_id: '',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        invoice_type: 'fatura_olustur',
      })
      setLineItems([{ id: crypto.randomUUID(), product_id: null, description: '', quantity: '1', unit_price: '', vat_rate: DEFAULT_VAT_RATE }])
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || t.expenses.invoiceAddFailed)
    } finally {
      setLoading(false)
    }
  }

  const isTr = language === 'tr'

  const title = mode === 'edit'
    ? (language === 'tr' ? 'Gelen fatura düzenle' : 'Edit incoming invoice')
    : t.expenses.addIncomingInvoiceTitle
  const description = mode === 'edit'
    ? (language === 'tr' ? 'Fatura bilgilerini ve satırlarını güncelleyin.' : 'Update invoice details and line items.')
    : t.expenses.addIncomingInvoiceDescription

  const headerFragment = asPage ? (
    <div className="space-y-1.5 pb-4">
      <h2 className="text-lg font-semibold leading-none tracking-tight uppercase">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  ) : (
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
  )

  const content = (
    <>
      {headerFragment}
      <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.expenses.supplier} *</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.expenses.selectSupplier} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">{t.expenses.noSuppliersHint}</div>
                  )}
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.company_title || s.name || s.email || s.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.expenses.invoiceNumber} *</Label>
              <Input
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder={t.expenses.invoiceNumberPlaceholder}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.expenses.invoiceDate} *</Label>
              <Input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t.expenses.dueDate}</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>{t.expenses.lineItems}</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowEInvoiceImport((v) => !v)} className="text-xs">
                <FileText className="h-3.5 w-3.5 mr-1" />
                {t.expenses.importFromEInvoice}
              </Button>
            </div>
            {showEInvoiceImport && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">{t.expenses.pasteEInvoiceXml}</p>
                <Textarea
                  value={eInvoiceXml}
                  onChange={(e) => setEInvoiceXml(e.target.value)}
                  placeholder="XML..."
                  rows={4}
                  className="font-mono text-xs"
                />
                <Button type="button" size="sm" onClick={tryImportFromEInvoice}>
                  {language === 'tr' ? 'İçe aktar' : 'Import'}
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {lineItems.map((line) => {
                const { total: lineTotal } = computeLineValues(line)
                return (
                  <div key={line.id} className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <Label className="text-xs">{t.expenses.selectProductOrService}</Label>
                      <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => removeLine(line.id)} title={t.expenses.deleteLine}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Select
                      value={line.product_id || 'manual'}
                      onValueChange={(v) => selectProductForLine(line.id, v === 'manual' ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.expenses.selectProductOrService} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">{t.expenses.manualEntry}</SelectItem>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}{p.sku ? ` (${p.sku})` : ''} — {Number(p.purchase_price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div>
                      <Label className="text-xs">{t.expenses.lineDescription}</Label>
                      <Textarea
                        value={line.description}
                        onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                        placeholder={t.expenses.lineDescription}
                        rows={2}
                        className="text-sm mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{t.expenses.quantity}</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t.expenses.unitPrice}</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={line.unit_price}
                          onChange={(e) => updateLine(line.id, 'unit_price', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t.expenses.vatRate}</Label>
                        <Select value={String(line.vat_rate)} onValueChange={(v) => updateLine(line.id, 'vat_rate', Number(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VAT_RATES.map((r) => (
                              <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-right">{t.expenses.lineTotal}: {lineTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                  </div>
                )
              })}
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t.expenses.addLine}
              </Button>
            </div>

            {(() => {
              const { subtotal, taxAmount, total } = computeTotals()
              return (
                <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>{t.expenses.subtotal}</span>
                    <span className="font-medium">{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.expenses.totalVat}</span>
                    <span className="font-medium">{taxAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t">
                    <span>{t.expenses.grandTotal}</span>
                    <span>{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                  </div>
                </div>
              )
            })()}
          </div>

          <div className="space-y-2">
            <Label>{t.expenses.invoiceType}</Label>
            <Select
              value={formData.invoice_type}
              onValueChange={(v) => setFormData({ ...formData, invoice_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PURCHASE_TYPES.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>
                    {isTr ? pt.tr : pt.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.common.save}
            </Button>
          </DialogFooter>
        </form>
    </>
  )

  if (asPage) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 rounded-xl border border-blue-200 bg-blue-50/80 p-6 sm:p-8 lg:p-10 shadow-md min-h-[60vh]">
        {content}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {content}
      </DialogContent>
    </Dialog>
  )
}
