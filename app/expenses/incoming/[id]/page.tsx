'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AddManualPurchaseInvoiceDialog } from '@/components/add-manual-purchase-invoice-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useCurrency } from '@/contexts/currency-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'

interface LineItemRow {
  id: string
  description: string | null
  quantity: number
  unit_price: number
  tax_rate: number
  tax_amount: number
  total: number
}

interface PurchaseInvoiceRow {
  id: string
  supplier_id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  total_amount: number
  subtotal?: number
  tax_amount?: number
  status: 'pending' | 'accepted' | 'rejected'
  invoice_type: string
  supplier: { company_title: string; name: string } | null
  supplier_display_name?: string | null
}

const PURCHASE_TYPE_LABELS: Record<string, Record<string, string>> = {
  purchase: { tr: 'Alış', en: 'Purchase' },
  purchase_return: { tr: 'Alıştan İade', en: 'Purchase Return' },
  devir: { tr: 'Devir', en: 'Carry Forward' },
  devir_return: { tr: 'Devir İade', en: 'Carry Fwd Return' },
  fatura_olustur: { tr: 'Fatura Oluştur', en: 'Create Invoice' },
  konaklama_ver_faturasi: { tr: 'Konaklama Ver. Faturası Oluştur', en: 'Create Accommodation Tax Invoice' },
  maas_odemesi: { tr: 'Maaş Ödemesi Oluştur', en: 'Create Salary Payment' },
  vergi_odemesi: { tr: 'Vergi Ödemesi Oluştur', en: 'Create Tax Payment' },
  diger: { tr: 'Diğer', en: 'Other' },
  fis: { tr: 'Fiş', en: 'Receipt' },
}
const PURCHASE_TYPE_COLORS: Record<string, string> = {
  purchase: 'bg-emerald-100 text-emerald-800',
  purchase_return: 'bg-orange-100 text-orange-800',
  devir: 'bg-violet-100 text-violet-800',
  devir_return: 'bg-pink-100 text-pink-800',
  fatura_olustur: 'bg-blue-100 text-blue-800',
  konaklama_ver_faturasi: 'bg-amber-100 text-amber-800',
  maas_odemesi: 'bg-teal-100 text-teal-800',
  vergi_odemesi: 'bg-rose-100 text-rose-800',
  diger: 'bg-gray-100 text-gray-800',
  fis: 'bg-sky-100 text-sky-800',
}

