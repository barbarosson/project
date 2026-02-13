'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createOrder } from '@/lib/module-integration'
import { toast } from 'sonner'

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  onSuccess: () => void
  isTR: boolean
}

interface LineItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  taxRate: number
  discount: number
}

export function CreateOrderDialog({ open, onOpenChange, tenantId, onSuccess, isTR }: CreateOrderDialogProps) {
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [customerId, setCustomerId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [currency, setCurrency] = useState('TRY')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { productId: '', productName: '', sku: '', quantity: 1, unitPrice: 0, taxRate: 18, discount: 0 },
  ])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && tenantId) {
      loadData()
    }
  }, [open, tenantId])

  async function loadData() {
    const [custRes, prodRes, projRes] = await Promise.all([
      supabase.from('customers').select('id, name, company_title').eq('tenant_id', tenantId).order('name'),
      supabase.from('products').select('id, name, sku, sale_price').eq('tenant_id', tenantId).order('name'),
      supabase.from('projects').select('id, name, code').eq('tenant_id', tenantId).in('status', ['planning', 'active']).order('name'),
    ])
    setCustomers(custRes.data || [])
    setProducts(prodRes.data || [])
    setProjects(projRes.data || [])
  }

  function handleProductSelect(index: number, productId: string) {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.name,
      sku: product.sku || '',
      unitPrice: Number(product.sale_price) || 0,
    }
    setItems(newItems)
  }

  function updateItem(index: number, field: keyof LineItem, value: any) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  function addLine() {
    setItems([...items, { productId: '', productName: '', sku: '', quantity: 1, unitPrice: 0, taxRate: 18, discount: 0 }])
  }

  function removeLine(index: number) {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  function calculateLineTotal(item: LineItem) {
    const base = item.quantity * item.unitPrice - item.discount
    return base + base * (item.taxRate / 100)
  }

  const grandTotal = items.reduce((sum, item) => sum + calculateLineTotal(item), 0)

  async function handleSubmit() {
    const validItems = items.filter(i => i.productName && i.quantity > 0)
    if (validItems.length === 0) {
      toast.error(isTR ? 'En az bir kalem ekleyin' : 'Add at least one item')
      return
    }

    setSaving(true)
    const result = await createOrder({
      tenantId,
      customerId: customerId || undefined,
      projectId: projectId || undefined,
      source: 'manual',
      currency,
      notes,
      items: validItems.map(i => ({
        productId: i.productId || undefined,
        productName: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
        discount: i.discount,
      })),
    })

    if (result.success) {
      toast.success(isTR ? 'Siparis olusturuldu' : 'Order created')
      onSuccess()
      onOpenChange(false)
      resetForm()
    } else {
      toast.error(result.error || 'Error')
    }
    setSaving(false)
  }

  function resetForm() {
    setCustomerId('')
    setProjectId('')
    setCurrency('TRY')
    setNotes('')
    setItems([{ productId: '', productName: '', sku: '', quantity: 1, unitPrice: 0, taxRate: 18, discount: 0 }])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isTR ? 'Yeni Siparis' : 'New Order'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Musteri' : 'Customer'}</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder={isTR ? 'Musteri secin' : 'Select customer'} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_title || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isTR ? 'Para Birimi' : 'Currency'}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {projects.length > 0 && (
            <div>
              <Label>{isTR ? 'Proje' : 'Project'}</Label>
              <Select value={projectId || 'none'} onValueChange={v => setProjectId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={isTR ? 'Proje secin (opsiyonel)' : 'Select project (optional)'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isTR ? 'Proje yok' : 'No project'}</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code ? `[${p.code}] ` : ''}{p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>{isTR ? 'Kalemler' : 'Line Items'}</Label>
            <div className="border rounded-lg mt-2 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[200px]">{isTR ? 'Urun' : 'Product'}</TableHead>
                    <TableHead className="w-[80px] text-right">{isTR ? 'Miktar' : 'Qty'}</TableHead>
                    <TableHead className="w-[100px] text-right">{isTR ? 'Birim Fiyat' : 'Unit Price'}</TableHead>
                    <TableHead className="w-[70px] text-right">{isTR ? 'KDV %' : 'Tax %'}</TableHead>
                    <TableHead className="w-[90px] text-right">{isTR ? 'Toplam' : 'Total'}</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Select
                          value={item.productId}
                          onValueChange={(val) => handleProductSelect(idx, val)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder={isTR ? 'Urun sec...' : 'Select...'} />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} {p.sku ? `(${p.sku})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!item.productId && (
                          <Input
                            className="mt-1 h-7 text-xs"
                            placeholder={isTR ? 'Veya urun adi girin' : 'Or type name'}
                            value={item.productName}
                            onChange={e => updateItem(idx, 'productName', e.target.value)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-8 text-sm text-right"
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                          min={0.01}
                          step={1}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-8 text-sm text-right"
                          value={item.unitPrice}
                          onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))}
                          min={0}
                          step={0.01}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-8 text-sm text-right"
                          value={item.taxRate}
                          onChange={e => updateItem(idx, 'taxRate', Number(e.target.value))}
                          min={0}
                          max={100}
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {calculateLineTotal(item).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeLine(idx)}
                          disabled={items.length <= 1}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                {isTR ? 'Kalem Ekle' : 'Add Line'}
              </Button>
              <div className="text-right">
                <span className="text-sm text-muted-foreground mr-2">{isTR ? 'Genel Toplam:' : 'Total:'}</span>
                <span className="text-lg font-bold">{grandTotal.toFixed(2)} {currency}</span>
              </div>
            </div>
          </div>

          <div>
            <Label>{isTR ? 'Notlar' : 'Notes'}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isTR ? 'Iptal' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#00D4AA] hover:bg-[#00B894]">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isTR ? 'Siparis Olustur' : 'Create Order'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
