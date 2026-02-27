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

const SHEET_HEADERS = ['customer', 'total', 'currency', 'status', 'order_date', 'notes']

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled']

function cellToString(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'number') return String(val)
  if (typeof val === 'boolean') return val ? '1' : '0'
  if (val instanceof Date) return val.toISOString().slice(0, 10)
  return String(val).trim()
}

function parseExcel(buffer: ArrayBuffer): { headers: string[]; rows: string[][] } {
  const wb = XLSX.read(buffer, { type: 'array' })
  const firstSheet = wb.Sheets[wb.SheetNames[0]]
  if (!firstSheet) return { headers: [], rows: [] }
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: '' }) as unknown[][]
  if (aoa.length === 0) return { headers: [], rows: [] }
  const headers = (aoa[0] || []).map(cellToString)
  const colCount = headers.length
  const rows = aoa.slice(1)
    .map((row) => {
      const arr = (Array.isArray(row) ? row : []).map(cellToString)
      while (arr.length < colCount) arr.push('')
      return arr.slice(0, colCount)
    })
    .filter((r) => r.some((c) => c !== ''))
  return { headers, rows }
}

interface OrderExcelImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function OrderExcelImportDialog({ isOpen, onClose, onSuccess }: OrderExcelImportDialogProps) {
  const { tenantId } = useTenant()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<{ success: number; failed: { row: number; reason: string }[] } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isTr = language === 'tr'

  const normalizeHeader = (h: string): string => {
    const s = h.toLowerCase().replace(/\s+/g, '_')
    if (s === 'cari_unvan_veya_eposta' || s === 'customer') return 'customer'
    if (s === 'tutar' || s === 'total') return 'total'
    if (s === 'para_birimi' || s === 'currency') return 'currency'
    if (s === 'durum' || s === 'status') return 'status'
    if (s === 'siparis_tarihi' || s === 'order_date') return 'order_date'
    if (s === 'notlar' || s === 'notes') return 'notes'
    return s
  }

