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
import { DollarSign, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Account {
  id: string
  name: string
  type: string
  currency: string
  current_balance: number
}

interface RecordPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'invoice' | 'expense'
  referenceId: string
  customerId?: string
  totalAmount: number
  paidAmount: number
  currency: string
  onSuccess: () => void
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  type,
  referenceId,
  customerId,
  totalAmount,
  paidAmount,
  currency,
  onSuccess
}: RecordPaymentDialogProps) {
  const { tenantId } = useTenant()
  const { t } = useLanguage()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)

  const remainingAmount = totalAmount - paidAmount

  const [formData, setFormData] = useState({
    account_id: '',
    amount: remainingAmount.toString(),
    payment_method: 'cash' as 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other',
    description: '',
    notes: '',
    transaction_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (open && tenantId) {
      fetchAccounts()
    }
  }, [open, tenantId])

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      amount: remainingAmount.toString()
    }))
  }, [remainingAmount])

  async function fetchAccounts() {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .eq('currency', currency)
        .order('name')

      if (error) throw error

      const matchingAccounts = data || []
      setAccounts(matchingAccounts)

      if (matchingAccounts.length > 0) {
        setFormData(prev => ({ ...prev, account_id: matchingAccounts[0].id }))
      }
    } catch (error: any) {
      console.error('Error fetching accounts:', error)
      toast.error(t.toast.failedToLoadAccounts)
    }
  }

  async function handleSubmit() {
    const amount = parseFloat(formData.amount)

    if (!formData.account_id) {
      toast.error(t.toast.pleaseSelectAccount)
      return
    }

    if (amount <= 0) {
      toast.error(t.toast.amountGreaterThanZero)
      return
    }

    if (amount > remainingAmount) {
      toast.error(t.toast.amountCannotExceedRemaining)
      return
    }

    try {
      setLoading(true)

      const transactionType = type === 'invoice' ? 'income' : 'expense'

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          tenant_id: tenantId,
          account_id: formData.account_id,
          transaction_type: transactionType,
          amount: amount,
          currency: currency,
          transaction_date: formData.transaction_date,
          description: formData.description || t.toast.paymentForReference.replace('{type}', type).replace('{id}', referenceId),
          reference_type: type,
          reference_id: referenceId,
          customer_id: customerId || null,
          payment_method: formData.payment_method,
          notes: formData.notes || null,
          created_by: t.toast.user
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      const newPaidAmount = paidAmount + amount
      const newRemainingAmount = totalAmount - newPaidAmount
      const isFullyPaid = newRemainingAmount <= 0.01

      if (type === 'invoice') {
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update({
            paid_amount: newPaidAmount,
            remaining_amount: newRemainingAmount,
            payment_date: isFullyPaid ? formData.transaction_date : null
          })
          .eq('id', referenceId)

        if (invoiceError) throw invoiceError
      } else if (type === 'expense') {
        const { error: expenseError } = await supabase
          .from('expenses')
          .update({
            paid_amount: newPaidAmount,
            remaining_amount: newRemainingAmount,
            status: isFullyPaid ? 'paid' : 'pending'
          })
          .eq('id', referenceId)

        if (expenseError) throw expenseError
      }

      toast.success(t.finance.transactions.recordPayment + t.toast.paymentSuccess)
      onOpenChange(false)
      resetForm()
      onSuccess()
    } catch (error: any) {
      console.error('Error recording payment:', error)
      toast.error(t.toast.failedToRecordPayment + error.message)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      account_id: accounts.length > 0 ? accounts[0].id : '',
      amount: remainingAmount.toString(),
      payment_method: 'cash',
      description: '',
      notes: '',
      transaction_date: new Date().toISOString().split('T')[0]
    })
  }

  const selectedAccount = accounts.find(a => a.id === formData.account_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            {t.finance.transactions.recordPayment}
          </DialogTitle>
          <DialogDescription>
            {type === 'invoice' ? t.finance.transactions.recordingCollection : t.finance.transactions.recordingPayment}
          </DialogDescription>
        </DialogHeader>

        {accounts.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t.finance.transactions.needAccountWithCurrency.replace('{currency}', currency)}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">{t.finance.transactions.totalAmount}</p>
                <p className="text-lg font-bold">{currency} {totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t.finance.transactions.paidAmount}</p>
                <p className="text-lg font-semibold text-green-600">{currency} {paidAmount.toLocaleString()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">{t.finance.transactions.remainingAmount}</p>
                <p className="text-xl font-bold text-red-600">{currency} {remainingAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account">{t.finance.transactions.account}</Label>
              <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type}) - {account.currency} {account.current_balance.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAccount && (
                <p className="text-xs text-gray-500">
                  {t.finance.transactions.currentBalance}: {selectedAccount.currency} {selectedAccount.current_balance.toLocaleString()}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">{t.finance.transactions.amount}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  max={remainingAmount}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date">{t.finance.transactions.transactionDate}</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment_method">{t.finance.transactions.paymentMethod}</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value: any) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t.finance.transactions.paymentMethods.cash}</SelectItem>
                  <SelectItem value="bank_transfer">{t.finance.transactions.paymentMethods.bank_transfer}</SelectItem>
                  <SelectItem value="credit_card">{t.finance.transactions.paymentMethods.credit_card}</SelectItem>
                  <SelectItem value="check">{t.finance.transactions.paymentMethods.check}</SelectItem>
                  <SelectItem value="other">{t.finance.transactions.paymentMethods.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t.finance.transactions.description}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={`${type === 'invoice' ? t.finance.transactions.collection : t.finance.transactions.payment} for ${type}`}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">{t.finance.accounts.notes}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder={t.finance.transactions.optionalNotes}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || accounts.length === 0 || !formData.account_id}>
            {loading ? t.finance.transactions.recording : t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
