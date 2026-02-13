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
import { Plus, Trash2, Save, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { useTenant } from '@/contexts/tenant-context'

interface LineItem {
  id: string
  product_name: string
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  vat_rate: number
  line_total: number
  vat_amount: number
  total_with_vat: number
  product_id?: string
}

interface Customer {
  id: string
  name: string
  company_title: string
}

interface Product {
  id: string
  name: string
  sale_price: number
  vat_rate: number
}

export default function NewProposalPage() {
  const router = useRouter()
  const { tenantId, loading: tenantLoading } = useTenant()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState<string>('')
  const [terms, setTerms] = useState<string>('Payment terms: Net 30 days. 50% upfront, 50% upon completion.')

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      product_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      vat_rate: 20,
      line_total: 0,
      vat_amount: 0,
      total_with_vat: 0
    }
  ])

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchData()
    }
  }, [tenantId, tenantLoading])

  async function fetchData() {
    if (!tenantId) return

    try {
      const [customersRes, productsRes] = await Promise.all([
        supabase.from('customers').select('id, name, company_title').eq('tenant_id', tenantId).eq('status', 'active').order('name'),
        supabase.from('products').select('id, name, sale_price, vat_rate').eq('tenant_id', tenantId).eq('status', 'active').order('name')
      ])

      setCustomers(customersRes.data || [])
      setProducts(productsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  function calculateLineItem(item: LineItem): LineItem {
    const discountedPrice = item.unit_price * (1 - item.discount_percent / 100)
    const line_total = item.quantity * discountedPrice
    const vat_amount = line_total * (item.vat_rate / 100)
    const total_with_vat = line_total + vat_amount

    return {
      ...item,
      line_total,
      vat_amount,
      total_with_vat
    }
  }

  function addLineItem() {
    const newId = (Math.max(...lineItems.map(item => parseInt(item.id))) + 1).toString()
    setLineItems([
      ...lineItems,
      {
        id: newId,
        product_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        vat_rate: 20,
        line_total: 0,
        vat_amount: 0,
        total_with_vat: 0
      }
    ])
  }

  function removeLineItem(id: string) {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id))
    }
  }

  function updateLineItem(id: string, field: keyof LineItem, value: any) {
    setLineItems(
      lineItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          return calculateLineItem(updated)
        }
        return item
      })
    )
  }

  function selectProduct(lineItemId: string, productId: string) {
    const product = products.find(p => p.id === productId)
    if (product) {
      setLineItems(
        lineItems.map(item => {
          if (item.id === lineItemId) {
            const updated = {
              ...item,
              product_id: product.id,
              product_name: product.name,
              unit_price: Number(product.sale_price),
              vat_rate: Number(product.vat_rate)
            }
            return calculateLineItem(updated)
          }
          return item
        })
      )
    }
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0)
  const vatTotal = lineItems.reduce((sum, item) => sum + item.vat_amount, 0)
  const total = lineItems.reduce((sum, item) => sum + item.total_with_vat, 0)

  async function handleSubmit(status: 'draft' | 'sent') {
    if (!tenantId) return

    if (!selectedCustomerId) {
      toast.error('Please select a customer')
      return
    }

    if (!title.trim()) {
      toast.error('Please enter a proposal title')
      return
    }

    if (lineItems.some(item => !item.product_name.trim())) {
      toast.error('All line items must have a product name')
      return
    }

    setLoading(true)

    try {
      const { data: lastProposal } = await supabase
        .from('proposals')
        .select('proposal_number')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let nextNumber = 1
      if (lastProposal?.proposal_number) {
        const lastNumber = parseInt(lastProposal.proposal_number.split('-')[2])
        nextNumber = lastNumber + 1
      }

      const proposalNumber = `PROP-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`

      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .insert({
          tenant_id: tenantId,
          proposal_number: proposalNumber,
          customer_id: selectedCustomerId,
          title,
          description,
          status,
          valid_until: validUntil,
          subtotal,
          vat_total: vatTotal,
          total,
          notes,
          terms,
          sent_at: status === 'sent' ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (proposalError) throw proposalError

      const lineItemsToInsert = lineItems.map(item => ({
        tenant_id: tenantId,
        proposal_id: proposal.id,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        vat_rate: item.vat_rate,
        line_total: item.line_total,
        vat_amount: item.vat_amount,
        total_with_vat: item.total_with_vat,
        product_id: item.product_id || null
      }))

      const { error: lineItemsError } = await supabase
        .from('proposal_line_items')
        .insert(lineItemsToInsert)

      if (lineItemsError) throw lineItemsError

      toast.success(`Proposal ${status === 'sent' ? 'created and sent' : 'saved as draft'}!`)
      router.push('/proposals')
    } catch (error: any) {
      console.error('Error creating proposal:', error)
      toast.error(error.message || 'Failed to create proposal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-[#0A192F]">
            New Sales Proposal
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a professional proposal for your customer
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.company_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Proposal Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Enterprise Software Implementation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief overview of the proposal"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valid-until">Valid Until</Label>
                <Input
                  id="valid-until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Payment terms, delivery conditions, etc."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Private notes (not visible to customer)"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button onClick={addLineItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Item {index + 1}</span>
                  {lineItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Select Product</Label>
                    <Select
                      value={item.product_id || ''}
                      onValueChange={(value) => selectProduct(item.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ${Number(product.sale_price).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input
                      value={item.product_name}
                      onChange={(e) =>
                        updateLineItem(item.id, 'product_name', e.target.value)
                      }
                      placeholder="Product or service name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(item.id, 'description', e.target.value)
                    }
                    placeholder="Detailed description"
                    rows={2}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(item.id, 'quantity', Number(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unit Price ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateLineItem(item.id, 'unit_price', Number(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Discount (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount_percent}
                      onChange={(e) =>
                        updateLineItem(item.id, 'discount_percent', Number(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>VAT Rate (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.vat_rate}
                      onChange={(e) =>
                        updateLineItem(item.id, 'vat_rate', Number(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total</Label>
                    <div className="text-lg font-semibold pt-2">
                      ${item.total_with_vat.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT Total:</span>
                <span className="font-medium">${vatTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-purple-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => router.push('/proposals')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            className="bg-[#0A2540] hover:bg-[#1e3a5f] text-white"
            onClick={() => handleSubmit('sent')}
            disabled={loading}
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create & Send'}
          </Button>
        </div>

        <Toaster />
      </div>
    </DashboardLayout>
  )
}
