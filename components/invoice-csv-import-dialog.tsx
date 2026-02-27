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
import * as XLSX from 'xlsx'

const CSV_HEADERS = ['customer', 'sub_branch', 'invoice_type', 'currency', 'issue_date', 'due_date', 'project_code', 'notes', 'status', 'product_name', 'description', 'quantity', 'unit_price', 'vat_rate']

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
      ? ['ana_cari_unvan_veya_eposta', 'alt_sube_unvan_veya_kod', 'fatura_tipi', 'para_birimi', 'duzenleme_tarihi', 'vade_tarihi', 'proje_kodu', 'notlar', 'durum', 'urun_hizmet', 'aciklama', 'adet', 'birim_fiyat', 'kdv_orani']
      : CSV_HEADERS
    const example = isTr
      ? ['Ana cari sirket unvani veya e-posta', 'Bos veya alt sube unvani/sube kodu', 'sale', 'TRY', '2025-01-15', '2025-02-15', '', 'Ornek not', 'draft', 'Urun veya hizmet adi', 'Kalem aciklamasi', '2', '750.00', '20']
      : ['Main customer company title or email', 'Leave empty or sub-branch title/code', 'sale', 'TRY', '2025-01-15', '2025-02-15', '', 'Sample note', 'draft', 'Product or service name', 'Line description', '2', '750.00', '20']
    const aoa = [headers, example]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, isTr ? 'Faturalar' : 'Invoices')
    XLSX.writeFile(wb, isTr ? 'fatura_sablonu.xlsx' : 'invoice_template.xlsx')
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
    if (s === 'cari_unvan_veya_eposta' || s === 'ana_cari_unvan_veya_eposta' || s === 'customer') return 'customer'
    if (s === 'alt_sube_unvan_veya_kod' || s === 'sub_branch' || s === 'sube' || s === 'alt_sube') return 'sub_branch'
    if (s === 'tutar' || s === 'amount') return 'amount'
    if (s === 'duzenleme_tarihi' || s === 'issue_date') return 'issue_date'
    if (s === 'vade_tarihi' || s === 'due_date') return 'due_date'
    if (s === 'notlar' || s === 'notes') return 'notes'
    if (s === 'durum' || s === 'status') return 'status'
    if (s === 'fatura_tipi' || s === 'invoice_type') return 'invoice_type'
    if (s === 'para_birimi' || s === 'currency') return 'currency'
    if (s === 'proje_kodu' || s === 'project_code' || s === 'project') return 'project_code'
    if (s === 'urun_hizmet' || s === 'product_name') return 'product_name'
    if (s === 'aciklama' || s === 'description') return 'description'
    if (s === 'adet' || s === 'quantity') return 'quantity'
    if (s === 'birim_fiyat' || s === 'unit_price') return 'unit_price'
    if (s === 'kdv_orani' || s === 'vat_rate' || s === 'vat') return 'vat_rate'
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
      const customerIdx = headerRow.indexOf('customer')
      const amountIdx = headerRow.indexOf('amount')
      const issueDateIdx = headerRow.indexOf('issue_date')
      const dueDateIdx = headerRow.indexOf('due_date')
      const notesIdx = headerRow.indexOf('notes') >= 0 ? headerRow.indexOf('notes') : -1
      const statusIdx = headerRow.indexOf('status') >= 0 ? headerRow.indexOf('status') : -1
      const typeIdx = headerRow.indexOf('invoice_type') >= 0 ? headerRow.indexOf('invoice_type') : -1
      const currencyIdx = headerRow.indexOf('currency') >= 0 ? headerRow.indexOf('currency') : -1
      const projectCodeIdx = headerRow.indexOf('project_code') >= 0 ? headerRow.indexOf('project_code') : -1
      const subBranchIdx = headerRow.indexOf('sub_branch') >= 0 ? headerRow.indexOf('sub_branch') : -1
      const productNameIdx = headerRow.indexOf('product_name') >= 0 ? headerRow.indexOf('product_name') : -1
      const descriptionIdx = headerRow.indexOf('description') >= 0 ? headerRow.indexOf('description') : -1
      const quantityIdx = headerRow.indexOf('quantity') >= 0 ? headerRow.indexOf('quantity') : -1
      const unitPriceIdx = headerRow.indexOf('unit_price') >= 0 ? headerRow.indexOf('unit_price') : -1
      const vatRateIdx = headerRow.indexOf('vat_rate') >= 0 ? headerRow.indexOf('vat_rate') : -1

      const hasLineColumns = quantityIdx >= 0 && unitPriceIdx >= 0
      const requireAmount = !hasLineColumns

      if (customerIdx < 0 || issueDateIdx < 0 || dueDateIdx < 0) {
        toast.error(isTr ? 'Sütunlar gerekli: cari, duzenleme_tarihi, vade_tarihi (şablonu kullanın)' : 'Required columns: customer, issue_date, due_date (use template)')
        setLoading(false)
        return
      }
      if (requireAmount && amountIdx < 0) {
        toast.error(isTr ? 'Tutar sütunu gerekli veya adet/birim_fiyat/kdv_orani ile kalem girin' : 'Amount column required or provide quantity, unit_price, vat_rate')
        setLoading(false)
        return
      }

      const [{ data: customers }, { data: projects }] = await Promise.all([
        supabase.from('customers').select('id, company_title, email, parent_customer_id, branch_code').eq('tenant_id', tenantId).eq('status', 'active'),
        supabase.from('projects').select('id, name, code').eq('tenant_id', tenantId).in('status', ['planning', 'active']),
      ])
      const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
      const customerMap = new Map<string, string>()
      const subBranchMap = new Map<string, string>()
      customers?.forEach(c => {
        const isMain = c.parent_customer_id == null || (c as { branch_type?: string }).branch_type === 'main'
        if (isMain) {
          if (c.company_title) customerMap.set(normalize(String(c.company_title)), c.id)
          if (c.email) customerMap.set(normalize(String(c.email)), c.id)
        }
        if (c.parent_customer_id) {
          const pid = c.parent_customer_id as string
          if (c.company_title) subBranchMap.set(`${pid}|${normalize(String(c.company_title))}`, c.id)
          if (c.branch_code) subBranchMap.set(`${pid}|${normalize(String(c.branch_code))}`, c.id)
        }
      })
      const projectByCode = new Map<string, string>()
      const projectByName = new Map<string, string>()
      projects?.forEach(p => {
        if (p.code) projectByCode.set(normalize(String(p.code)), p.id)
        if (p.name) projectByName.set(normalize(String(p.name)), p.id)
      })

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const customerVal = row[customerIdx]?.trim()
        const subBranchVal = subBranchIdx >= 0 ? row[subBranchIdx]?.trim() : ''
        const amountVal = amountIdx >= 0 ? row[amountIdx]?.trim() : ''
        const issueDateVal = row[issueDateIdx]?.trim()
        const dueDateVal = row[dueDateIdx]?.trim()
        const notesVal = notesIdx >= 0 ? row[notesIdx]?.trim() : ''
        const statusVal = statusIdx >= 0 ? (row[statusIdx]?.trim() || 'draft') : 'draft'
        const typeVal = typeIdx >= 0 ? (row[typeIdx]?.trim() || 'sale') : 'sale'
        const currencyVal = currencyIdx >= 0 ? (row[currencyIdx]?.trim() || 'TRY').toUpperCase() : 'TRY'
        const currencyCode = CURRENCY_LIST.some(c => c.code === currencyVal) ? currencyVal : 'TRY'
        const projectCodeVal = projectCodeIdx >= 0 ? row[projectCodeIdx]?.trim() : ''
        const productNameVal = productNameIdx >= 0 ? row[productNameIdx]?.trim() : (isTr ? 'Toplu aktarım' : 'Bulk import')
        const descriptionVal = descriptionIdx >= 0 ? row[descriptionIdx]?.trim() : notesVal || null
        const quantityVal = quantityIdx >= 0 ? row[quantityIdx]?.trim() : ''
        const unitPriceVal = unitPriceIdx >= 0 ? row[unitPriceIdx]?.trim() : ''
        const vatRateVal = vatRateIdx >= 0 ? row[vatRateIdx]?.trim() : '0'

        if (!customerVal || !issueDateVal || !dueDateVal) {
          failed.push({ row: i + 1, reason: isTr ? 'Eksik alan (cari, düzenleme tarihi, vade tarihi)' : 'Missing required field (customer, issue_date, due_date)' })
          continue
        }

        const customerKey = normalize(customerVal)
        const mainCustomerId = customerMap.get(customerKey)
        if (!mainCustomerId) {
          failed.push({
            row: i + 1,
            reason: (isTr ? 'Ana cari bulunamadı (ünvan veya e-posta ile birebir eşleşmeli): ' : 'Main customer not found (match company title or email): ') + customerVal
          })
          continue
        }
        let customerId: string
        if (subBranchVal) {
          const branchKey = `${mainCustomerId}|${normalize(subBranchVal)}`
          const branchId = subBranchMap.get(branchKey)
          if (!branchId) {
            failed.push({
              row: i + 1,
              reason: (isTr ? 'Alt şube bulunamadı (bu ana cariye ait şube ünvanı veya şube kodu yazın): ' : 'Sub-branch not found (use branch title or code for this customer): ') + subBranchVal
            })
            continue
          }
          customerId = branchId
        } else {
          customerId = mainCustomerId
        }

        let subtotal: number
        let totalVat: number
        let amount: number
        let lineQuantity: number
        let lineUnitPrice: number
        let lineVatRate: number
        let lineTotal: number
        let lineVatAmount: number
        let lineTotalWithVat: number
        let lineProductName: string
        let lineDescription: string | null

        if (hasLineColumns && quantityVal !== '' && unitPriceVal !== '') {
          const q = parseFloat(quantityVal.replace(',', '.'))
          const up = parseFloat(unitPriceVal.replace(',', '.'))
          const vatPct = parseFloat(String(vatRateVal).replace(',', '.')) || 0
          if (isNaN(q) || q <= 0 || isNaN(up) || up < 0) {
            failed.push({ row: i + 1, reason: isTr ? 'Geçersiz adet veya birim fiyat' : 'Invalid quantity or unit price' })
            continue
          }
          lineQuantity = q
          lineUnitPrice = up
          lineVatRate = Math.min(100, Math.max(0, vatPct))
          lineTotal = Math.round(lineQuantity * lineUnitPrice * 100) / 100
          lineVatAmount = Math.round(lineTotal * (lineVatRate / 100) * 100) / 100
          lineTotalWithVat = Math.round((lineTotal + lineVatAmount) * 100) / 100
          subtotal = lineTotal
          totalVat = lineVatAmount
          amount = lineTotalWithVat
          lineProductName = productNameVal || (isTr ? 'Toplu aktarım' : 'Bulk import')
          lineDescription = descriptionVal || null
        } else {
          if (!amountVal) {
            failed.push({ row: i + 1, reason: isTr ? 'Tutar gerekli veya adet/birim_fiyat doldurun' : 'Amount required or fill quantity/unit_price' })
            continue
          }
          const amt = parseFloat(amountVal.replace(',', '.'))
          if (isNaN(amt) || amt <= 0) {
            failed.push({ row: i + 1, reason: (isTr ? 'Geçersiz tutar: ' : 'Invalid amount: ') + amountVal })
            continue
          }
          amount = amt
          subtotal = amt
          totalVat = 0
          lineQuantity = 1
          lineUnitPrice = amt
          lineVatRate = 0
          lineTotal = amt
          lineVatAmount = 0
          lineTotalWithVat = amt
          lineProductName = productNameVal || (isTr ? 'Toplu aktarım' : 'Bulk import')
          lineDescription = descriptionVal || null
        }

        const issueDate = issueDateVal.split('T')[0]
        const dueDate = dueDateVal.split('T')[0]
        const status = ['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(statusVal.toLowerCase())
          ? statusVal.toLowerCase()
          : 'draft'
        const invoiceType = ['sale', 'sale_return', 'devir', 'devir_return'].includes(typeVal.toLowerCase())
          ? typeVal.toLowerCase()
          : 'sale'

        let projectId: string | null = null
        if (projectCodeVal) {
          const pk = normalize(projectCodeVal)
          projectId = projectByCode.get(pk) ?? projectByName.get(pk) ?? null
        }

        try {
          const invoiceNumber = `INV-${Date.now().toString().slice(-8)}-${i}`
          const { data: invoice, error: invErr } = await supabase
            .from('invoices')
            .insert({
              tenant_id: tenantId,
              customer_id: customerId,
              invoice_number: invoiceNumber,
              amount,
              subtotal,
              total_vat: totalVat,
              status,
              invoice_type: invoiceType,
              currency: currencyCode,
              issue_date: issueDate,
              due_date: dueDate,
              notes: notesVal || null,
              project_id: projectId,
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
            product_name: lineProductName,
            description: lineDescription,
            quantity: lineQuantity,
            unit_price: lineUnitPrice,
            vat_rate: lineVatRate,
            line_total: lineTotal,
            vat_amount: lineVatAmount,
            total_with_vat: lineTotalWithVat,
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
      <DialogContent className="sm:max-w-md bg-cyan-50">
        <DialogHeader>
          <DialogTitle>{isTr ? 'Toplu aktarım' : 'Bulk import'}</DialogTitle>
          <DialogDescription>
            {isTr
              ? 'Excel şablonu ile toplu fatura oluşturun. İlk sütunda ana cari ünvanı/e-postası, ikinci sütunda isteğe bağlı alt şube ünvanı veya şube kodu. Alt şube doluysa fatura o şubeye atanır.'
              : 'Create invoices in bulk from Excel template. First column: main customer title/email; second column: optional sub-branch title or code. If sub-branch is set, the invoice is assigned to that branch.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
