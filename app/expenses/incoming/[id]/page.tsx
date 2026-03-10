'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AddManualPurchaseInvoiceDialog } from '@/components/add-manual-purchase-invoice-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useCurrency } from '@/contexts/currency-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'

interface PurchaseInvoiceRow {
  id: string
  supplier_id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  total_amount: number
  status: 'pending' | 'accepted' | 'rejected'
  invoice_type: string
  supplier: { company_title: string; name: string } | null
}

const PURCHASE_TYPE_LABELS: Record<string, Record<string, string>> = {
  purchase: { tr: 'Alış', en: 'Purchase' },
  purchase_return: { tr: 'Alıştan İade', en: 'Purchase Return' },
  devir: { tr: 'Devir', en: 'Carry Forward' },
  devir_return: { tr: 'Devir İade', en: 'Carry Fwd Return' },
}
const PURCHASE_TYPE_COLORS: Record<string, string> = {
  purchase: 'bg-emerald-100 text-emerald-800',
  purchase_return: 'bg-orange-100 text-orange-800',
  devir: 'bg-violet-100 text-violet-800',
  devir_return: 'bg-pink-100 text-pink-800',
}

export default function IncomingInvoiceDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params?.id as string | undefined
  const mode = searchParams?.get('mode') // 'edit' | null (view)
  const { tenantId } = useTenant()
  const { formatCurrency } = useCurrency()
  const { t, language } = useLanguage()

  const [invoice, setInvoice] = useState<PurchaseInvoiceRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!tenantId || !id) {
      if (!id) setNotFound(true)
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('purchase_invoices')
        .select(`
          id,
          supplier_id,
          invoice_number,
          invoice_date,
          due_date,
          total_amount,
          status,
          invoice_type,
          supplier:customers!purchase_invoices_supplier_id_fkey(company_title, name)
        `)
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .single()
      if (cancelled) return
      if (error || !data) {
        setNotFound(true)
        setInvoice(null)
      } else {
        setInvoice(data as PurchaseInvoiceRow)
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
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm max-w-lg">
          <h2 className="text-lg font-semibold text-[#0A2540] mb-4">
            {t.common.view} – {t.expenses.incomingInvoices}
          </h2>
          <div className="grid gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-500">{t.expenses.invoiceNumber}</span>
              <p className="font-medium">{invoice.invoice_number}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">{t.expenses.invoiceTypeColumn}</span>
              <p>
                <Badge
                  className={PURCHASE_TYPE_COLORS[invoice.invoice_type || 'purchase'] || 'bg-gray-100 text-gray-800'}
                  variant="secondary"
                >
                  {PURCHASE_TYPE_LABELS[invoice.invoice_type || 'purchase']?.[language] || invoice.invoice_type || 'purchase'}
                </Badge>
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-500">{t.expenses.supplier}</span>
              <p>{invoice.supplier?.company_title || invoice.supplier?.name || '–'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">{t.expenses.invoiceDate}</span>
              <p>{format(new Date(invoice.invoice_date), 'dd MMM yyyy')}</p>
            </div>
            {invoice.due_date && (
              <div>
                <span className="font-medium text-gray-500">{t.expenses.dueDate}</span>
                <p>{format(new Date(invoice.due_date), 'dd MMM yyyy')}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-500">{t.expenses.total}</span>
              <p className="font-semibold">{formatCurrency(Number(invoice.total_amount), 'TRY')}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">{t.common.status}</span>
              <p>
                {invoice.status === 'pending' && <Badge variant="outline">{t.expenses.pending}</Badge>}
                {invoice.status === 'accepted' && <Badge className="bg-green-500">{t.expenses.accepted}</Badge>}
                {invoice.status === 'rejected' && <Badge variant="destructive">{t.expenses.rejected}</Badge>}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
