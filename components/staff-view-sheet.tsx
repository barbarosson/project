'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useLanguage } from '@/contexts/language-context'
import { useTenant } from '@/contexts/tenant-context'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { Receipt, FileText, Loader2 } from 'lucide-react'
import type { StaffRecord } from '@/components/edit-staff-dialog'

interface StaffExpense {
  id: string
  expense_date: string
  description: string | null
  category: string
  amount: number
  currency: string | null
  status?: string
}

interface StaffInvoice {
  id: string
  invoice_number: string
  issue_date: string
  amount: number
  total?: number
  status: string
  currency?: string | null
}

interface StaffViewSheetProps {
  staff: StaffRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  getStatusLabel: (status: string) => string
}

export function StaffViewSheet({ staff, open, onOpenChange, getStatusLabel }: StaffViewSheetProps) {
  const { t } = useLanguage()
  const { tenantId } = useTenant()
  const [staffExpenses, setStaffExpenses] = useState<StaffExpense[]>([])
  const [staffInvoices, setStaffInvoices] = useState<StaffInvoice[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [loadingInvoices, setLoadingInvoices] = useState(false)

  useEffect(() => {
    if (!open || !staff?.id || !tenantId) {
      setStaffExpenses([])
      setStaffInvoices([])
      return
    }
    const load = async () => {
      setLoadingExpenses(true)
      setLoadingInvoices(true)
      try {
        const [expRes, invRes] = await Promise.all([
          supabase
            .from('expenses')
            .select('id, expense_date, description, category, amount, currency, status')
            .eq('staff_id', staff.id)
            .eq('tenant_id', tenantId)
            .order('expense_date', { ascending: false })
            .limit(50),
          supabase
            .from('invoices')
            .select('id, invoice_number, issue_date, amount, total, status, currency')
            .eq('staff_id', staff.id)
            .eq('tenant_id', tenantId)
            .in('invoice_type', ['sale'])
            .order('issue_date', { ascending: false })
            .limit(50),
        ])
        setStaffExpenses(expRes.data || [])
        setStaffInvoices(invRes.data || [])
      } catch (_) {
        setStaffExpenses([])
        setStaffInvoices([])
      } finally {
        setLoadingExpenses(false)
        setLoadingInvoices(false)
      }
    }
    load()
  }, [open, staff?.id, tenantId])

  if (!staff) return null

  const fullName = [staff.name, staff.last_name].filter(Boolean).join(' ') || staff.name
  const formatMoney = (amount: number, currency?: string | null) =>
    `${Number(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || '₺'}`
  const getInvoiceStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: t.common.draft,
      sent: t.common.sent,
      paid: t.common.paid,
      overdue: t.common.overdue,
      cancelled: t.common.cancelled,
      pending: t.common.pending,
    }
    return map[status] || status
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-sky-50/95 border-sky-200">
        <SheetHeader>
          <SheetTitle className="text-[#0A2540]">{t.hr.viewStaff} — {fullName}</SheetTitle>
          <SheetDescription>{t.hr.staffDirectoryDesc}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6 text-sm">
          <div className="space-y-2">
            <div>
              <span className="text-muted-foreground">{t.hr.name}:</span>
              <p className="font-medium text-[#0A2540]">{fullName}</p>
            </div>
            {staff.email && (
              <div>
                <span className="text-muted-foreground">{t.hr.email}:</span>
                <p className="font-medium">{staff.email}</p>
              </div>
            )}
            {staff.phone && (
              <div>
                <span className="text-muted-foreground">{t.hr.phone}:</span>
                <p className="font-medium">{staff.phone}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">{t.hr.department}:</span>
              <p className="font-medium">{staff.department || '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t.hr.position}:</span>
              <p className="font-medium">{staff.position || '—'}</p>
            </div>
            {staff.national_id && (
              <div>
                <span className="text-muted-foreground">{t.hr.nationalId}:</span>
                <p className="font-medium">{staff.national_id}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">{t.hr.hireDate}:</span>
              <p className="font-medium">{staff.hire_date ? new Date(staff.hire_date).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t.hr.salary}:</span>
              <p className="font-medium">{staff.salary != null ? `${Number(staff.salary).toLocaleString('tr-TR')} ₺` : '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t.hr.status}:</span>
              <p><Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>{getStatusLabel(staff.status || '')}</Badge></p>
            </div>
            {(staff.bank_name || staff.bank_iban || staff.bank_account_number) && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">{t.hr.bankInfo}</span>
                <div className="mt-1 space-y-1">
                  {staff.bank_name && <p className="font-medium">{staff.bank_name}</p>}
                  {staff.bank_account_number && <p className="text-muted-foreground">{t.hr.bankAccountNumber}: {staff.bank_account_number}</p>}
                  {staff.bank_iban && <p className="text-muted-foreground">{t.hr.iban}: {staff.bank_iban}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-[#0A2540] flex items-center gap-2 mb-1">
              <Receipt className="h-4 w-4" />
              {t.hr.staffExpenses}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">{t.hr.staffExpensesDesc}</p>
            {loadingExpenses ? (
              <div className="flex items-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t.hr.loadingStaff}</span>
              </div>
            ) : staffExpenses.length === 0 ? (
              <p className="text-muted-foreground py-2">{t.hr.noStaffExpenses}</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">{t.hr.date}</TableHead>
                      <TableHead className="text-xs">{t.hr.description}</TableHead>
                      <TableHead className="text-xs">{t.hr.category}</TableHead>
                      <TableHead className="text-xs text-right">{t.hr.amount}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffExpenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs">{new Date(e.expense_date).toLocaleDateString('tr-TR')}</TableCell>
                        <TableCell className="text-xs max-w-[140px] truncate" title={e.description || ''}>{e.description || '—'}</TableCell>
                        <TableCell className="text-xs">{e.category || '—'}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{formatMoney(e.amount, e.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-[#0A2540] flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4" />
              {t.hr.staffInvoices}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">{t.hr.staffInvoicesDesc}</p>
            {loadingInvoices ? (
              <div className="flex items-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t.hr.loadingStaff}</span>
              </div>
            ) : staffInvoices.length === 0 ? (
              <p className="text-muted-foreground py-2">{t.hr.noStaffInvoices}</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">{t.hr.invoiceNo}</TableHead>
                      <TableHead className="text-xs">{t.hr.date}</TableHead>
                      <TableHead className="text-xs text-right">{t.hr.amount}</TableHead>
                      <TableHead className="text-xs">{t.common.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="text-xs font-medium">{inv.invoice_number}</TableCell>
                        <TableCell className="text-xs">{new Date(inv.issue_date).toLocaleDateString('tr-TR')}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{formatMoney(Number(inv.total ?? inv.amount ?? 0), inv.currency)}</TableCell>
                        <TableCell className="text-xs"><Badge variant="secondary">{getInvoiceStatusLabel(inv.status)}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
