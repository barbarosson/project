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
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { TurkishProvinceSelect } from '@/components/turkish-province-select'
import { TurkishBankSelect } from '@/components/turkish-bank-select'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/language-context'
import { useTenant } from '@/contexts/tenant-context'

interface Customer {
  id: string
  company_title: string
  name: string
  account_type: string
  tax_office: string
  tax_number: string
  email: string
  phone: string
  address: string
  city?: string
  district?: string
  postal_code?: string
  country?: string
  payment_terms?: number
  payment_terms_type?: string
  bank_name?: string
  bank_account_holder?: string
  bank_account_number?: string
  bank_iban?: string
  bank_branch?: string
  bank_swift?: string
  website?: string
  industry?: string
  notes?: string
  balance: number
  status: string
  e_invoice_enabled: boolean
  branch_type?: string | null
  branch_code?: string | null
  parent_customer_id?: string | null
}

interface EditCustomerDialogProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditCustomerDialog({
  customer,
  isOpen,
  onClose,
  onSuccess,
}: EditCustomerDialogProps) {
  const { t } = useLanguage()
  const { tenantId } = useTenant()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company_title: '',
    account_type: 'customer',
    tax_office: '',
    tax_number: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    postal_code: '',
    country: 'Turkey',
    payment_terms: 0,
    payment_terms_type: 'net',
    bank_name: '',
    bank_account_holder: '',
    bank_account_number: '',
    bank_iban: '',
    bank_branch: '',
    bank_swift: '',
    website: '',
    industry: '',
    notes: '',
    balance: 0,
    status: 'active',
    e_invoice_enabled: false,
  })

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        company_title: customer.company_title || '',
        account_type: customer.account_type || 'customer',
        tax_office: customer.tax_office || '',
        tax_number: customer.tax_number || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        district: customer.district || '',
        postal_code: customer.postal_code || '',
        country: customer.country || 'Turkey',
        payment_terms: customer.payment_terms || 0,
        payment_terms_type: customer.payment_terms_type || 'net',
        bank_name: customer.bank_name || '',
        bank_account_holder: customer.bank_account_holder || '',
        bank_account_number: customer.bank_account_number || '',
        bank_iban: customer.bank_iban || '',
        bank_branch: customer.bank_branch || '',
        bank_swift: customer.bank_swift || '',
        website: customer.website || '',
        industry: customer.industry || '',
        notes: customer.notes || '',
        balance: customer.balance || 0,
        status: customer.status || 'active',
        e_invoice_enabled: customer.e_invoice_enabled || false,
      })
    }
  }, [customer])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customer) return

    setLoading(true)

    try {
      if (!tenantId) {
        throw new Error('No tenant ID available. Please log in again.')
      }

      const { error } = await supabase
        .from('customers')
        .update({
          ...formData,
          tenant_id: tenantId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id)

      if (error) throw error

      toast.success(t.customers.editCustomer + ' successful!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating customer:', error)
      toast.error(error.message || 'Failed to update customer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.customers.editCustomer}</DialogTitle>
          <DialogDescription>
            Update customer information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="bank">Bank Info</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.customers.name} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_title">{t.customers.companyTitle}</Label>
                <Input
                  id="company_title"
                  value={formData.company_title}
                  onChange={(e) =>
                    setFormData({ ...formData, company_title: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_type">{t.customers.accountType}</Label>
                <Select
                  value={formData.account_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, account_type: value })
                  }
                >
                  <SelectTrigger id="account_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">{t.customers.typeCustomer}</SelectItem>
                    <SelectItem value="vendor">{t.customers.typeVendor}</SelectItem>
                    <SelectItem value="both">{t.customers.typeBoth}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t.common.status}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t.common.active}</SelectItem>
                    <SelectItem value="inactive">{t.common.inactive}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_office">{t.customers.taxOffice}</Label>
                <Input
                  id="tax_office"
                  value={formData.tax_office}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_office: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_number">{t.customers.taxNumber}</Label>
                <Input
                  id="tax_number"
                  value={formData.tax_number}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_number: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.customers.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t.customers.phone}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="balance">{t.customers.balance}</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      balance: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e_invoice">{t.customers.eInvoice}</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="e_invoice"
                    checked={formData.e_invoice_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, e_invoice_enabled: checked })
                    }
                  />
                  <Label htmlFor="e_invoice">
                    {formData.e_invoice_enabled ? t.customers.enabled : t.customers.disabled}
                  </Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="address" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City / Province</Label>
                <TurkishProvinceSelect
                  value={formData.city}
                  onValueChange={(value) => setFormData({ ...formData, city: value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({ ...formData, district: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, postal_code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
                <Input
                  id="payment_terms"
                  type="number"
                  value={formData.payment_terms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_terms: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_terms_type">Payment Terms Type</Label>
                <Select
                  value={formData.payment_terms_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, payment_terms_type: value })
                  }
                >
                  <SelectTrigger id="payment_terms_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net">Net (Payment due in X days)</SelectItem>
                    <SelectItem value="eom">EOM (End of Month)</SelectItem>
                    <SelectItem value="days">Days from invoice date</SelectItem>
                    <SelectItem value="immediate">Immediate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="bank" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <TurkishBankSelect
                value={formData.bank_name}
                onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account_holder">Account Holder Name</Label>
                <Input
                  id="bank_account_holder"
                  value={formData.bank_account_holder}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_account_holder: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_branch">Bank Branch</Label>
                <Input
                  id="bank_branch"
                  value={formData.bank_branch}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_branch: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_iban">IBAN</Label>
              <Input
                id="bank_iban"
                value={formData.bank_iban}
                onChange={(e) =>
                  setFormData({ ...formData, bank_iban: e.target.value })
                }
                maxLength={32}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_account_number: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_swift">SWIFT/BIC Code</Label>
                <Input
                  id="bank_swift"
                  value={formData.bank_swift}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_swift: e.target.value })
                  }
                />
              </div>
            </div>
          </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t.common.loading : t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
