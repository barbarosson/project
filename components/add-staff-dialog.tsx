'use client'

import { useState } from 'react'
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
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'

interface AddStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddStaffDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddStaffDialogProps) {
  const { tenantId } = useTenant()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    phone: '',
    national_id: '',
    department: '',
    position: '',
    bank_name: '',
    bank_iban: '',
    bank_account_number: '',
    hire_date: new Date().toISOString().split('T')[0],
    salary: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantId) {
      toast.error(t.common.noData)
      return
    }
    const name = formData.name.trim()
    if (!name) {
      toast.error(t.expenses.fillRequiredFields)
      return
    }
    const lastName = formData.last_name.trim()
    const department = formData.department.trim() || t.hr.defaultDepartment
    const position = formData.position.trim() || t.hr.defaultPosition

    setLoading(true)
    try {
      // Optional simple TCKN validation: 11 numeric characters
      if (formData.national_id && !/^\d{11}$/.test(formData.national_id.trim())) {
        throw new Error(t.hr.invalidNationalId || 'TCKN 11 haneli olmalıdır')
      }

      const { error } = await supabase.from('staff').insert({
        tenant_id: String(tenantId),
        name,
        last_name: lastName || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        national_id: formData.national_id.trim() || null,
        department,
        position,
        bank_name: formData.bank_name.trim() || null,
        bank_iban: formData.bank_iban.trim() || null,
        bank_account_number: formData.bank_account_number.trim() || null,
        hire_date: formData.hire_date || new Date().toISOString().split('T')[0],
        salary: formData.salary ? parseFloat(formData.salary) : 0,
        performance_score: 0,
        burnout_risk: 'low',
        churn_risk: 'low',
        status: 'active',
      })

      if (error) throw error

      toast.success(t.hr.staffAddedSuccess)
      onSuccess()
      onOpenChange(false)
      setFormData({
        name: '',
        last_name: '',
        email: '',
        phone: '',
        national_id: '',
        department: '',
        position: '',
        bank_name: '',
        bank_iban: '',
        bank_account_number: '',
        hire_date: new Date().toISOString().split('T')[0],
        salary: '',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (t.hr.staffAddError as string)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t.hr.addStaffTitle}
          </DialogTitle>
          <DialogDescription>{t.hr.addStaffDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">{t.hr.name} *</Label>
              <Input
                id="staff-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t.hr.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-last-name">{t.hr.lastName}</Label>
              <Input
                id="staff-last-name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder={t.hr.lastName}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff-email">{t.hr.email}</Label>
              <Input
                id="staff-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t.hr.email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone">{t.hr.phone}</Label>
              <Input
                id="staff-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t.hr.phone}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-national-id">{t.hr.nationalId}</Label>
            <Input
              id="staff-national-id"
              value={formData.national_id}
              onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
              placeholder={t.hr.nationalId}
              maxLength={11}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff-department">{t.hr.department} *</Label>
              <Input
                id="staff-department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder={t.hr.department}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-position">{t.hr.position} *</Label>
              <Input
                id="staff-position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder={t.hr.position}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff-hire_date">{t.hr.hireDate}</Label>
              <Input
                id="staff-hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-salary">{t.hr.salary}</Label>
              <Input
                id="staff-salary"
                type="number"
                step="0.01"
                min="0"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.hr.bankInfo}</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff-bank-name">{t.hr.bankName}</Label>
                <Input
                  id="staff-bank-name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder={t.hr.bankName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-bank-account-number">{t.hr.bankAccountNumber}</Label>
                <Input
                  id="staff-bank-account-number"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  placeholder={t.hr.bankAccountNumber}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-bank-iban">{t.hr.iban}</Label>
              <Input
                id="staff-bank-iban"
                value={formData.bank_iban}
                onChange={(e) => setFormData({ ...formData, bank_iban: e.target.value })}
                placeholder={t.hr.iban}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
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