export default function IncomingInvoiceDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const rawId = params?.id
  const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : undefined
  const mode = searchParams?.get('mode') // 'edit' | null (view)
  const { tenantId } = useTenant()
  const { formatCurrency } = useCurrency()
  const { t, language } = useLanguage()

  const [invoice, setInvoice] = useState<PurchaseInvoiceRow | null>(null)
  const [lineItems, setLineItems] = useState<LineItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) {
      setNotFound(true)
      setLoading(false)
      return
    }
    if (!tenantId) return
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    ;(async () => {
      const [invRes, linesRes] = await Promise.all([
        supabase
          .from('purchase_invoices')
          .select('id, supplier_id, invoice_number, invoice_date, due_date, subtotal, tax_amount, total_amount, status, invoice_type, supplier_display_name, supplier:customers(company_title, name)')
          .eq('tenant_id', tenantId)
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('purchase_invoice_line_items')
          .select('id, description, quantity, unit_price, tax_rate, tax_amount, total')
          .eq('tenant_id', tenantId)
          .eq('purchase_invoice_id', id)
          .order('id', { ascending: true }),
      ])
      if (cancelled) return
      if (invRes.error || !invRes.data) {
        setNotFound(true)
        setInvoice(null)
        setLineItems([])
      } else {
        setInvoice(invRes.data as PurchaseInvoiceRow)
        setLineItems((linesRes.data ?? []) as LineItemRow[])
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [tenantId, id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
          {language === 'tr' ? 'Yükleniyor...' : 'Loading...'}
        </div>
      </DashboardLayout>
    )
  }

  if (notFound || !invoice) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <p className="text-muted-foreground">{language === 'tr' ? 'Fatura bulunamadı.' : 'Invoice not found.'}</p>
          <Button variant="outline" onClick={() => router.push('/expenses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'tr' ? 'Masraflara dön' : 'Back to expenses'}
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const isEdit = mode === 'edit'

  if (isEdit) {
    return (
      <DashboardLayout>
        <div className="w-full max-w-[1600px] mx-auto space-y-6 px-2 sm:px-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#0A2540] hover:bg-gray-100"
            onClick={() => router.push('/expenses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'tr' ? 'Masraflar / Gelen faturalar' : 'Expenses / Incoming invoices'}
          </Button>
          <AddManualPurchaseInvoiceDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) router.push(`/expenses/incoming/${id}`)
            }}
            onSuccess={() => {
              toast.success(language === 'tr' ? 'Fatura güncellendi.' : 'Invoice updated.')
              router.push(`/expenses/incoming/${id}`)
            }}
            mode="edit"
            initialInvoice={{
              id: invoice.id,
              supplier_id: invoice.supplier_id,
              invoice_number: invoice.invoice_number,
              invoice_date: invoice.invoice_date,
              due_date: invoice.due_date,
              invoice_type: invoice.invoice_type,
            }}
            asPage
          />
        </div>
      </DashboardLayout>
    )
  }

  const subtotal = invoice.subtotal ?? lineItems.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const taxTotal = invoice.tax_amount ?? lineItems.reduce((s, l) => s + Number(l.tax_amount ?? 0), 0)
  const grandTotal = Number(invoice.total_amount)

  const formatUnitPrice = (value: number) =>
    Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
  const formatTotal = (value: number) => formatCurrency(value)

  return (
    <DashboardLayout>
      <div className="w-full max-w-[1600px] mx-auto space-y-6 px-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#0A2540] hover:bg-gray-100"
            onClick={() => router.push('/expenses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'tr' ? 'Masraflar / Gelen faturalar' : 'Expenses / Incoming invoices'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/expenses/incoming/${id}?mode=edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            {t.common.edit}
          </Button>
        </div>
        <div className="w-full max-w-6xl mx-auto space-y-6 rounded-xl border border-gray-200 bg-white p-6 sm:p-8 lg:p-10 shadow-md">
          <h2 className="text-lg font-semibold leading-none tracking-tight uppercase text-[#0A2540]">
            {t.common.view} – {t.expenses.incomingInvoices}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="font-medium text-gray-500 block">{t.expenses.supplier}</span>
              <p className="font-medium text-[#0A2540]">{invoice.supplier_id ? (invoice.supplier?.company_title || invoice.supplier?.name) : (invoice.supplier_display_name || '–')}</p>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-gray-500 block">{t.expenses.invoiceNumber}</span>
              <p className="font-medium text-[#0A2540]">{invoice.invoice_number}</p>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-gray-500 block">{t.expenses.invoiceDate}</span>
              <p>{format(new Date(invoice.invoice_date), 'dd MMM yyyy')}</p>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-gray-500 block">{t.expenses.dueDate}</span>
              <p>{invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yyyy') : '–'}</p>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-gray-500 block">{t.expenses.invoiceTypeColumn}</span>
              <p>
                <Badge
                  className={PURCHASE_TYPE_COLORS[invoice.invoice_type || 'purchase'] || 'bg-gray-100 text-gray-800'}
                  variant="secondary"
                >
                  {PURCHASE_TYPE_LABELS[invoice.invoice_type || 'purchase']?.[language] || invoice.invoice_type || 'purchase'}
                </Badge>
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-gray-500 block">{t.common.status}</span>
              <p>
                {invoice.status === 'pending' && <Badge variant="outline">{t.expenses.pending}</Badge>}
                {invoice.status === 'accepted' && <Badge className="bg-green-500">{t.expenses.accepted}</Badge>}
                {invoice.status === 'rejected' && <Badge variant="destructive">{t.expenses.rejected}</Badge>}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#0A2540] mb-3">{t.expenses.lineItems}</h3>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-medium text-gray-600">#</TableHead>
                    <TableHead className="text-xs font-medium text-gray-600">{t.expenses.lineDescription}</TableHead>
                    <TableHead className="text-xs font-medium text-gray-600 text-right">{t.expenses.quantity}</TableHead>
                    <TableHead className="text-xs font-medium text-gray-600 text-right">{t.expenses.unitPrice}</TableHead>
                    <TableHead className="text-xs font-medium text-gray-600 text-right">{language === 'tr' ? 'KDV %' : 'VAT %'}</TableHead>
                    <TableHead className="text-xs font-medium text-gray-600 text-right">{language === 'tr' ? 'KDV Tutarı' : 'VAT Amount'}</TableHead>
                    <TableHead className="text-xs font-medium text-gray-600 text-right">{t.expenses.lineTotal}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-4 text-sm">
                        {language === 'tr' ? 'Satır yok.' : 'No line items.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    lineItems.map((line, idx) => (
                      <TableRow key={line.id}>
                        <TableCell className="text-sm">{idx + 1}</TableCell>
                        <TableCell className="text-sm">{line.description || '–'}</TableCell>
                        <TableCell className="text-sm text-right">{Number(line.quantity)}</TableCell>
                        <TableCell className="text-sm text-right">{formatUnitPrice(Number(line.unit_price))} ₺</TableCell>
                        <TableCell className="text-sm text-right">%{Number(line.tax_rate ?? 0)}</TableCell>
                        <TableCell className="text-sm text-right">{formatTotal(Number(line.tax_amount ?? 0))}</TableCell>
                        <TableCell className="text-sm text-right font-medium">{formatTotal(Number(line.total ?? 0))}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 space-y-2 text-sm max-w-md ml-auto">
            <div className="flex justify-between">
              <span className="text-gray-600">{t.expenses.subtotal}</span>
              <span className="font-medium">{formatTotal(Number(subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t.expenses.totalVat}</span>
              <span className="font-medium">{formatTotal(Number(taxTotal))}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-blue-200">
              <span>{t.expenses.grandTotal}</span>
              <span>{formatTotal(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
