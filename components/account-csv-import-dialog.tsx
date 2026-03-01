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

const HEADER_MAP: Record<string, string> = {
  'hesap adi': 'name',
  'hesap adı': 'name',
  'name': 'name',
  'tip': 'type',
  'type': 'type',
  'hesap tipi': 'type',
  'account type': 'type',
  'para birimi': 'currency',
  'currency': 'currency',
  'acilis bakiyesi': 'opening_balance',
  'açılış bakiyesi': 'opening_balance',
  'opening balance': 'opening_balance',
  'opening_balance': 'opening_balance',
  'bakiye': 'opening_balance',
  'hesap numarasi': 'account_number',
  'hesap numarası': 'account_number',
  'account number': 'account_number',
  'account_number': 'account_number',
  'iban': 'account_number',
  'banka adi': 'bank_name',
  'banka adı': 'bank_name',
  'bank name': 'bank_name',
  'bank_name': 'bank_name',
  'kart son dort': 'card_last_four',
  'kart son dört': 'card_last_four',
  'card last four': 'card_last_four',
  'card_last_four': 'card_last_four',
  'kart sahibi': 'card_holder_name',
  'card holder': 'card_holder_name',
  'card_holder_name': 'card_holder_name',
  'notlar': 'notes',
  'notes': 'notes',
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
  return h
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function parseOpeningBalance(value: string): number {
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
    normalized = numPart.replace(/\./g, '')
  }
  const n = parseFloat(normalized)
  if (Number.isNaN(n)) return 0
  return negative ? -n : n
}

function mapRowToAccount(
  headers: string[],
  values: string[],
  tenantId: string
): Record<string, unknown> | null {
  const get = (key: string): string => {
    const idx = headers.findIndex((h) => {
      const n = normalizeHeader(h)
      const mapped = HEADER_MAP[n] ?? n.replace(/\s/g, '_')
      return mapped === key
    })
    if (idx >= 0 && values[idx] !== undefined) return String(values[idx]).trim()
    return ''
  }

  const name = get('name')
  if (!name) return null

  const typeRaw = (get('type') || 'bank').toLowerCase()
  const type =
    typeRaw === 'cash' || typeRaw === 'kasa' || typeRaw === 'nakit'
      ? 'cash'
      : typeRaw === 'credit_card' || typeRaw === 'kredi kartı' || typeRaw === 'kredi karti' || typeRaw === 'kart'
        ? 'credit_card'
        : 'bank'

  const opening_balance = parseOpeningBalance(get('opening_balance'))
  const currency = (get('currency') || 'TRY').toUpperCase().slice(0, 3) || 'TRY'

  const account_number = get('account_number') || null
  const bank_name = get('bank_name') || null
  const card_last_four = get('card_last_four') || null
  const card_holder_name = get('card_holder_name') || null
  const notes = get('notes') || null

  return {
    tenant_id: tenantId,
    name,
    type,
    currency,
    opening_balance,
    current_balance: opening_balance,
    is_active: true,
    account_number: type === 'bank' ? account_number : null,
    bank_name: type === 'bank' ? bank_name : type === 'credit_card' ? bank_name : null,
    card_last_four: type === 'credit_card' ? card_last_four : null,
    card_holder_name: type === 'credit_card' ? card_holder_name : null,
    notes,
  }
}

const TEMPLATE_HEADERS_TR = ['Hesap Adı', 'Tip', 'Para Birimi', 'Açılış Bakiyesi', 'Hesap Numarası', 'Banka Adı', 'Kart Son Dört', 'Kart Sahibi', 'Notlar']
const TEMPLATE_HEADERS_EN = ['Name', 'Type', 'Currency', 'Opening Balance', 'Account Number', 'Bank Name', 'Card Last Four', 'Card Holder', 'Notes']

const TEMPLATE_DATA_TR: string[][] = [
  ['Kasa TRY', 'kasa', 'TRY', '10000', '', '', '', '', 'Ana kasa'],
  ['ENPARA Şirketim USD', 'banka', 'USD', '1000', 'TR33 0006 1005 1978 6457 8413 26', 'ENPARA BANK A.Ş.', '', '', ''],
  ['Kredi Kartı Kurumsal', 'kredi kartı', 'TRY', '0', '', 'Garanti', '4242', 'Şirket Adı', ''],
]

const TEMPLATE_DATA_EN: string[][] = [
  ['Cash TRY', 'cash', 'TRY', '10000', '', '', '', '', 'Main cash'],
  ['Company USD Account', 'bank', 'USD', '1000', 'TR33 0006 1005 1978 6457 8413 26', 'Example Bank', '', '', ''],
  ['Corporate Credit Card', 'credit_card', 'TRY', '0', '', 'Bank Name', '4242', 'Company Name', ''],
]

function getTemplateCsv(lang: 'tr' | 'en'): string {
  const headers = lang === 'tr' ? TEMPLATE_HEADERS_TR : TEMPLATE_HEADERS_EN
  const data = lang === 'tr' ? TEMPLATE_DATA_TR : TEMPLATE_DATA_EN
  const headerLine = headers.join(',')
  const rowLines = data.map((row) => row.map((cell) => (cell.includes(',') ? `"${cell}"` : cell)).join(','))
  return [headerLine, ...rowLines].join('\n')
}

export type AccountImportReport = {
  successCount: number
  successDetails: { row: number; name: string; balance: number }[]
  failedCount: number
  failedDetails: { row: number; name: string; reason: string }[]
}

