'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface Customer {
  id: string
  company_title: string
  name: string
}

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  onSuccess
}: AddTransactionDialogProps) {
  const { tenantId } = useTenant()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])

  const [formData, setFormData] = useState({
    account_id: '',
    transaction_type: 'income' as 'income' | 'expense',
    amount: '',
    currency: 'TRY',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    customer_id: '',
    payment_method: 'cash' as 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other',
    notes: ''
  })

  useEffect(() => {
    if (open && tenantId) {
      fetchAccounts()
      fetchCustomers()
    }
  }, [open, tenantId])

  async function fetchAccounts() {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  async function fetchCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_title, name')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('company_title')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.account_id) {
      toast.error('Please select an account')
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoading(true)

    try {
      if (!tenantId) {
        throw new Error('No tenant ID available')
      }

      const transactionAmount = parseFloat(formData.amount)

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          tenant_id: tenantId,
          account_id: formData.account_id,
          transaction_type: formData.transaction_type,
          amount: transactionAmount,
          currency: formData.currency,
          transaction_date: formData.transaction_date,
          description: formData.description,
          customer_id: formData.customer_id || null,
          payment_method: formData.payment_method,
          notes: formData.notes || null,
          reference_type: 'other'
        })

      if (transactionError) throw transactionError

      const account = accounts.find(a => a.id === formData.account_id)
      if (account) {
        const balanceChange = formData.transaction_type === 'income' ? transactionAmount : -transactionAmount
        const newBalance = Number(account.current_balance) + balanceChange

        const { error: accountError } = await supabase
          .from('accounts')
          .update({ current_balance: newBalance })
          .eq('id', formData.account_id)
          .eq('tenant_id', tenantId)

        if (accountError) throw accountError
      }

      toast.success('Transaction added successfully!')
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      console.error('Error adding transaction:', error)
      toast.error(error.message || 'Failed to add transaction')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      account_id: '',
      transaction_type: 'income',
      amount: '',
      currency: 'TRY',
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
      customer_id: '',
      payment_method: 'cash',
      notes: ''
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Record a new income or expense transaction
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_type">Type *</Label>
              <Select
                value={formData.transaction_type}
                onValueChange={(value: 'income' | 'expense') => setFormData({ ...formData, transaction_type: value })}
              >
                <SelectTrigger id="transaction_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_id">Account *</Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) => {
                  const account = accounts.find(a => a.id === value)
                  setFormData({
                    ...formData,
                    account_id: value,
                    currency: account?.currency || 'TRY'
                  })
                }}
              >
                <SelectTrigger id="account_id">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type === 'cash' ? 'Cash' : account.type === 'bank' ? 'Bank' : 'Credit Card'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_date">Date *</Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value: any) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter transaction description"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_id">Customer (Optional)</Label>
            <Select
              value={formData.customer_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, customer_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger id="customer_id">
                <SelectValue placeholder="Select customer (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.company_title || customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
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
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
