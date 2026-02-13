'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'

interface Account {
  id: string
  name: string
  type: string
  currency: string
  current_balance: number
}

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  expense_date: string
  payment_method: string
  currency?: string
  account_id?: string
  tax_rate?: number
  notes: string | null
}

interface EditManualExpenseDialogProps {
  expense: Expense | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditManualExpenseDialog({ expense, open, onOpenChange, onSuccess }: EditManualExpenseDialogProps) {
  const { tenantId } = useTenant()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [formData, setFormData] = useState({
    category: 'general',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    currency: 'TRY',
    account_id: '',
    tax_rate: '20',
    notes: ''
  })

  useEffect(() => {
    if (open && tenantId) {
      fetchAccounts()
    }
  }, [open, tenantId])

  useEffect(() => {
    if (expense) {
      setFormData({
        category: expense.category || 'general',
        description: expense.description || '',
        amount: expense.amount.toString(),
        expense_date: expense.expense_date ? expense.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
        payment_method: expense.payment_method || 'cash',
        currency: expense.currency || 'TRY',
        account_id: expense.account_id || '',
        tax_rate: expense.tax_rate?.toString() || '20',
        notes: expense.notes || ''
      })
    }
  }, [expense])

  async function fetchAccounts() {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, type, currency, current_balance')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!tenantId || !expense) {
      toast.error('No tenant ID or expense available')
      return
    }

    if (!formData.description || !formData.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const updateData: any = {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        payment_method: formData.payment_method,
        currency: formData.currency,
        tax_rate: parseFloat(formData.tax_rate),
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      }

      if (formData.account_id) {
        updateData.account_id = formData.account_id
      } else {
        updateData.account_id = null
      }

      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expense.id)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast.success('Expense updated successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error updating expense:', error)
      toast.error(error.message || 'Failed to update expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Update expense information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">{t.expenses.category} *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">{t.expenses.categories.general}</SelectItem>
                <SelectItem value="marketing">{t.expenses.categories.marketing}</SelectItem>
                <SelectItem value="personnel">{t.expenses.categories.personnel}</SelectItem>
                <SelectItem value="office">{t.expenses.categories.office}</SelectItem>
                <SelectItem value="tax">{t.expenses.categories.tax}</SelectItem>
                <SelectItem value="utilities">{t.expenses.categories.utilities}</SelectItem>
                <SelectItem value="rent">{t.expenses.categories.rent}</SelectItem>
                <SelectItem value="other">{t.expenses.categories.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.expenses.description} *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter expense description"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t.expenses.amount} *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t.settings.currency} *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => {
                  setFormData({ ...formData, currency: value, account_id: '' })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY (₺)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_rate">Tax Rate (%) *</Label>
              <Select
                value={formData.tax_rate}
                onValueChange={(value) => setFormData({ ...formData, tax_rate: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="1">1%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense_date">{t.expenses.expenseDate} *</Label>
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">{t.expenses.paymentMethod} *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => {
                  setFormData({ ...formData, payment_method: value, account_id: '' })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t.expenses.paymentMethods.cash}</SelectItem>
                  <SelectItem value="bank_transfer">{t.expenses.paymentMethods.bank_transfer}</SelectItem>
                  <SelectItem value="credit_card">{t.expenses.paymentMethods.credit_card}</SelectItem>
                  <SelectItem value="other">{t.expenses.paymentMethods.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(formData.payment_method === 'bank_transfer' || formData.payment_method === 'credit_card') && (
            <div className="space-y-2">
              <Label htmlFor="account_id">
                {formData.payment_method === 'bank_transfer' ? t.finance.accounts.bankName : 'Kredi Kartı'} *
              </Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.finance.transactions.account} />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter(acc => acc.type === 'bank' && acc.currency === formData.currency)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.currency})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {accounts.filter(acc => acc.type === 'bank' && acc.currency === formData.currency).length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {formData.currency} para birimi ile eşleşen banka hesabı bulunamadı. Lütfen Finans {">"} Hesaplar sayfasından {formData.currency} hesabı ekleyin.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">{t.expenses.notes}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
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
