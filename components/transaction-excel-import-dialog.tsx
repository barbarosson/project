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
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, Loader2, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const PAYMENT_METHODS: Record<string, 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other'> = {
  nakit: 'cash',
  cash: 'cash',
  havale: 'bank_transfer',
  bank_transfer: 'bank_transfer',
  transfer: 'bank_transfer',
  kredi_karti: 'credit_card',
  credit_card: 'credit_card',
  'kredi kartı': 'credit_card',
  cek: 'check',
  check: 'check',
  'çek': 'check',
  diger: 'other',
  other: 'other',
  'diğer': 'other',
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  const sep = delimiter === ';' ? ';' : ','
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if ((c === sep && !inQuotes) || (delimiter === ',' && c === '\t')) {
      result.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

function detectDelimiter(firstLine: string): ',' | ';' {
  const byComma = parseCSVLine(firstLine, ',').length
  const bySemicolon = parseCSVLine(firstLine, ';').length
  return bySemicolon > byComma ? ';' : ','
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const raw = text.replace(/^\uFEFF/, '').trim()
  const lines = raw.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }
  const delimiter = detectDelimiter(lines[0])
  const headers = parseCSVLine(lines[0], delimiter)
  const headerCount = headers.length
  const rows = lines
    .slice(1)
    .map((l) => parseCSVLine(l, delimiter))
    .filter((r) => r.some((c) => c))
  const normalized = rows.map((r) => {
    const arr = [...r]
    while (arr.length < headerCount) arr.push('')
    return arr.slice(0, headerCount)
  })
  return { headers, rows: normalized }
}

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
  const aoa = XLSX.utils.sheet_to_json<any[]>(firstSheet, { header: 1, defval: '' }) as unknown[][]
  if (aoa.length === 0) return { headers: [], rows: [] }
  const headers = (aoa[0] || []).map(cellToString)
  const colCount = headers.length
  const rows = aoa
    .slice(1)
    .map((row) => {
      const arr = (Array.isArray(row) ? row : []).map(cellToString)
      while (arr.length < colCount) arr.push('')
      return arr.slice(0, colCount)
    })
    .filter((r) => r.some((c) => c !== ''))
  return { headers, rows }
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, ' ').trim()
}

const HEADER_MAP: Record<string, string> = {
  tarih: 'transaction_date',
  date: 'transaction_date',
  transaction_date: 'transaction_date',
  'işlem tarihi': 'transaction_date',
  'açıklama': 'description',
  description: 'description',
  aciklama: 'description',
  hesap: 'account',
  account: 'account',
  'hesap adı': 'account',
  'account name': 'account',
  tip: 'transaction_type',
  type: 'transaction_type',
  transaction_type: 'transaction_type',
  'işlem tipi': 'transaction_type',
  gelir: 'transaction_type',
  gider: 'transaction_type',
  income: 'transaction_type',
  expense: 'transaction_type',
  tutar: 'amount',
  amount: 'amount',
  'para birimi': 'currency',
  currency: 'currency',
  cari: 'customer',
  customer: 'customer',
  'müşteri': 'customer',
  musteri: 'customer',
  'ödeme yöntemi': 'payment_method',
  'odeme yontemi': 'payment_method',
  payment_method: 'payment_method',
  'notlar': 'notes',
  notes: 'notes',
}

function parseAmount(value: string): number {
  const s = String(value || '').replace(/\s/g, '').trim()
  if (!s) return 0
  const negative = s.startsWith('-')
  const numPart = negative ? s.slice(1) : s
  let normalized = numPart
  if (numPart.includes(',') && numPart.includes('.')) {
    const lastComma = numPart.lastIndexOf(',')
    const lastDot = numPart.lastIndexOf('.')
    if (lastComma > lastDot) {
      normalized = numPart.replace(/\./g, '').replace(',', '.')
    } else {
      normalized = numPart.replace(/,/g, '')
    }
  } else if (numPart.includes(',')) {
    const parts = numPart.split(',')
    normalized =
      parts.length > 1 && parts[parts.length - 1].length <= 2
        ? numPart.replace(/\./g, '').replace(',', '.')
        : numPart.replace(/,/g, '')
  } else {
    normalized = numPart.replace(/,/g, '')
  }
  const n = parseFloat(normalized)
  if (Number.isNaN(n)) return 0
  return negative ? -n : n
}

