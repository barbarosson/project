'use client'

import { useEffect, useState } from 'react'
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
import { useCurrency } from '@/contexts/currency-context'
import { Plus, Trash2 } from 'lucide-react'

interface BulkCreateInvoicesDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface InvoiceRow {
  id: string
  customer_id: string
  product_id: string
  quantity: string
  issue_date: string
  due_date: string
}

export function BulkCreateInvoicesDialog({ isOpen, onClose, onSuccess }: BulkCreateInvoicesDialogProps) {
  const { tenantId } = useTenant()
  const { currency: companyCurrency } = useCurrency()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [invoices, setInvoices] = useState<InvoiceRow[]>([
    {
      id: crypto.randomUUID(),
      customer_id: '',
      product_id: '',
      quantity: '1',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ])

  useEffect(() => {
    if (isOpen && tenantId) {
      fetchCustomers()
      fetchProducts()
    }
  }, [isOpen, tenantId])

  async function fetchCustomers() {
    if (!tenantId) return
    const { data } = await supabase.from('customers').select('*').eq('tenant_id', tenantId).eq('status', 'active').order('company_title')
    setCustomers(data || [])
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').eq('status', 'active').order('name')
    setProducts(data || [])
  }

  const addRow = () => {
    if (invoices.length >= 50) {
      toast.warning('Maximum 50 invoices can be created at once')
      return
    }
    setInvoices([
      ...invoices,
      {
        id: crypto.randomUUID(),
        customer_id: '',
        product_id: '',
        quantity: '1',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ])
  }

  const removeRow = (id: string) => {
    if (invoices.length > 1) {
      setInvoices(invoices.filter(inv => inv.id !== id))
    }
  }

  const updateRow = (id: string, field: keyof InvoiceRow, value: string) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, [field]: value } : inv))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validInvoices = invoices.filter(inv => inv.customer_id && inv.product_id && inv.quantity)

    if (validInvoices.length === 0) {
      toast.error('Please fill in at least one invoice')
      return
    }

    if (validInvoices.length > 50) {
      toast.error('Maximum 50 invoices can be created at once. Please reduce the number of items.')
      return
    }

    setLoading(true)

    try {
      if (!tenantId) {
        throw new Error('No tenant ID available')
      }

      let successCount = 0
      const BATCH_SIZE = 10

      for (let i = 0; i < validInvoices.length; i += BATCH_SIZE) {
        const batch = validInvoices.slice(i, i + BATCH_SIZE)

        for (const inv of batch) {
          try {
            const product = products.find(p => p.id === inv.product_id)
            if (!product) {
              console.warn(`Product not found: ${inv.product_id}`)
              continue
            }

            const quantity = parseInt(inv.quantity)
            const unitPrice = product.sale_price
            const subtotal = quantity * unitPrice
            const taxAmount = subtotal * 0.18
            const total = subtotal + taxAmount

            const { data: lastInvoiceData } = await supabase
              .from('invoices')
              .select('invoice_number')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            let invoiceNumber = 'INV-0001'
            if (lastInvoiceData?.invoice_number) {
              const lastNum = parseInt(lastInvoiceData.invoice_number.split('-')[1])
              invoiceNumber = `INV-${String(lastNum + successCount + 1).padStart(4, '0')}`
            } else {
              invoiceNumber = `INV-${String(successCount + 1).padStart(4, '0')}`
            }

            const { data: newInvoice, error: invoiceError } = await supabase
              .from('invoices')
              .insert({
                customer_id: inv.customer_id,
                invoice_number: invoiceNumber,
                issue_date: inv.issue_date,
                due_date: inv.due_date,
                subtotal,
                total_vat: taxAmount,
                total,
                amount: total,
                status: 'draft',
                currency: companyCurrency || 'TRY',
                tenant_id: tenantId,
              })
              .select()
              .maybeSingle()

            if (invoiceError) {
              console.error(`Failed to create invoice: ${invoiceError.message}`)
              continue
            }

            if (!newInvoice) continue

            const lineTotal = quantity * unitPrice
            const vatAmount = lineTotal * 0.18
            const totalWithVat = lineTotal + vatAmount

            await supabase.from('invoice_line_items').insert({
              invoice_id: newInvoice.id,
              product_id: inv.product_id,
              product_name: product.name,
              description: product.description || '',
              quantity,
              unit_price: unitPrice,
              vat_rate: 18,
              line_total: lineTotal,
              vat_amount: vatAmount,
              total_with_vat: totalWithVat,
              tenant_id: tenantId,
            })

            const { data: inventory } = await supabase
              .from('inventory')
              .select('stock_quantity')
              .eq('product_id', inv.product_id)
              .maybeSingle()

            if (inventory) {
              await supabase
                .from('inventory')
                .update({ stock_quantity: inventory.stock_quantity - quantity })
                .eq('product_id', inv.product_id)

              await supabase.from('stock_movements').insert({
                product_id: inv.product_id,
                movement_type: 'out',
                quantity,
                reference_type: 'invoice',
                reference_id: newInvoice.id,
                notes: `Invoice ${invoiceNumber}`,
                tenant_id: tenantId,
              })
            }

            const { data: customer } = await supabase
              .from('customers')
              .select('balance')
              .eq('id', inv.customer_id)
              .maybeSingle()

            if (customer) {
              await supabase
                .from('customers')
                .update({ balance: (customer.balance || 0) + total })
                .eq('id', inv.customer_id)
            }

            successCount++
          } catch (itemError: any) {
            console.error('Error creating invoice item:', itemError)
          }
        }

        if (validInvoices.length > BATCH_SIZE) {
          toast.info(`Progress: ${Math.min(i + BATCH_SIZE, validInvoices.length)}/${validInvoices.length} invoices processed...`)
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} invoices`)
        onSuccess()
        handleClose()
      } else {
        toast.error('No invoices were created. Please check your data and try again.')
      }
    } catch (error: any) {
      console.error('Error bulk creating invoices:', error)
      if (error.message?.includes('payload') || error.code === '413') {
        toast.error('Too much data. Please reduce the number of invoices and try again.')
      } else {
        toast.error(error.message || 'Failed to create invoices')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setInvoices([
      {
        id: crypto.randomUUID(),
        customer_id: '',
        product_id: '',
        quantity: '1',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Create Invoices</DialogTitle>
          <DialogDescription>
            Create multiple invoices at once (one product per invoice, Maximum: 50 invoices)
            {invoices.length >= 40 && (
              <span className="text-amber-600 font-medium ml-2">
                ({invoices.length}/50 rows)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1.5fr_auto] gap-2 text-sm font-medium mb-2">
              <div>Customer *</div>
              <div>Product *</div>
              <div>Qty *</div>
              <div>Invoice Date *</div>
              <div>Due Date *</div>
              <div></div>
            </div>

            {invoices.map((invoice) => (
              <div key={invoice.id} className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1.5fr_auto] gap-2">
                <Select
                  value={invoice.customer_id}
                  onValueChange={(value) => updateRow(invoice.id, 'customer_id', value)}
                >
                  <SelectTrigger data-field="bulk-invoices-customer">
                    <SelectValue placeholder="Select" />
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
                <Select
                  value={invoice.product_id}
                  onValueChange={(value) => updateRow(invoice.id, 'product_id', value)}
                >
                  <SelectTrigger data-field="bulk-invoices-product">
                    <SelectValue placeholder="Select" />
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
                  value={invoice.quantity}
                  onChange={(e) => updateRow(invoice.id, 'quantity', e.target.value)}
                  placeholder="1"
                />
                <Input
                  type="date"
                  value={invoice.issue_date}
                  onChange={(e) => updateRow(invoice.id, 'issue_date', e.target.value)}
                />
                <Input
                  type="date"
                  value={invoice.due_date}
                  onChange={(e) => updateRow(invoice.id, 'due_date', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(invoice.id)}
                  disabled={invoices.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addRow} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : `Create ${invoices.filter(i => i.customer_id && i.product_id).length} Invoices`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
