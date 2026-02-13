'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Eye, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EInvoicePreview } from '@/components/e-invoice-preview'
import { Toaster } from '@/components/ui/sonner'
import { useTenant } from '@/contexts/tenant-context'

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

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  amount: number
  subtotal: number
  total_vat: number
  status: string
  issue_date: string
  due_date: string
  notes: string
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

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showEInvoice, setShowEInvoice] = useState(false)

  useEffect(() => {
    if (!tenantLoading && tenantId && invoiceId) {
      fetchInvoiceDetails()
    }
  }, [tenantId, tenantLoading, invoiceId])

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
          <p className="text-gray-500">Invoice not found</p>
          <Button onClick={() => router.push('/invoices')} className="mt-4">
            Back to Invoices
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
              variant="ghost"
              size="icon"
              onClick={() => router.push('/invoices')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{invoice.invoice_number}</h1>
              <p className="text-gray-500 mt-1">Invoice Details</p>
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
                      <td className="p-2 text-right">${item.unit_price.toFixed(2)}</td>
                      <td className="p-2 text-right">${item.line_total.toFixed(2)}</td>
                      <td className="p-2 text-right">
                        ${item.vat_amount.toFixed(2)}
                        <span className="text-xs text-gray-500 ml-1">({item.vat_rate}%)</span>
                      </td>
                      <td className="p-2 text-right font-semibold">${item.total_with_vat.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Total VAT:</span>
                  <span className="font-semibold">${invoice.total_vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 bg-[#00D4AA] text-white px-4 rounded-lg">
                  <span className="font-bold text-lg">Grand Total:</span>
                  <span className="font-bold text-lg">${invoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
