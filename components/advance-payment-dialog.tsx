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
import { UserPlus } from 'lucide-react'

interface Account {
  id: string
  name: string
  type: string
  currency: string
  current_balance: number
}

interface Staff {
  id: string
  name: string
  last_name?: string | null
  department: string | null
  position: string | null
}

interface AdvancePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AdvancePaymentDialog({
  open,
  onOpenChange,
  onSuccess,
}: AdvancePaymentDialogProps) {
  const { tenantId } = useTenant()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [formData, setFormData] = useState({
    staff_id: '',
    amount: '',
    account_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    payment_method: 'bank_transfer' as 'cash' | 'bank_transfer' | 'credit_card' | 'other',
  })

  useEffect(() => {
    if (open && tenantId) {
      supabase
        .from('accounts')
        .select('id, name, type, currency, current_balance')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name')
        .then(({ data }) => {
          setAccounts(data || [])
          if (data?.length && !formData.account_id) {
            const tryAccount = data.find((a: Account) => (a.currency || '').toUpperCase() === 'TRY')
            setFormData((prev) => ({ ...prev, account_id: tryAccount?.id || data[0].id }))
          }
        })
      supabase
        .from('staff')
        .select('id, name, department, position')
        .eq('tenant_id', String(tenantId))
        .eq('status', 'active')
        .order('name')
        .then(({ data }) => setStaffList(data || []))
    }
  }, [open, tenantId])

  const selectedStaff = staffList.find((s) => s.id === formData.staff_id)
  const selectedStaffFullName = selectedStaff ? [selectedStaff.name, selectedStaff.last_name].filter(Boolean).join(' ') : ''

  useEffect(() => {
    if (selectedStaff && !formData.description) {
      setFormData((prev) => ({
        ...prev,
        description: (t.hr.advancePayment || 'Avans').toString().replace('Avans Ödemesi', 'Avans').replace('Advance Payment', 'Advance') + ' - ' + selectedStaffFullName,
      }))
    }
  }, [formData.staff_id, selectedStaffFullName])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantId || !formData.staff_id || !formData.amount) {
      toast.error(t.expenses.fillRequiredFields)
      return
    }
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error(t.expenses.fillRequiredFields)
      return
    }
    if (!formData.account_id) {
      toast.error(t.toast?.pleaseSelectAccount || 'Please select an account')
      return
    }

    setLoading(true)
    try {
      const description = formData.description?.trim() || (selectedStaff ? `Avans - ${selectedStaffFullName}` : 'Avans')

      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          tenant_id: tenantId,
          category: 'personnel',
          staff_id: formData.staff_id,
          description,
          amount,
          expense_date: formData.transaction_date,
          payment_method: formData.payment_method,
          currency: 'TRY',
          tax_rate: 0,
          status: 'paid',
          paid_amount: amount,
          remaining_amount: 0,
          notes: null,
        })
        .select('id')
        .single()

      if (expenseError) throw expenseError
      if (!expense?.id) throw new Error('Expense not created')

      const { error: txError } = await supabase.from('transactions').insert({
        tenant_id: tenantId,
        account_id: formData.account_id,
        transaction_type: 'expense',
        amount,
        currency: 'TRY',
        transaction_date: formData.transaction_date,
        description,
        reference_type: 'expense',
        reference_id: expense.id,
        payment_method: formData.payment_method,
        notes: null,
      })

      if (txError) throw txError

      toast.success(t.hr.advanceSuccess)
      onSuccess()
      onOpenChange(false)
      setFormData({
        staff_id: '',
        amount: '',
        account_id: accounts[0]?.id || '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
        payment_method: 'bank_transfer',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (t.hr.advanceError as string)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t.hr.advancePayment}
          </DialogTitle>
          <DialogDescription>{t.hr.advancePaymentDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t.hr.selectStaff} *</Label>
            <Select
              value={formData.staff_id}
              onValueChange={(v) => setFormData({ ...formData, staff_id: v, description: '' })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t.hr.selectStaff} />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((s) => {
                  const fullName = [s.name, s.last_name].filter(Boolean).join(' ')
                  return (
                    <SelectItem key={s.id} value={s.id}>
                      {fullName || s.name}
                      {(s.department || s.position) ? ` — ${[s.department, s.position].filter(Boolean).join(', ')}` : ''}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {staffList.length === 0 && (
              <p className="text-xs text-amber-600">{t.expenses.noStaff}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t.hr.amount} (TRY) *</Label>
            <Input
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
            <Label>{t.hr.paymentDate} *</Label>
            <Input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t.finance?.transactions?.account ?? 'Account'} *</Label>
            <Select
              value={formData.account_id}
              onValueChange={(v) => setFormData({ ...formData, account_id: v })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => (a.currency || '').toUpperCase() === 'TRY')
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} (TRY)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t.expenses.description}</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={selectedStaff ? `Avans - ${selectedStaffFullName}` : ''}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={loading || staffList.length === 0}>
              {loading ? t.common.loading : t.hr.advancePayment}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
