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
import { Loader2 } from 'lucide-react'

interface Supplier {
  id: string
  company_title: string | null
  name: string | null
  email: string | null
}

interface AddManualPurchaseInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const PURCHASE_TYPES = [
  { value: 'purchase', tr: 'Alış', en: 'Purchase' },
  { value: 'purchase_return', tr: 'Alıştan İade', en: 'Purchase Return' },
  { value: 'devir', tr: 'Devir', en: 'Carry Forward' },
  { value: 'devir_return', tr: 'Devir İade', en: 'Carry Fwd Return' },
] as const

export function AddManualPurchaseInvoiceDialog({ open, onOpenChange, onSuccess }: AddManualPurchaseInvoiceDialogProps) {
  const { tenantId } = useTenant()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    total_amount: '',
    invoice_type: 'purchase' as string,
  })

  useEffect(() => {
    if (open && tenantId) {
      fetchSuppliers()
    }
  }, [open, tenantId])

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantId) {
      toast.error(language === 'tr' ? 'Kiracı bilgisi yok' : 'No tenant ID available')
      return
    }
    if (!formData.supplier_id || !formData.invoice_number || !formData.invoice_date || !formData.total_amount) {
      toast.error(language === 'tr' ? 'Tedarikçi, fatura no, tarih ve toplam tutar zorunludur' : 'Supplier, invoice number, date and total are required')
      return
    }
    const total = parseFloat(formData.total_amount.replace(',', '.'))
    if (isNaN(total) || total <= 0) {
      toast.error(language === 'tr' ? 'Geçerli bir toplam tutar girin' : 'Enter a valid total amount')
      return
    }
    setLoading(true)
    try {
      const dueDate = formData.due_date || formData.invoice_date
      const { error } = await supabase.from('purchase_invoices').insert({
        tenant_id: tenantId,
        supplier_id: formData.supplier_id,
        invoice_number: formData.invoice_number.trim(),
        invoice_date: formData.invoice_date,
        due_date: dueDate || null,
        subtotal: total,
        tax_amount: 0,
        total_amount: total,
        status: 'pending',
        invoice_type: formData.invoice_type || 'purchase',
      })
      if (error) throw error
      toast.success(language === 'tr' ? 'Fatura eklendi' : 'Invoice added')
      onSuccess()
      onOpenChange(false)
      setFormData({
        supplier_id: '',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        total_amount: '',
        invoice_type: 'purchase',
      })
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || (language === 'tr' ? 'Fatura eklenemedi' : 'Failed to add invoice'))
    } finally {
      setLoading(false)
    }
  }

  const isTr = language === 'tr'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isTr ? 'Gelen fatura ekle' : 'Add incoming invoice'}</DialogTitle>
          <DialogDescription>
            {isTr ? 'Manuel gelen (tedarikçi) fatura girin.' : 'Enter a manual incoming (supplier) invoice.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t.expenses.supplier} *</Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={isTr ? 'Tedarikçi seçin' : 'Select supplier'} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">{isTr ? 'Tedarikçi yok (Cari ekranından vendor/both ekleyin)' : 'No suppliers (Add vendor/both from Customers)'}</div>
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
              placeholder="e.g. GFS-2025-001"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <Label>{t.expenses.total} *</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{isTr ? 'Fatura tipi' : 'Invoice type'}</Label>
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
      </DialogContent>
    </Dialog>
  )
}