function parseDate(value: string): string | null {
  const s = String(value || '').trim()
  if (!s) return null
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

export type TransactionImportReport = {
  successCount: number
  successDetails: { row: number; description: string; amount: number }[]
  failedCount: number
  failedDetails: { row: number; description: string; reason: string }[]
}

interface TransactionExcelImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const TEMPLATE_HEADERS_TR = ['Tarih', 'Açıklama', 'Hesap', 'Tip', 'Tutar', 'Para Birimi', 'Cari', 'Ödeme Yöntemi', 'Notlar']
const TEMPLATE_HEADERS_EN = ['Date', 'Description', 'Account', 'Type', 'Amount', 'Currency', 'Customer', 'Payment Method', 'Notes']
const TEMPLATE_DATA_TR: string[][] = [
  ['2025-01-15', 'Nakit tahsilat', 'Kasa', 'gelir', '5000', 'TRY', 'Örnek Müşteri A.Ş.', 'nakit', ''],
  ['2025-01-16', 'Ofis malzemeleri', 'Kasa', 'gider', '350', 'TRY', '', 'nakit', ''],
]
const TEMPLATE_DATA_EN: string[][] = [
  ['2025-01-15', 'Cash collection', 'Cash', 'income', '5000', 'TRY', 'Example Customer Inc.', 'cash', ''],
  ['2025-01-16', 'Office supplies', 'Cash', 'expense', '350', 'TRY', '', 'cash', ''],
]

export function TransactionExcelImportDialog({
  isOpen,
  onClose,
  onSuccess,
}: TransactionExcelImportDialogProps) {
  const { tenantId } = useTenant()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][]; count: number } | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importReport, setImportReport] = useState<TransactionImportReport | null>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isTr = language === 'tr'

  const getCol = (headers: string[], values: string[], key: string): string => {
    const n = normalizeHeader(key)
    const mapped = HEADER_MAP[n] || n.replace(/\s/g, '_')
    const idx = headers.findIndex((h) => {
      const nh = normalizeHeader(h)
      return HEADER_MAP[nh] === mapped || nh.replace(/\s/g, '_') === mapped
    })
    if (idx >= 0 && values[idx] !== undefined) return String(values[idx]).trim()
    return ''
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setFile(f || null)
    setParseError(null)
    setPreview(null)
    if (!f) return
    const isXlsx = f.name.toLowerCase().endsWith('.xlsx')
    if (!f.name.toLowerCase().endsWith('.csv') && !isXlsx) {
      setParseError(isTr ? 'Lütfen .csv veya .xlsx dosyası seçin.' : 'Please select a .csv or .xlsx file.')
      return
    }
    if (isXlsx) {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const { headers, rows } = parseExcel(reader.result as ArrayBuffer)
          if (headers.length === 0) {
            setParseError(isTr ? "Excel'de başlık satırı bulunamadı." : 'No header row found in Excel.')
            return
          }
          setPreview({ headers, rows, count: rows.length })
        } catch {
          setParseError(isTr ? 'Excel dosyası okunamadı.' : 'Could not read Excel file.')
        }
      }
      reader.readAsArrayBuffer(f)
    } else {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const text = String(reader.result)
          const { headers, rows } = parseCSV(text)
          if (headers.length === 0) {
            setParseError(isTr ? 'CSV başlıkları bulunamadı.' : 'CSV headers not found.')
            return
          }
          setPreview({ headers, rows, count: rows.length })
        } catch {
          setParseError(isTr ? 'Dosya okunamadı.' : 'Could not read file.')
        }
      }
      reader.readAsText(f, 'UTF-8')
    }
  }

  const handleImport = async () => {
    if (!tenantId || !file || !preview) return
    setLoading(true)
    try {
      const isXlsx = file.name.toLowerCase().endsWith('.xlsx')
      const { headers, rows } = isXlsx
        ? parseExcel(await file.arrayBuffer())
        : parseCSV(
            await new Promise<string>((res, rej) => {
              const r = new FileReader()
              r.onload = () => res(String(r.result))
              r.onerror = rej
              r.readAsText(file, 'UTF-8')
            })
          )

      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
      const accountByName = new Map<string, string>()
      ;(accounts || []).forEach((a: { id: string; name: string }) => {
        const n = a.name.toLowerCase().trim()
        accountByName.set(n, a.id)
      })

      const { data: customers } = await supabase
        .from('customers')
        .select('id, company_title, name')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
      const customerByName = new Map<string, string>()
      ;(customers || []).forEach((c: { id: string; company_title?: string | null; name?: string | null }) => {
        if (c.company_title) customerByName.set(String(c.company_title).toLowerCase().trim(), c.id)
        if (c.name) customerByName.set(String(c.name).toLowerCase().trim(), c.id)
      })

      const failedDetails: { row: number; description: string; reason: string }[] = []
      const toInsert: { rowIndex: number; description: string; amount: number; payload: Record<string, unknown> }[] = []

      for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 2
        const row = rows[i]
        const dateStr = getCol(headers, row, 'Tarih') || getCol(headers, row, 'Date')
        const description = getCol(headers, row, 'Açıklama') || getCol(headers, row, 'Description')
        const accountName = getCol(headers, row, 'Hesap') || getCol(headers, row, 'Account')
        const typeRaw = (getCol(headers, row, 'Tip') || getCol(headers, row, 'Type')).toLowerCase()
        const amountStr = getCol(headers, row, 'Tutar') || getCol(headers, row, 'Amount')
        const currency = (getCol(headers, row, 'Para Birimi') || getCol(headers, row, 'Currency') || 'TRY').toUpperCase().trim() || 'TRY'
        const customerName = getCol(headers, row, 'Cari') || getCol(headers, row, 'Customer')
        const paymentRaw = (getCol(headers, row, 'Ödeme Yöntemi') || getCol(headers, row, 'Payment Method')).toLowerCase().replace(/\s+/g, '_')
        const notes = getCol(headers, row, 'Notlar') || getCol(headers, row, 'Notes')

        const transaction_date = parseDate(dateStr)
        if (!transaction_date) {
          failedDetails.push({
            row: rowNum,
            description: description || accountName || amountStr || '—',
            reason: isTr ? 'Geçerli tarih gerekli (YYYY-MM-DD)' : 'Valid date required (YYYY-MM-DD)',
          })
          continue
        }

        const accountId = accountName ? accountByName.get(accountName.toLowerCase().trim()) : null
        if (!accountId) {
          failedDetails.push({
            row: rowNum,
            description: description || accountName || amountStr || '—',
            reason: isTr ? `Hesap bulunamadı: "${accountName}"` : `Account not found: "${accountName}"`,
          })
          continue
        }

        let transaction_type: 'income' | 'expense' = 'income'
        if (typeRaw === 'gider' || typeRaw === 'expense' || typeRaw === 'çıkış') {
          transaction_type = 'expense'
        } else if (typeRaw === 'gelir' || typeRaw === 'income' || typeRaw === 'giriş') {
          transaction_type = 'income'
        }

        const amount = parseAmount(amountStr)
        if (amount <= 0) {
          failedDetails.push({
            row: rowNum,
            description: description || accountName || amountStr || '—',
            reason: isTr ? 'Tutar 0\'dan büyük olmalı' : 'Amount must be greater than 0',
          })
          continue
        }

        const payment_method = PAYMENT_METHODS[paymentRaw] || PAYMENT_METHODS[paymentRaw.replace(/_/g, ' ')] || 'other'
        const customer_id = customerName ? customerByName.get(customerName.toLowerCase().trim()) || null : null

        toInsert.push({
          rowIndex: rowNum,
          description: description || '—',
          amount,
          payload: {
            tenant_id: tenantId,
            account_id: accountId,
            transaction_type,
            amount,
            currency,
            transaction_date,
            description: description || null,
            customer_id,
            payment_method,
            notes: notes || null,
            reference_type: 'other',
          },
        })
      }

      const successDetails: { row: number; description: string; amount: number }[] = []
      const BATCH = 50
      for (let i = 0; i < toInsert.length; i += BATCH) {
        const chunk = toInsert.slice(i, i + BATCH)
        const batch = chunk.map((x) => x.payload)
        const { error } = await supabase.from('transactions').insert(batch)
        if (error) {
          chunk.forEach((x) =>
            failedDetails.push({
              row: x.rowIndex,
              description: x.description,
              reason: error.message,
            })
          )
        } else {
          chunk.forEach((x) => successDetails.push({ row: x.rowIndex, description: x.description, amount: x.amount }))
        }
      }
      const report: TransactionImportReport = {
        successCount: successDetails.length,
        successDetails,
        failedCount: failedDetails.length,
        failedDetails,
      }
      setImportReport(report)
      setShowReportDialog(true)
      onSuccess()
      toast.success(isTr ? `${successDetails.length} işlem aktarıldı.` : `${successDetails.length} transaction(s) imported.`)
    } catch (err: unknown) {
      console.error(err)
      toast.error(isTr ? 'İçe aktarma sırasında hata oluştu.' : 'An error occurred during import.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const lang = isTr ? 'tr' : 'en'
    const headers = lang === 'tr' ? TEMPLATE_HEADERS_TR : TEMPLATE_HEADERS_EN
    const data = lang === 'tr' ? TEMPLATE_DATA_TR : TEMPLATE_DATA_EN
    if (format === 'xlsx') {
      const aoa: string[][] = [headers]
      data.forEach((row) => aoa.push(row))
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, isTr ? 'İşlemler' : 'Transactions')
      XLSX.writeFile(wb, isTr ? 'islem_import_sablonu.xlsx' : 'transaction_import_template.xlsx')
    } else {
      const headerLine = headers.join(',')
      const rowLines = data.map((row) => row.map((cell) => (cell.includes(',') ? `"${cell}"` : cell)).join(','))
      const csv = '\uFEFF' + headerLine + '\n' + rowLines.join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = isTr ? 'islem_import_sablonu.csv' : 'transaction_import_template.csv'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    setParseError(null)
    setImportReport(null)
    setShowReportDialog(false)
    if (inputRef.current) inputRef.current.value = ''
    onClose()
  }

  const downloadReport = () => {
    if (!importReport) return
    const colResult = isTr ? 'Sonuç' : 'Result'
    const colRow = isTr ? 'Satır' : 'Row'
    const colDesc = isTr ? 'Açıklama' : 'Description'
    const colAmount = isTr ? 'Tutar' : 'Amount'
    const colReason = isTr ? 'Neden' : 'Reason'
    const headers = `${colResult},${colRow},${colDesc},${colAmount},${colReason}\n`
    const successLabel = isTr ? 'Başarılı' : 'Success'
    const failedLabel = isTr ? 'Başarısız' : 'Failed'
    const successLines = importReport.successDetails
      .map((s) => `${successLabel},${s.row},${s.description},${s.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })},`)
      .join('\n')
    const failedLines = importReport.failedDetails.map((f) => `${failedLabel},${f.row},${f.description},,${f.reason}`).join('\n')
    const summary = isTr
      ? `İçe Aktarma Raporu\nToplam başarılı: ${importReport.successCount}\nToplam başarısız: ${importReport.failedCount}\n\n`
      : `Import Report\nTotal success: ${importReport.successCount}\nTotal failed: ${importReport.failedCount}\n\n`
    const csv = '\uFEFF' + summary + headers + successLines + (successLines ? '\n' : '') + failedLines
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = isTr ? `islem_import_raporu_${new Date().toISOString().slice(0, 10)}.csv` : `transaction_import_report_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={
          showReportDialog && importReport
            ? 'sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-cyan-50'
            : 'sm:max-w-lg bg-cyan-50'
        }
      >
        {showReportDialog && importReport ? (
          <>
            <DialogHeader>
              <DialogTitle>{isTr ? 'İçe Aktarma Raporu' : 'Import Report'}</DialogTitle>
              <DialogDescription>
                {isTr
                  ? `Toplam ${importReport.successCount} başarılı, ${importReport.failedCount} başarısız.`
                  : `Total ${importReport.successCount} success, ${importReport.failedCount} failed.`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 py-2">
              <div className="rounded border bg-green-50 p-3 text-sm">
                <p className="font-semibold text-green-800">
                  {isTr ? `Başarılı (${importReport.successCount})` : `Success (${importReport.successCount})`}
                </p>
                <ul className="mt-2 max-h-32 overflow-y-auto text-green-700 space-y-1">
                  {importReport.successDetails.length === 0 ? (
                    <li className="text-muted-foreground">—</li>
                  ) : (
                    importReport.successDetails.slice(0, 20).map((s, i) => (
                      <li key={i}>
                        {isTr ? `Satır ${s.row}:` : `Row ${s.row}:`} {s.description} — {s.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </li>
                    ))
                  )}
                  {importReport.successDetails.length > 20 && (
                    <li className="text-muted-foreground">… +{importReport.successDetails.length - 20}</li>
                  )}
                </ul>
              </div>
              <div className="rounded border bg-red-50 p-3 text-sm">
                <p className="font-semibold text-red-800">
                  {isTr ? `Başarısız (${importReport.failedCount})` : `Failed (${importReport.failedCount})`}
                </p>
                <ul className="mt-2 max-h-48 overflow-y-auto text-red-700 space-y-2">
                  {importReport.failedDetails.length === 0 ? (
                    <li className="text-muted-foreground">—</li>
                  ) : (
                    importReport.failedDetails.map((f, i) => (
                      <li key={i}>
                        <span className="font-medium">
                          {isTr ? `Satır ${f.row}:` : `Row ${f.row}:`} {f.description}
                        </span>
                        <span className="block text-xs text-red-600">
                          {isTr ? 'Neden:' : 'Reason:'} {f.reason}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={downloadReport} className="gap-2">
                <Download className="h-4 w-4" />
                {isTr ? 'Raporu İndir' : 'Download Report'}
              </Button>
              <Button type="button" onClick={handleClose}>
                {isTr ? 'Tamam' : 'OK'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{isTr ? 'Toplu aktarım' : 'Bulk import'}</DialogTitle>
              <DialogDescription>
                {isTr
                  ? 'CSV veya Excel dosyasında ilk satır sütun başlıkları olmalıdır. Şablonu indirip doldurup yükleyebilirsiniz. Tip: gelir / gider (veya income / expense). Hesap ve Cari, sistemdeki hesap ve cari adlarıyla eşleşmelidir.'
                  : 'First row must be column headers. Download the template, fill it in, and upload. Type: income / expense. Account and Customer must match existing account and customer names.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => handleDownloadTemplate('xlsx')} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {isTr ? 'Excel Şablonu' : 'Excel Template'}
                </Button>
                <Button type="button" variant="outline" onClick={() => handleDownloadTemplate('csv')} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {isTr ? 'CSV Şablonu' : 'CSV Template'}
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {file ? file.name : (isTr ? 'Dosya Seç' : 'Select File')}
                </Button>
              </div>
              {parseError && <p className="text-sm text-red-600">{parseError}</p>}
              {preview && (
                <div className="rounded border bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-slate-700">
                    {preview.count} {isTr ? 'satır bulundu. Önizleme (ilk 5):' : 'rows found. Preview (first 5):'}
                  </p>
                  <div className="mt-2 overflow-auto max-h-32 font-mono text-xs">
                    <div className="text-slate-500">{preview.headers.join(', ')}</div>
                    {preview.rows.slice(0, 5).map((row, i) => (
                      <div key={i} className="text-slate-700">
                        {row.slice(0, 4).join(', ')}
                        {row.length > 4 ? '...' : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                {isTr ? 'İptal' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={!preview || preview.count === 0 || loading}
                className="flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isTr ? 'İçe Aktar' : 'Import'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
