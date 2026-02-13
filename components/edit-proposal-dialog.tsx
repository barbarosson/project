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
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useTenant } from '@/contexts/tenant-context'
import { Plus, Trash2 } from 'lucide-react'

interface Proposal {
  id: string
  customer_id: string
  proposal_number: string
  created_at?: string
  proposal_date?: string
  valid_until: string
  subtotal: number
  vat_total: number
  total: number
  status: string
  notes: string
  terms: string
}

interface EditProposalDialogProps {
  proposal: Proposal | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface LineItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  total: number
}

export function EditProposalDialog({ proposal, isOpen, onClose, onSuccess }: EditProposalDialogProps) {
  const { tenantId } = useTenant()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [formData, setFormData] = useState({
    customer_id: '',
    proposal_date: '',
    valid_until: '',
    tax_rate: '18',
    status: 'draft',
    notes: '',
    terms: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      fetchProducts()
    }
  }, [isOpen])

  useEffect(() => {
    if (proposal) {
      const today = new Date().toISOString().split('T')[0]
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const proposalDate = proposal.proposal_date || proposal.created_at
      setFormData({
        customer_id: proposal.customer_id,
        proposal_date: proposalDate ? proposalDate.split('T')[0] : today,
        valid_until: proposal.valid_until ? proposal.valid_until.split('T')[0] : futureDate,
        tax_rate: '18',
        status: proposal.status || 'draft',
        notes: proposal.notes || '',
        terms: proposal.terms || ''
      })
      fetchLineItems(proposal.id)
    }
  }, [proposal])

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('*').eq('status', 'active').order('company_title')
    setCustomers(data || [])
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').eq('status', 'active').order('name')
    setProducts(data || [])
  }

  async function fetchLineItems(proposalId: string) {
    const { data } = await supabase
      .from('proposal_line_items')
      .select('*')
      .eq('proposal_id', proposalId)

    if (data) {
      const normalizedData = data.map(item => ({
        ...item,
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        total: item.total || 0
      }))
      setLineItems(normalizedData)
    }
  }

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        product_id: '',
        quantity: 1,
        unit_price: 0,
        total: 0
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
            updated.total = updated.quantity * product.sale_price
          }
        } else if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price
        }
        return updated
      }
      return item
    }))
  }

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0)
    const taxAmount = subtotal * (parseFloat(formData.tax_rate) / 100)
    const total = subtotal + taxAmount
    return { subtotal, taxAmount, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!proposal) return

    const validItems = lineItems.filter(item => item.product_id && item.quantity > 0)
    if (validItems.length === 0) {
      toast.error('Please add at least one line item')
      return
    }

    setLoading(true)

    try {
      if (!tenantId) {
        throw new Error('No tenant ID available')
      }

      const { subtotal, taxAmount, total } = calculateTotals()

      const { error: proposalError } = await supabase
        .from('proposals')
        .update({
          customer_id: formData.customer_id,
          proposal_date: formData.proposal_date,
          valid_until: formData.valid_until,
          subtotal,
          vat_total: taxAmount,
          total: total,
          status: formData.status,
          notes: formData.notes,
          terms: formData.terms,
          tenant_id: tenantId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposal.id)

      if (proposalError) throw proposalError

      await supabase.from('proposal_line_items').delete().eq('proposal_id', proposal.id)

      const lineItemsData = validItems.map(item => ({
        proposal_id: proposal.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        tenant_id: tenantId,
      }))

      const { error: lineItemsError } = await supabase
        .from('proposal_line_items')
        .insert(lineItemsData)

      if (lineItemsError) throw lineItemsError

      toast.success('Proposal updated successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating proposal:', error)
      toast.error(error.message || 'Failed to update proposal')
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Proposal</DialogTitle>
          <DialogDescription>
            Update proposal details and line items
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.company_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proposal Date *</Label>
              <Input
                type="date"
                value={formData.proposal_date}
                onChange={(e) => setFormData({ ...formData, proposal_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Valid Until *</Label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Line Items</Label>
            <div className="border rounded-lg p-4 space-y-2">
              {lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2">
                  <Select
                    value={item.product_id}
                    onValueChange={(value) => updateLineItem(item.id, 'product_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
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
                    placeholder="Qty"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value))}
                    placeholder="Price"
                  />
                  <Input value={(item.total || 0).toFixed(2)} readOnly placeholder="Total" />
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
                Add Line Item
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Terms & Conditions</Label>
            <Textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows={2}
            />
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({formData.tax_rate}%):</span>
              <span className="font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Proposal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