interface AccountCsvImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AccountCsvImportDialog({ isOpen, onClose, onSuccess }: AccountCsvImportDialogProps) {
  const { tenantId } = useTenant()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][]; count: number } | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importReport, setImportReport] = useState<AccountImportReport | null>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isTr = language === 'tr'

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
            setParseError(isTr ? 'CSV başlıkları bulunamadı.' : 'No CSV headers found.')
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

      const failedDetails: { row: number; name: string; reason: string }[] = []
      const toInsert: { rowIndex: number; name: string; data: Record<string, unknown> }[] = []

      for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 2
        const account = mapRowToAccount(headers, rows[i], tenantId)
        if (!account) {
          failedDetails.push({
            row: rowNum,
            name: rows[i][0] || '',
            reason: isTr ? 'Hesap adı gerekli' : 'Account name is required',
          })
          continue
        }
        toInsert.push({
          rowIndex: rowNum,
          name: String(account.name),
          data: account,
        })
      }

      if (toInsert.length === 0) {
        const report: AccountImportReport = {
          successCount: 0,
          successDetails: [],
          failedCount: failedDetails.length,
          failedDetails,
        }
        setImportReport(report)
        setShowReportDialog(true)
        setLoading(false)
        return
      }

      const BATCH = 50
      for (let i = 0; i < toInsert.length; i += BATCH) {
        const chunk = toInsert.slice(i, i + BATCH)
        const batch = chunk.map((x) => x.data)
        const { error } = await supabase.from('accounts').insert(batch)
        if (error) throw error
      }

      const successDetails = toInsert.map((x) => ({
        row: x.rowIndex,
        name: x.name,
        balance: (x.data.opening_balance as number) ?? 0,
      }))

      const report: AccountImportReport = {
        successCount: successDetails.length,
        successDetails,
        failedCount: failedDetails.length,
        failedDetails,
      }
      setImportReport(report)
      setShowReportDialog(true)
      onSuccess()
      if (successDetails.length > 0) {
        toast.success(
          isTr
            ? `${successDetails.length} hesap içe aktarıldı`
            : `${successDetails.length} account(s) imported`
        )
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || (isTr ? 'İçe aktarma sırasında hata oluştu.' : 'An error occurred during import.'))
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const lang = isTr ? 'tr' : 'en'
    if (format === 'xlsx') {
      const headers = lang === 'tr' ? TEMPLATE_HEADERS_TR : TEMPLATE_HEADERS_EN
      const data = lang === 'tr' ? TEMPLATE_DATA_TR : TEMPLATE_DATA_EN
      const colCount = headers.length
      const aoa: string[][] = [headers]
      data.forEach((row) => {
        const r = row.length >= colCount ? row.slice(0, colCount) : [...row]
        while (r.length < colCount) r.push('')
        aoa.push(r)
      })
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, isTr ? 'Hesaplar' : 'Accounts')
      XLSX.writeFile(wb, isTr ? 'hesap_import_sablonu.xlsx' : 'account_import_template.xlsx')
    } else {
      const csv = getTemplateCsv(lang)
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = isTr ? 'hesap_import_sablonu.csv' : 'account_import_template.csv'
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
    const colName = isTr ? 'Hesap' : 'Account'
    const colBalance = isTr ? 'Bakiye' : 'Balance'
    const colReason = isTr ? 'Neden' : 'Reason'
    const headers = `${colResult},${colRow},${colName},${colBalance},${colReason}\n`
    const successLabel = isTr ? 'Başarılı' : 'Success'
    const failedLabel = isTr ? 'Başarısız' : 'Failed'
    const successLines = importReport.successDetails
      .map(
        (s) =>
          `${successLabel},${s.row},${s.name},${s.balance.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })},`
      )
      .join('\n')
    const failedLines = importReport.failedDetails
      .map((f) => `${failedLabel},${f.row},${f.name},,${f.reason}`)
      .join('\n')
    const summary = isTr
      ? `İçe Aktarma Raporu\nToplam başarılı: ${importReport.successCount}\nToplam başarısız: ${importReport.failedCount}\n\n`
      : `Import Report\nTotal success: ${importReport.successCount}\nTotal failed: ${importReport.failedCount}\n\n`
    const csv = '\uFEFF' + summary + headers + successLines + (successLines ? '\n' : '') + failedLines
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download =
      (isTr ? 'hesap_import_raporu_' : 'account_import_report_') + new Date().toISOString().slice(0, 10) + '.csv'
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
                    importReport.successDetails.map((s, i) => (
                      <li key={i}>
                        {isTr ? `Satır ${s.row}:` : `Row ${s.row}:`} {s.name}
                        <span className="text-green-600 ml-1">
                          — {isTr ? 'Bakiye:' : 'Balance:'}{' '}
                          {s.balance.toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </li>
                    ))
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
                          {isTr ? `Satır ${f.row}:` : `Row ${f.row}:`} {f.name}
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
                  ? 'CSV veya Excel dosyasında ilk satır sütun başlıkları olmalıdır. Şablonu indirip doldurup yükleyebilirsiniz.'
                  : 'The first row must be column headers. Download the template, fill it in, and upload.'}
                <span className="mt-2 block text-xs text-muted-foreground">
                  {isTr
                    ? 'Tip: kasa, banka, kredi kartı. Para birimi: TRY, USD, EUR vb.'
                    : 'Type: cash, bank, credit_card. Currency: TRY, USD, EUR, etc.'}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isTr ? 'Excel Şablonu' : 'Excel Template'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDownloadTemplate('csv')}
                  className="flex items-center gap-2"
                >
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
                  {file ? file.name : (isTr ? 'Dosya Seç' : 'Choose File')}
                </Button>
              </div>
              {parseError && <p className="text-sm text-red-600">{parseError}</p>}
              {preview && (
                <div className="rounded border bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-slate-700">
                    {preview.count} {isTr ? 'satır bulundu. Önizleme (ilk 5):' : 'row(s) found. Preview (first 5):'}
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
