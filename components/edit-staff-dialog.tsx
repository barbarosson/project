'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'

export interface StaffRecord {
  id: string
  name: string
  last_name?: string | null
  email?: string | null
  phone?: string | null
  national_id?: string | null
  department?: string | null
  position?: string | null
  bank_name?: string | null
  bank_iban?: string | null
  bank_account_number?: string | null
  hire_date?: string | null
  salary?: number | null
  status?: string | null
}

interface EditStaffDialogProps {
  staff: StaffRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditStaffDialog({ staff, open, onOpenChange, onSuccess }: EditStaffDialogProps) {
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

  useEffect(() => {
    if (staff && open) {
      setFormData({
        name: staff.name || '',
        last_name: staff.last_name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        national_id: staff.national_id || '',
        department: staff.department || '',
        position: staff.position || '',
        bank_name: staff.bank_name || '',
        bank_iban: staff.bank_iban || '',
        bank_account_number: staff.bank_account_number || '',
        hire_date: staff.hire_date ? staff.hire_date.split('T')[0] : new Date().toISOString().split('T')[0],
        salary: staff.salary != null ? String(staff.salary) : '',
      })
    }
  }, [staff, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantId || !staff) {
      toast.error(t.common.noData)
      return
    }
    const name = formData.name.trim()
    if (!name) {
      toast.error(t.expenses.fillRequiredFields)
      return
    }
    const department = formData.department.trim() || t.hr.defaultDepartment
    const position = formData.position.trim() || t.hr.defaultPosition

    setLoading(true)
    try {
      if (formData.national_id && !/^\d{11}$/.test(formData.national_id.trim())) {
        throw new Error(t.hr.invalidNationalId as string)
      }

      const { error } = await supabase
        .from('staff')
        .update({
          name,
          last_name: formData.last_name.trim() || null,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          national_id: formData.national_id.trim() || null,
          department,
          position,
          bank_name: formData.bank_name.trim() || null,
          bank_iban: formData.bank_iban.trim() || null,
          bank_account_number: formData.bank_account_number.trim() || null,
          hire_date: formData.hire_date || null,
          salary: formData.salary ? parseFloat(formData.salary) : 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', staff.id)
        .eq('tenant_id', String(tenantId))

      if (error) throw error

      toast.success(t.hr.staffUpdatedSuccess)
      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (t.hr.staffUpdateError as string))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto bg-sky-50 border border-sky-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            {t.hr.editStaff}
          </DialogTitle>
          <DialogDescription>{t.hr.addStaffDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.hr.name} *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t.hr.lastName}</Label>
              <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.hr.email}</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t.hr.phone}</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.hr.nationalId}</Label>
            <Input value={formData.national_id} onChange={(e) => setFormData({ ...formData, national_id: e.target.value })} maxLength={11} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.hr.department} *</Label>
              <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t.hr.position} *</Label>
              <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.hr.hireDate}</Label>
              <Input type="date" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t.hr.salary}</Label>
              <Input type="number" step="0.01" min="0" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.hr.bankInfo}</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.hr.bankName}</Label>
                <Input value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t.hr.bankAccountNumber}</Label>
                <Input value={formData.bank_account_number} onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.hr.iban}</Label>
              <Input value={formData.bank_iban} onChange={(e) => setFormData({ ...formData, bank_iban: e.target.value })} />
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