  const downloadTemplate = () => {
    const headers = isTr
      ? ['cari_unvan_veya_eposta', 'tutar', 'para_birimi', 'durum', 'siparis_tarihi', 'notlar']
      : SHEET_HEADERS
    const example = isTr
      ? ['Cariler sayfasindaki sirket unvani veya e-posta', 1500.00, 'TRY', 'pending', new Date().toISOString().slice(0, 10), 'Ornek not']
      : ['Company title or email from Customers page', 1500.00, 'TRY', 'pending', new Date().toISOString().slice(0, 10), 'Sample note']
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, example])
    XLSX.utils.book_append_sheet(wb, ws, isTr ? 'Siparisler' : 'Orders')
    XLSX.writeFile(wb, isTr ? 'siparis_sablonu.xlsx' : 'order_template.xlsx')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      setFile(f)
      setReport(null)
    } else if (f) {
      toast.error(isTr ? 'Lütfen .xlsx Excel dosyası seçin' : 'Please select an .xlsx Excel file')
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
      const buffer = await file.arrayBuffer()
      const { headers: rawHeaders, rows } = parseExcel(buffer)

      if (rows.length === 0) {
        toast.error(isTr ? 'Excel dosyasında başlık ve en az bir veri satırı olmalı' : 'Excel must have header and at least one data row')
        setLoading(false)
        return
      }

      const headerRow = rawHeaders.map(normalizeHeader)
      const customerIdx = headerRow.indexOf('customer')
      const totalIdx = headerRow.indexOf('total')
      const currencyIdx = headerRow.indexOf('currency') >= 0 ? headerRow.indexOf('currency') : -1
      const statusIdx = headerRow.indexOf('status') >= 0 ? headerRow.indexOf('status') : -1
      const orderDateIdx = headerRow.indexOf('order_date') >= 0 ? headerRow.indexOf('order_date') : -1
      const notesIdx = headerRow.indexOf('notes') >= 0 ? headerRow.indexOf('notes') : -1

      if (customerIdx < 0 || totalIdx < 0) {
        toast.error(isTr ? 'Excel sütunları: customer, total gerekli' : 'Excel must have columns: customer, total')
        setLoading(false)
        return
      }

      const { data: customers } = await supabase
        .from('customers')
        .select('id, company_title, email')
        .eq('tenant_id', tenantId)
      const customerMap = new Map<string, string>()
      const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
      customers?.forEach(c => {
        if (c.company_title) customerMap.set(normalize(String(c.company_title)), c.id)
        if (c.email) customerMap.set(normalize(String(c.email)), c.id)
      })

      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
      let orderSeq = (count || 0) + 1
      const prefix = `ORD-${new Date().getFullYear()}`

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const customerVal = row[customerIdx]?.trim()
        const totalVal = row[totalIdx]?.trim()
        const currencyVal = currencyIdx >= 0 ? (row[currencyIdx]?.trim() || 'TRY').toUpperCase() : 'TRY'
        const statusVal = statusIdx >= 0 ? (row[statusIdx]?.trim() || 'pending').toLowerCase() : 'pending'
        let orderDateVal = ''
        if (orderDateIdx >= 0 && row[orderDateIdx]) {
          const raw = String(row[orderDateIdx]).trim()
          if (raw) {
            const d = new Date(raw)
            if (!isNaN(d.getTime())) orderDateVal = d.toISOString().slice(0, 10)
          }
        }
        if (!orderDateVal) orderDateVal = new Date().toISOString().slice(0, 10)
        const notesVal = notesIdx >= 0 ? row[notesIdx]?.trim() : ''

        if (!customerVal || !totalVal) {
          failed.push({ row: i + 2, reason: isTr ? 'Eksik alan (customer, total zorunlu)' : 'Missing required field (customer, total)' })
          continue
        }

        const customerKey = normalize(customerVal)
        const customerId = customerMap.get(customerKey)
        if (!customerId) {
          failed.push({
            row: i + 2,
            reason: (isTr ? 'Cari bulunamadı (Cariler sayfasındaki ünvan veya e-posta ile eşleşmeli): ' : 'Customer not found (match company title or email from Customers page): ') + customerVal
          })
          continue
        }

        const total = parseFloat(String(totalVal).replace(',', '.'))
        if (isNaN(total) || total < 0) {
          failed.push({ row: i + 2, reason: (isTr ? 'Geçersiz tutar: ' : 'Invalid total: ') + totalVal })
          continue
        }

        const currencyCode = CURRENCY_LIST.some(c => c.code === currencyVal) ? currencyVal : 'TRY'
        const status = ORDER_STATUSES.includes(statusVal) ? statusVal : 'pending'

        try {
          const orderNumber = `${prefix}-${String(orderSeq).padStart(5, '0')}`
          orderSeq++

          const insertOrder: Record<string, unknown> = {
            tenant_id: tenantId,
            order_number: orderNumber,
            source: 'import',
            source_id: null,
            customer_id: customerId,
            status,
            subtotal: total,
            tax_total: 0,
            total,
            currency: currencyCode,
            notes: notesVal || null,
          }
          if (orderDateVal && /^\d{4}-\d{2}-\d{2}$/.test(orderDateVal)) insertOrder.order_date = orderDateVal
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(insertOrder)
            .select()
            .single()

          if (orderError) {
            failed.push({ row: i + 2, reason: orderError.message })
            continue
          }

          const { error: itemError } = await supabase
            .from('order_items')
            .insert({
              tenant_id: tenantId,
              order_id: order.id,
              product_id: null,
              product_name: isTr ? 'Excel içe aktarma' : 'Excel import',
              sku: null,
              quantity: 1,
              unit_price: total,
              tax_rate: 0,
              tax_amount: 0,
              discount: 0,
              total,
            })

          if (itemError) {
            failed.push({ row: i + 2, reason: itemError.message })
            continue
          }

          success++
        } catch (err: unknown) {
          failed.push({ row: i + 2, reason: err instanceof Error ? err.message : String(err) })
        }
      }

      setReport({ success, failed })
      if (success > 0) {
        toast.success(isTr ? `${success} sipariş içe aktarıldı` : `${success} order(s) imported`)
        onSuccess()
      }
      if (failed.length > 0 && success === 0) {
        const firstReason = failed[0]?.reason || ''
        toast.error(
          isTr ? `Hiç sipariş aktarılamadı. ${firstReason}` : `No orders imported. ${firstReason}`,
          { duration: 8000 }
        )
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isTr ? 'Excel işlenemedi' : 'Failed to process Excel'))
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    if (!report?.failed.length) return
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ['row', 'reason'],
      ...report.failed.map(f => [f.row, f.reason]),
    ])
    XLSX.utils.book_append_sheet(wb, ws, isTr ? 'Hatalar' : 'Errors')
    XLSX.writeFile(wb, isTr ? 'siparis_aktarim_raporu.xlsx' : 'order_import_report.xlsx')
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
          <DialogTitle>{isTr ? 'Sipariş Excel İçe Aktar' : 'Import Orders from Excel'}</DialogTitle>
          <DialogDescription>
            {isTr
              ? 'Excel (.xlsx) ile toplu sipariş oluşturun. İlk sütunda Cariler sayfasındaki şirket ünvanı veya e-postayı birebir yazın.'
              : 'Create orders in bulk from Excel (.xlsx). First column must match a company title or email from your Customers page.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={downloadTemplate} className="shrink-0">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {isTr ? 'Excel Şablonu İndir' : 'Download Excel Template'}
            </Button>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
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
                {file ? file.name : (isTr ? 'Excel Seç' : 'Choose Excel')}
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
