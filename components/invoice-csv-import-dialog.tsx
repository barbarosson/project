'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { CURRENCY_LIST } from '@/lib/currencies'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, Loader2, Download } from 'lucide-react'

const CSV_HEADERS = ['customer', 'amount', 'issue_date', 'due_date', 'notes', 'status', 'invoice_type', 'currency']

interface InvoiceCsvImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InvoiceCsvImportDialog({ isOpen, onClose, onSuccess }: InvoiceCsvImportDialogProps) {
  const { tenantId } = useTenant()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<{ success: number; failed: { row: number; reason: string }[] } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isTr = language === 'tr'

  const downloadTemplate = () => {
    const headers = isTr
      ? ['cari_unvan_veya_eposta', 'tutar', 'duzenleme_tarihi', 'vade_tarihi', 'notlar', 'durum', 'fatura_tipi', 'para_birimi']
      : CSV_HEADERS
    const example = isTr
      ? ['Cariler sayfasindaki sirket unvani veya e-posta', '1500.00', '2025-01-15', '2025-02-15', 'Ornek not', 'draft', 'sale', 'TRY']
      : ['Company title or email from Customers page', '1500.00', '2025-01-15', '2025-02-15', 'Sample note', 'draft', 'sale', 'TRY']
    const csv = '\uFEFF' + [headers.join(','), example.join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = isTr ? 'fatura_sablonu.csv' : 'invoice_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const parseCsv = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter(Boolean)
    return lines.map(line => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const c = line[i]
        if (c === '"') {
          inQuotes = !inQuotes
        } else if ((c === ',' && !inQuotes) || (c === ';' && !inQuotes)) {
          result.push(current.trim())
          current = ''
        } else {
          current += c
        }
      }
      result.push(current.trim())
      return result
    })
  }

  const normalizeHeader = (h: string): string => {
    const s = h.toLowerCase().replace(/\s+/g, '_')
    if (s === 'cari_unvan_veya_eposta' || s === 'customer') return 'customer'
    if (s === 'tutar' || s === 'amount') return 'amount'
    if (s === 'duzenleme_tarihi' || s === 'issue_date') return 'issue_date'
    if (s === 'vade_tarihi' || s === 'due_date') return 'due_date'
    if (s === 'notlar' || s === 'notes') return 'notes'
    if (s === 'durum' || s === 'status') return 'status'
    if (s === 'fatura_tipi' || s === 'invoice_type') return 'invoice_type'
    if (s === 'para_birimi' || s === 'currency') return 'currency'
    return s
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) {
      setFile(f)
      setReport(null)
    } else if (f) {
      toast.error(isTr ? 'Lütfen .csv dosyası seçin' : 'Please select a .csv file')
    }
    e.target.value = ''
  }

  const handleImport = async () => {
    if (!file || !tenantId) return
    setLoading(true)
    setReport(null)
    const failed: { row: number; reason: string }[] = []
    let success = 0

    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length < 2) {
        toast.error(isTr ? 'CSV en az başlık ve bir veri satırı içermeli' : 'CSV must have header and at least one data row')
        setLoading(false)
        return
      }

      const headerRow = rows[0].map(normalizeHeader)
      const customerIdx = headerRow.indexOf('customer')
      const amountIdx = headerRow.indexOf('amount')
      const issueDateIdx = headerRow.indexOf('issue_date')
      const dueDateIdx = headerRow.indexOf('due_date')
      const notesIdx = headerRow.indexOf('notes') >= 0 ? headerRow.indexOf('notes') : -1
      const statusIdx = headerRow.indexOf('status') >= 0 ? headerRow.indexOf('status') : headerRow.indexOf('durum')
      const typeIdx = headerRow.indexOf('invoice_type') >= 0 ? headerRow.indexOf('invoice_type') : headerRow.indexOf('fatura_tipi')
      const currencyIdx = headerRow.indexOf('currency') >= 0 ? headerRow.indexOf('currency') : -1

      if (customerIdx < 0 || amountIdx < 0 || issueDateIdx < 0 || dueDateIdx < 0) {
        toast.error(isTr ? 'CSV sütunları: customer, amount, issue_date, due_date gerekli' : 'CSV must have columns: customer, amount, issue_date, due_date')
        setLoading(false)
        return
      }

      const { data: customers } = await supabase
        .from('customers')
        .select('id, company_title, email')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
      const customerMap = new Map<string, string>()
      const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
      customers?.forEach(c => {
        if (c.company_title) customerMap.set(normalize(String(c.company_title)), c.id)
        if (c.email) customerMap.set(normalize(String(c.email)), c.id)
      })

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const customerVal = row[customerIdx]?.trim()
        const amountVal = row[amountIdx]?.trim()
        const issueDateVal = row[issueDateIdx]?.trim()
        const dueDateVal = row[dueDateIdx]?.trim()
        const notesVal = notesIdx >= 0 ? row[notesIdx]?.trim() : ''
        const statusVal = statusIdx >= 0 ? (row[statusIdx]?.trim() || 'draft') : 'draft'
        const typeVal = typeIdx >= 0 ? (row[typeIdx]?.trim() || 'sale') : 'sale'
        const currencyVal = currencyIdx >= 0 ? (row[currencyIdx]?.trim() || 'TRY').toUpperCase() : 'TRY'
        const currencyCode = CURRENCY_LIST.some(c => c.code === currencyVal) ? currencyVal : 'TRY'

        if (!customerVal || !amountVal || !issueDateVal || !dueDateVal) {
          failed.push({ row: i + 1, reason: isTr ? 'Eksik alan' : 'Missing required field' })
          continue
        }

        const customerKey = customerVal.trim().toLowerCase().replace(/\s+/g, ' ')
        const customerId = customerMap.get(customerKey)
        if (!customerId) {
          failed.push({
            row: i + 1,
            reason: (isTr ? 'Cari bulunamadı (Cariler sayfasındaki ünvan veya e-posta ile birebir eşleşmeli): ' : 'Customer not found (must match company title or email from Customers page): ') + customerVal
          })
          continue
        }

        const amount = parseFloat(amountVal.replace(',', '.'))
        if (isNaN(amount) || amount <= 0) {
          failed.push({ row: i + 1, reason: (isTr ? 'Geçersiz tutar: ' : 'Invalid amount: ') + amountVal })
          continue
        }

        const issueDate = issueDateVal.split('T')[0]
        const dueDate = dueDateVal.split('T')[0]
        const status = ['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(statusVal.toLowerCase())
          ? statusVal.toLowerCase()
          : 'draft'
        const invoiceType = ['sale', 'sale_return', 'devir', 'devir_return'].includes(typeVal.toLowerCase())
          ? typeVal.toLowerCase()
          : 'sale'

        try {
          const invoiceNumber = `INV-${Date.now().toString().slice(-8)}-${i}`
          const { data: invoice, error: invErr } = await supabase
            .from('invoices')
            .insert({
              tenant_id: tenantId,
              customer_id: customerId,
              invoice_number: invoiceNumber,
              amount,
              subtotal: amount,
              total_vat: 0,
              status,
              invoice_type: invoiceType,
              currency: currencyCode,
              issue_date: issueDate,
              due_date: dueDate,
              notes: notesVal || null,
            })
            .select()
            .single()

          if (invErr) {
            failed.push({ row: i + 1, reason: invErr.message })
            continue
          }

          const { error: lineErr } = await supabase.from('invoice_line_items').insert({
            tenant_id: tenantId,
            invoice_id: invoice.id,
            product_name: isTr ? 'CSV içe aktarma' : 'CSV import',
            description: notesVal || null,
            quantity: 1,
            unit_price: amount,
            vat_rate: 0,
            line_total: amount,
            vat_amount: 0,
            total_with_vat: amount,
          })

          if (lineErr) {
            failed.push({ row: i + 1, reason: lineErr.message })
            continue
          }

          success++
        } catch (err: any) {
          failed.push({ row: i + 1, reason: err?.message || String(err) })
        }
      }

      setReport({ success, failed })
      if (success > 0) {
        toast.success(isTr ? `${success} fatura içe aktarıldı` : `${success} invoice(s) imported`)
        onSuccess()
      }
      if (failed.length > 0 && success === 0) {
        const firstReason = failed[0]?.reason || ''
        toast.error(
          isTr
            ? `Hiç fatura aktarılamadı. ${firstReason} Cariler sayfasındaki şirket ünvanı veya e-postayı kullanın.`
            : `No invoices imported. ${firstReason} Use company title or email from Customers page.`,
          { duration: 8000 }
        )
      }
    } catch (err: any) {
      toast.error(err?.message || (isTr ? 'CSV işlenemedi' : 'Failed to process CSV'))
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    if (!report?.failed.length) return
    const csv = [
      ['row', 'reason'].join(','),
      ...report.failed.map(f => [f.row, `"${f.reason.replace(/"/g, '""')}"`].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = isTr ? 'fatura_aktarim_raporu.csv' : 'invoice_import_report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    setFile(null)
    setReport(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isTr ? 'Fatura CSV İçe Aktar' : 'Import Invoices from CSV'}</DialogTitle>
          <DialogDescription>
            {isTr
              ? 'CSV ile toplu fatura oluşturun. İlk sütunda ana cari veya alt şube ünvanı / e-postasını birebir yazın; sistemde kayıtlı olmayan cari ile satır aktarılmaz.'
              : 'Create invoices in bulk from CSV. First column must exactly match a main or sub-branch company title or email; rows with unknown customers are skipped.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={downloadTemplate} className="shrink-0">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {isTr ? 'Şablon İndir' : 'Download Template'}
            </Button>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="shrink-0"
              >
                <Upload className="mr-2 h-4 w-4" />
                {file ? file.name : (isTr ? 'Dosya Seç' : 'Choose File')}
              </Button>
            </div>
          </div>
          {report && (
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-sm font-medium">
                {isTr ? 'Sonuç:' : 'Result:'} {report.success} {isTr ? 'başarılı' : 'success'}
                {report.failed.length > 0 && `, ${report.failed.length} ${isTr ? 'başarısız' : 'failed'}`}
              </p>
              {report.failed.length > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={downloadReport}>
                  <Download className="mr-2 h-4 w-4" />
                  {isTr ? 'Başarısız satırları indir' : 'Download failed rows'}
                </Button>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {isTr ? 'Kapat' : 'Close'}
          </Button>
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isTr ? 'İçe Aktar' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
