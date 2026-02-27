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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, Loader2, Download, Receipt, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'

const VALID_CATEGORIES = ['general', 'marketing', 'personnel', 'office', 'tax', 'utilities', 'rent', 'other']
const VALID_PAYMENT_METHODS = ['cash', 'bank_transfer', 'credit_card', 'other']
const VALID_PURCHASE_TYPES = ['purchase', 'purchase_return', 'devir', 'devir_return']

interface ExpenseExcelImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ExpenseExcelImportDialog({ isOpen, onClose, onSuccess }: ExpenseExcelImportDialogProps) {
  const { tenantId } = useTenant()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<{ success: number; failed: { row: number; reason: string }[] } | null>(null)
  const [importType, setImportType] = useState<'expense' | 'invoice'>('expense')
  const inputRef = useRef<HTMLInputElement>(null)

  const isTr = language === 'tr'

  const downloadTemplate = () => {
    if (importType === 'expense') {
      const headers = isTr
        ? ['kategori', 'aciklama', 'tutar', 'gider_tarihi', 'odeme_yontemi', 'para_birimi', 'notlar', 'proje_kodu', 'kdv_orani']
        : ['category', 'description', 'amount', 'expense_date', 'payment_method', 'currency', 'notes', 'project_code', 'tax_rate']
      const example = isTr
        ? ['general', 'Ofis malzemeleri', '1500.00', '2025-01-15', 'bank_transfer', 'TRY', 'Ornek not', '', '20']
        : ['general', 'Office supplies', '1500.00', '2025-01-15', 'bank_transfer', 'TRY', 'Sample note', '', '20']
      const aoa = [headers, example]
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, isTr ? 'Giderler' : 'Expenses')
      XLSX.writeFile(wb, isTr ? 'gider_sablonu.xlsx' : 'expense_template.xlsx')
    } else {
      const headers = isTr
        ? ['tedarikci_unvan_veya_eposta', 'fatura_no', 'fatura_tarihi', 'vade_tarihi', 'toplam_tutar', 'fatura_tipi', 'durum']
        : ['supplier_title_or_email', 'invoice_number', 'invoice_date', 'due_date', 'total_amount', 'invoice_type', 'status']
      const example = isTr
        ? ['Tedarikci sirket unvani veya e-posta', 'GFS-2025-001', '2025-01-15', '2025-02-15', '5000.00', 'purchase', 'pending']
        : ['Supplier company title or email', 'INV-2025-001', '2025-01-15', '2025-02-15', '5000.00', 'purchase', 'pending']
      const aoa = [headers, example]
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, isTr ? 'Gelen Faturalar' : 'Incoming Invoices')
      XLSX.writeFile(wb, isTr ? 'gelen_fatura_sablonu.xlsx' : 'incoming_invoice_template.xlsx')
    }
  }

  const parseExcel = (buffer: ArrayBuffer): string[][] => {
    const wb = XLSX.read(buffer, { type: 'array' })
    const firstSheet = wb.Sheets[wb.SheetNames[0]]
    if (!firstSheet) return []
    const aoa = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: '' })
    return (aoa || []).map(row => (Array.isArray(row) ? row.map(c => String(c ?? '').trim()) : []))
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
    if (s === 'kategori' || s === 'category') return 'category'
    if (s === 'aciklama' || s === 'description') return 'description'
    if (s === 'tutar' || s === 'amount') return 'amount'
    if (s === 'gider_tarihi' || s === 'expense_date') return 'expense_date'
    if (s === 'odeme_yontemi' || s === 'payment_method') return 'payment_method'
    if (s === 'para_birimi' || s === 'currency') return 'currency'
    if (s === 'notlar' || s === 'notes') return 'notes'
    if (s === 'proje_kodu' || s === 'project_code' || s === 'project') return 'project_code'
    if (s === 'kdv_orani' || s === 'tax_rate') return 'tax_rate'
    if (s === 'tedarikci_unvan_veya_eposta' || s === 'supplier_title_or_email' || s === 'supplier') return 'supplier'
    if (s === 'fatura_no' || s === 'invoice_number') return 'invoice_number'
    if (s === 'fatura_tarihi' || s === 'invoice_date') return 'invoice_date'
    if (s === 'vade_tarihi' || s === 'due_date') return 'due_date'
    if (s === 'toplam_tutar' || s === 'total_amount') return 'total_amount'
    if (s === 'fatura_tipi' || s === 'invoice_type') return 'invoice_type'
    if (s === 'durum' || s === 'status') return 'status'
    return s
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && (f.name.toLowerCase().endsWith('.xlsx') || f.name.endsWith('.csv') || f.type === 'text/csv')) {
      setFile(f)
      setReport(null)
    } else if (f) {
      toast.error(isTr ? 'Lütfen .xlsx veya .csv dosyası seçin' : 'Please select an .xlsx or .csv file')
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
      let rows: string[][]
      const isXlsx = file.name.toLowerCase().endsWith('.xlsx')
      if (isXlsx) {
        const buffer = await file.arrayBuffer()
        rows = parseExcel(buffer)
      } else {
        const text = await file.text()
        rows = parseCsv(text)
      }
      if (rows.length < 2) {
        toast.error(isTr ? 'Dosyada en az başlık ve bir veri satırı olmalı' : 'File must have header and at least one data row')
        setLoading(false)
        return
      }

      const headerRow = rows[0].map(normalizeHeader)
      const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

      if (importType === 'invoice') {
        const supplierIdx = headerRow.indexOf('supplier')
        const invoiceNumberIdx = headerRow.indexOf('invoice_number')
        const invoiceDateIdx = headerRow.indexOf('invoice_date')
        const dueDateIdx = headerRow.indexOf('due_date') >= 0 ? headerRow.indexOf('due_date') : -1
        const totalAmountIdx = headerRow.indexOf('total_amount')
        const invoiceTypeIdx = headerRow.indexOf('invoice_type') >= 0 ? headerRow.indexOf('invoice_type') : -1
        const statusIdx = headerRow.indexOf('status') >= 0 ? headerRow.indexOf('status') : -1
        if (supplierIdx < 0 || invoiceNumberIdx < 0 || invoiceDateIdx < 0 || totalAmountIdx < 0) {
          toast.error(isTr ? 'Sütunlar gerekli: tedarikçi, fatura_no, fatura_tarihi, toplam_tutar' : 'Required columns: supplier, invoice_number, invoice_date, total_amount')
          setLoading(false)
          return
        }
        const { data: suppliers } = await supabase
          .from('customers')
          .select('id, company_title, name, email')
          .eq('tenant_id', tenantId)
          .eq('status', 'active')
          .or('account_type.eq.vendor,account_type.eq.both')
        const supplierMap = new Map<string, string>()
        ;(suppliers || []).forEach((s: { id: string; company_title?: string | null; name?: string | null; email?: string | null }) => {
          if (s.company_title) supplierMap.set(normalize(String(s.company_title)), s.id)
          if (s.name) supplierMap.set(normalize(String(s.name)), s.id)
          if (s.email) supplierMap.set(normalize(String(s.email)), s.id)
        })
        if (supplierMap.size === 0) {
          const { data: allCustomers } = await supabase.from('customers').select('id, company_title, name, email').eq('tenant_id', tenantId).eq('status', 'active')
          ;(allCustomers || []).forEach((s: { id: string; company_title?: string | null; name?: string | null; email?: string | null }) => {
            if (s.company_title) supplierMap.set(normalize(String(s.company_title)), s.id)
            if (s.name) supplierMap.set(normalize(String(s.name)), s.id)
            if (s.email) supplierMap.set(normalize(String(s.email)), s.id)
          })
        }
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          const supplierVal = row[supplierIdx]?.trim()
          const invoiceNumberVal = row[invoiceNumberIdx]?.trim()
          const invoiceDateVal = row[invoiceDateIdx]?.trim()
          const dueDateVal = dueDateIdx >= 0 ? row[dueDateIdx]?.trim() : ''
          const totalAmountVal = row[totalAmountIdx]?.trim()
          const invoiceTypeVal = invoiceTypeIdx >= 0 ? (row[invoiceTypeIdx]?.trim() || 'purchase') : 'purchase'
          const statusVal = statusIdx >= 0 ? (row[statusIdx]?.trim() || 'pending') : 'pending'
          if (!supplierVal || !invoiceNumberVal || !invoiceDateVal || !totalAmountVal) {
            failed.push({ row: i + 1, reason: isTr ? 'Eksik alan (tedarikçi, fatura no, tarih, toplam)' : 'Missing required field (supplier, invoice_number, date, total)' })
            continue
          }
          const total = parseFloat(String(totalAmountVal).replace(',', '.'))
          if (isNaN(total) || total < 0) {
            failed.push({ row: i + 1, reason: (isTr ? 'Geçersiz toplam: ' : 'Invalid total: ') + totalAmountVal })
            continue
          }
          const supplierId = supplierMap.get(normalize(supplierVal))
          if (!supplierId) {
            failed.push({ row: i + 1, reason: (isTr ? 'Tedarikçi bulunamadı: ' : 'Supplier not found: ') + supplierVal })
            continue
          }
          const invType = VALID_PURCHASE_TYPES.includes(invoiceTypeVal.toLowerCase()) ? invoiceTypeVal.toLowerCase() : 'purchase'
          const invStatus = ['pending', 'accepted', 'rejected'].includes(statusVal.toLowerCase()) ? statusVal.toLowerCase() : 'pending'
          const dueDate = dueDateVal ? dueDateVal.split('T')[0] : invoiceDateVal.split('T')[0]
          try {
            const { error } = await supabase.from('purchase_invoices').insert({
              tenant_id: tenantId,
              supplier_id: supplierId,
              invoice_number: invoiceNumberVal,
              invoice_date: invoiceDateVal.split('T')[0],
              due_date: dueDate || null,
              subtotal: total,
              tax_amount: 0,
              total_amount: total,
              status: invStatus,
              invoice_type: invType,
            })
            if (error) {
              failed.push({ row: i + 1, reason: error.message })
              continue
            }
            success++
          } catch (err: any) {
            failed.push({ row: i + 1, reason: (err as Error)?.message || String(err) })
          }
        }
        setReport({ success, failed })
        if (success > 0) {
          toast.success(isTr ? `${success} gelen fatura içe aktarıldı` : `${success} incoming invoice(s) imported`)
          onSuccess()
        }
        if (failed.length > 0 && success === 0) {
          toast.error(isTr ? 'Hiç fatura aktarılamadı.' : 'No invoices imported.', { duration: 6000 })
        }
        setLoading(false)
        return
      }

      const categoryIdx = headerRow.indexOf('category')
      const descriptionIdx = headerRow.indexOf('description')
      const amountIdx = headerRow.indexOf('amount')
      const expenseDateIdx = headerRow.indexOf('expense_date')
      const paymentMethodIdx = headerRow.indexOf('payment_method')
      const currencyIdx = headerRow.indexOf('currency') >= 0 ? headerRow.indexOf('currency') : -1
      const notesIdx = headerRow.indexOf('notes') >= 0 ? headerRow.indexOf('notes') : -1
      const projectCodeIdx = headerRow.indexOf('project_code') >= 0 ? headerRow.indexOf('project_code') : -1
      const taxRateIdx = headerRow.indexOf('tax_rate') >= 0 ? headerRow.indexOf('tax_rate') : -1

      if (descriptionIdx < 0 || amountIdx < 0 || expenseDateIdx < 0) {
        toast.error(isTr ? 'Sütunlar gerekli: aciklama, tutar, gider_tarihi (şablonu kullanın)' : 'Required columns: description, amount, expense_date (use template)')
        setLoading(false)
        return
      }

      let projects: { id: string; code: string; name: string }[] = []
      const projectCodeVal = projectCodeIdx >= 0 ? rows[1]?.[projectCodeIdx]?.trim() : ''
      if (projectCodeIdx >= 0 && projectCodeVal) {
        const { data } = await supabase
          .from('projects')
          .select('id, code, name')
          .eq('tenant_id', tenantId)
          .in('status', ['planning', 'active'])
        projects = data || []
      }
      const projectByCode = new Map<string, string>()
      projects.forEach(p => {
        if (p.code) projectByCode.set(normalize(String(p.code)), p.id)
        if (p.name) projectByCode.set(normalize(String(p.name)), p.id)
      })

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const categoryVal = categoryIdx >= 0 ? (row[categoryIdx]?.trim() || 'general') : 'general'
        const descriptionVal = row[descriptionIdx]?.trim()
        const amountVal = row[amountIdx]?.trim()
        const expenseDateVal = row[expenseDateIdx]?.trim()
        const paymentMethodVal = paymentMethodIdx >= 0 ? (row[paymentMethodIdx]?.trim() || 'cash') : 'cash'
        const currencyVal = currencyIdx >= 0 ? (row[currencyIdx]?.trim() || 'TRY').toUpperCase() : 'TRY'
        const notesVal = notesIdx >= 0 ? row[notesIdx]?.trim() : ''
        const projectCodeRaw = projectCodeIdx >= 0 ? row[projectCodeIdx]?.trim() : ''
        const taxRateVal = taxRateIdx >= 0 ? (row[taxRateIdx]?.trim() || '20') : '20'

        if (!descriptionVal || !amountVal || !expenseDateVal) {
          failed.push({ row: i + 1, reason: isTr ? 'Eksik alan (açıklama, tutar, gider tarihi)' : 'Missing required field (description, amount, expense_date)' })
          continue
        }

        const amount = parseFloat(String(amountVal).replace(',', '.'))
        if (isNaN(amount) || amount <= 0) {
          failed.push({ row: i + 1, reason: (isTr ? 'Geçersiz tutar: ' : 'Invalid amount: ') + amountVal })
          continue
        }

        const category = VALID_CATEGORIES.includes(categoryVal.toLowerCase()) ? categoryVal.toLowerCase() : 'general'
        const payment_method = VALID_PAYMENT_METHODS.includes(paymentMethodVal.toLowerCase()) ? paymentMethodVal.toLowerCase() : 'cash'
        const expense_date = expenseDateVal.split('T')[0]
        const tax_rate = parseFloat(String(taxRateVal).replace(',', '.')) || 20

        let project_id: string | null = null
        if (projectCodeRaw) {
          const pk = normalize(projectCodeRaw)
          project_id = projectByCode.get(pk) ?? null
        }

        try {
          const insertData: Record<string, unknown> = {
            tenant_id: tenantId,
            category,
            description: descriptionVal,
            amount,
            expense_date,
            payment_method,
            currency: currencyVal,
            tax_rate,
            notes: notesVal || null,
          }
          if (project_id) insertData.project_id = project_id

          const { error } = await supabase.from('expenses').insert(insertData)

          if (error) {
            failed.push({ row: i + 1, reason: error.message })
            continue
          }
          success++
        } catch (err: any) {
          failed.push({ row: i + 1, reason: err?.message || String(err) })
        }
      }

      setReport({ success, failed })
      if (success > 0) {
        toast.success(isTr ? `${success} gider içe aktarıldı` : `${success} expense(s) imported`)
        onSuccess()
      }
      if (failed.length > 0 && success === 0) {
        toast.error(isTr ? 'Hiç gider aktarılamadı.' : 'No expenses imported.', { duration: 6000 })
      }
    } catch (err: any) {
      toast.error(err?.message || (isTr ? 'Dosya işlenemedi' : 'Failed to process file'))
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
    a.download = importType === 'invoice'
      ? (isTr ? 'gelen_fatura_aktarim_raporu.csv' : 'incoming_invoice_import_report.csv')
      : (isTr ? 'gider_aktarim_raporu.csv' : 'expense_import_report.csv')
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
          <DialogTitle>{isTr ? 'Toplu aktarım' : 'Bulk import'}</DialogTitle>
          <DialogDescription>
            {isTr
              ? 'Gider veya gelen fatura aktarımı seçin, Excel şablonunu indirip doldurun, dosyayı seçip içe aktarın.'
              : 'Choose expense or incoming invoice import, download the template, fill it in, then select the file to import.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Tabs value={importType} onValueChange={(v) => { setImportType(v as 'expense' | 'invoice'); setFile(null); setReport(null); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                {isTr ? 'Giderler' : 'Expenses'}
              </TabsTrigger>
              <TabsTrigger value="invoice" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {isTr ? 'Gelen Faturalar' : 'Incoming Invoices'}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={downloadTemplate} className="shrink-0">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {isTr ? 'Excel şablonu indir' : 'Download Excel template'}
            </Button>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv,text/csv"
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
