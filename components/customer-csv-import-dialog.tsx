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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, Loader2, Download } from 'lucide-react'
import { formatIBAN, getTaxIdType, validateVKN, validateTCKN, validateTurkishIBAN } from '@/lib/turkish-validations'
import { createOpeningBalanceInvoice } from '@/lib/customer-opening-balance'
import * as XLSX from 'xlsx'

const FIELD_LABELS: Record<string, string> = {
  company_title: 'Şirket Ünvanı',
  name: 'Yetkili',
  account_type: 'Hesap Tipi',
  tax_office: 'Vergi Dairesi',
  email: 'E-posta',
  phone: 'Telefon',
  address: 'Adres',
  city: 'İl',
  district: 'İlçe',
  postal_code: 'Posta Kodu',
  country: 'Ülke',
  payment_terms: 'Ödeme Vadesi',
  payment_terms_type: 'Vade Tipi',
  bank_name: 'Banka Adı',
  bank_account_holder: 'Hesap Sahibi',
  bank_account_number: 'Hesap No',
  bank_iban: 'IBAN',
  bank_branch: 'Şube',
  bank_swift: 'SWIFT',
  website: 'Web',
  industry: 'Sektör',
  notes: 'Notlar',
  e_invoice_enabled: 'E-Fatura',
  status: 'Durum',
}

const CSV_HEADERS = [
  'company_title',
  'name',
  'account_type',
  'tax_office',
  'tax_number',
  'email',
  'phone',
  'address',
  'city',
  'district',
  'postal_code',
  'country',
  'payment_terms',
  'payment_terms_type',
  'bank_name',
  'bank_account_holder',
  'bank_account_number',
  'bank_iban',
  'bank_branch',
  'bank_swift',
  'website',
  'industry',
  'notes',
  'e_invoice_enabled',
  'status',
  'opening_balance',
] as const

const CSV_HEADERS_TR: Record<string, string> = {
  'şirket ünvanı': 'company_title',
  'ünvan': 'company_title',
  'company title': 'company_title',
  'company_title': 'company_title',
  'yetkili': 'name',
  'isim': 'name',
  'ad': 'name',
  'name': 'name',
  'hesap tipi': 'account_type',
  'account type': 'account_type',
  'account_type': 'account_type',
  'vergi dairesi': 'tax_office',
  'tax office': 'tax_office',
  'tax_office': 'tax_office',
  'vergi no': 'tax_number',
  'vkn': 'tax_number',
  'tckn': 'tax_number',
  'tax number': 'tax_number',
  'tax_number': 'tax_number',
  'e-posta': 'email',
  'email': 'email',
  'telefon': 'phone',
  'phone': 'phone',
  'adres': 'address',
  'address': 'address',
  'il': 'city',
  'şehir': 'city',
  'city': 'city',
  'ilçe': 'district',
  'district': 'district',
  'posta kodu': 'postal_code',
  'postal code': 'postal_code',
  'postal_code': 'postal_code',
  'ülke': 'country',
  'country': 'country',
  'ödeme vadesi': 'payment_terms',
  'payment terms': 'payment_terms',
  'payment_terms': 'payment_terms',
  'vade tipi': 'payment_terms_type',
  'payment_terms_type': 'payment_terms_type',
  'banka adı': 'bank_name',
  'bank name': 'bank_name',
  'bank_name': 'bank_name',
  'hesap sahibi': 'bank_account_holder',
  'bank account holder': 'bank_account_holder',
  'bank_account_holder': 'bank_account_holder',
  'hesap no': 'bank_account_number',
  'bank account number': 'bank_account_number',
  'bank_account_number': 'bank_account_number',
  'iban': 'bank_iban',
  'bank_iban': 'bank_iban',
  'şube': 'bank_branch',
  'bank branch': 'bank_branch',
  'bank_branch': 'bank_branch',
  'swift': 'bank_swift',
  'bank_swift': 'bank_swift',
  'web': 'website',
  'website': 'website',
  'sektör': 'industry',
  'industry': 'industry',
  'not': 'notes',
  'notlar': 'notes',
  'notes': 'notes',
  'e-fatura': 'e_invoice_enabled',
  'e_invoice_enabled': 'e_invoice_enabled',
  'durum': 'status',
  'status': 'status',
  'açılış bakiyesi': 'opening_balance',
  'acilis bakiyesi': 'opening_balance',
  'açılışbakiyesi': 'opening_balance',
  'acilisbakiyesi': 'opening_balance',
  'açılış bakiyesi ': 'opening_balance',
  'bakiye': 'opening_balance',
  'opening balance': 'opening_balance',
  'opening_balance': 'opening_balance',
  'openingbalance': 'opening_balance',
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
  let rows = lines.slice(1).map((l) => parseCSVLine(l, delimiter)).filter((r) => r.some((c) => c))
  // Bakiye yanlışlıkla sonraki satıra düşmüşse (tek sütunlu satır sayıysa) önceki satıra ekle
  const merged: string[][] = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.length === 1 && headers.length > 1 && /^-?\d+([.,]\d+)?$/.test(String(row[0]).trim().replace(/\s/g, ''))) {
      if (merged.length > 0 && merged[merged.length - 1].length === headers.length - 1)
        merged[merged.length - 1] = [...merged[merged.length - 1], row[0]]
      else
        merged.push(row)
    } else {
      merged.push(row)
    }
  }
  return { headers, rows: merged }
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
  const rows = aoa.slice(1)
    .map((row) => {
      const arr = (Array.isArray(row) ? row : []).map(cellToString)
      // Excel satırları bazen kısa döner; son sütun (bakiye) kaybolmasın diye başlık kadar doldur
      while (arr.length < colCount) arr.push('')
      return arr
    })
    .filter((r) => r.some((c) => c !== ''))
  return { headers, rows }
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, ' ').trim()
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
    normalized = parts.length > 1 && parts[parts.length - 1].length <= 2
      ? numPart.replace(/\./g, '').replace(',', '.')
      : numPart.replace(/,/g, '')
  } else {
    normalized = numPart.replace(/\./g, '')
  }
  const n = parseFloat(normalized)
  if (Number.isNaN(n)) return 0
  return negative ? -n : n
}

function mapRowToCustomer(
  headers: string[],
  values: string[],
  tenantId: string
): Record<string, unknown> | null {
  const get = (key: string): string => {
    const idx = headers.findIndex((h) => {
      const n = normalizeHeader(h)
      return CSV_HEADERS_TR[n] === key || n.replace(/\s/g, '_') === key
    })
    if (idx >= 0 && values[idx] !== undefined) return String(values[idx]).trim()
    return ''
  }

  const company_title = get('company_title')
  const name = get('name')
  if (!company_title && !name) return null

  const accountTypeRaw = (get('account_type') || 'customer').toLowerCase()
  const account_type =
    accountTypeRaw === 'vendor' || accountTypeRaw === 'tedarikçi'
      ? 'vendor'
      : accountTypeRaw === 'both' || accountTypeRaw === 'her ikisi'
        ? 'both'
        : 'customer'

  const eInvoiceRaw = (get('e_invoice_enabled') || '').toLowerCase()
  const e_invoice_enabled =
    eInvoiceRaw === 'true' ||
    eInvoiceRaw === '1' ||
    eInvoiceRaw === 'evet' ||
    eInvoiceRaw === 'yes'

  const statusRaw = (get('status') || 'active').toLowerCase()
  const status = statusRaw === 'inactive' || statusRaw === 'pasif' ? 'inactive' : 'active'

  const paymentTermsStr = get('payment_terms') || '0'
  const payment_terms = Math.max(0, parseInt(paymentTermsStr, 10) || 0)

  let bank_iban = get('bank_iban')
  if (bank_iban) bank_iban = formatIBAN(bank_iban)

  const tax_number = get('tax_number')
  const tax_id_type = tax_number ? getTaxIdType(tax_number) : null

  return {
    tenant_id: tenantId,
    company_title: company_title || name,
    name: name || company_title,
    account_type,
    tax_office: get('tax_office') || null,
    tax_number: tax_number || null,
    tax_id_type: tax_id_type === 'INVALID' ? null : tax_id_type,
    email: get('email') || null,
    phone: get('phone') || null,
    address: get('address') || null,
    city: get('city') || null,
    district: get('district') || null,
    postal_code: get('postal_code') || null,
    country: get('country') || 'Türkiye',
    payment_terms,
    payment_terms_type: (get('payment_terms_type') || 'net').toLowerCase() === 'eom' ? 'eom' : 'net',
    bank_name: get('bank_name') || null,
    bank_account_holder: get('bank_account_holder') || null,
    bank_account_number: get('bank_account_number') || null,
    bank_iban: bank_iban || null,
    bank_branch: get('bank_branch') || null,
    bank_swift: get('bank_swift') || null,
    website: get('website') || null,
    industry: get('industry') || null,
    notes: get('notes') || null,
    e_invoice_enabled,
    status,
    balance: 0,
    opening_balance: (() => {
      const tryParse = (v: string): number => parseOpeningBalance(String(v || '').trim())
      // 1) Önce "Açılış Bakiyesi" / "bakiye" / "opening balance" başlıklı sütunu ara
      const byKey = get('opening_balance')
      if (byKey !== '') {
        const p = tryParse(byKey)
        if (p !== 0) return p
      }
      // 2) Başlık adı "bakiye", "balance", "acilis", "opening", "devir" içeren sütunlar
      const balanceKeywords = ['bakiye', 'balance', 'açılış', 'acilis', 'opening', 'devir']
      for (let i = 0; i < headers.length; i++) {
        const h = normalizeHeader(headers[i] || '')
        const hasKeyword = balanceKeywords.some((k) => h.includes(k))
        if (hasKeyword) {
          const v = values[i] !== undefined && values[i] !== null ? String(values[i]).trim() : ''
          const p = tryParse(v)
          if (p !== 0) return p
        }
      }
      // 3) Şablonda bakiye 26. sütun (index 25) - Excel/CSV şablonu ile uyumlu
      if (values.length >= 26) {
        const p = tryParse(String(values[25] ?? ''))
        if (p !== 0) return p
      }
      // 4) Son sütun - Excel'de bakiye genelde en sonda (Durum'dan sonra)
      if (values.length > 0) {
        const lastVal = String(values[values.length - 1] ?? '').trim()
        const p = tryParse(lastVal)
        if (p !== 0) return p
      }
      // 5) Sondan 5 hücre - "aktif"/"pasif" atlanır, ilk geçerli sayı alınır
      for (let i = values.length - 1; i >= Math.max(0, values.length - 5); i--) {
        const raw = values[i]
        if (raw === undefined || raw === null) continue
        const s = String(raw).trim()
        if (/^-?\d+([.,]\d+)?$/.test(s.replace(/\s/g, ''))) {
          const parsed = tryParse(s)
          return parsed
        }
      }
      return 0
    })(),
  }
}

const TR_HEADERS = 'Şirket Ünvanı,Yetkili,Hesap Tipi,Vergi Dairesi,Vergi No,E-posta,Telefon,Adres,İl,İlçe,Posta Kodu,Ülke,Ödeme Vadesi,Vade Tipi,Banka Adı,Hesap Sahibi,Hesap No,IBAN,Şube,SWIFT,Web,Sektör,Notlar,E-Fatura,Durum,Açılış Bakiyesi'
const EN_HEADERS = CSV_HEADERS.join(',')

const TEMPLATE_ROWS_TR = [
  'Örnek Müşteri A.Ş.,Ahmet Yılmaz,müşteri,Kadıköy VD,1234567890,info@ornek.com,05321234567,Örnek Mah. No:1,Kadıköy,,34000,Türkiye,30,net,Ziraat Bankası,Örnek Şirket,12345678,TR00 0000 0000 0000 0000 0000 00,,,https://ornek.com,Teknoloji,Örnek not,hayır,aktif,5000',
  'Örnek Tedarikçi Ltd.,Mehmet Kaya,tedarikçi,Beşiktaş VD,9876543210,tedarik@ornek.com,05329876543,Sanayi Cad. No:5,İstanbul,,34000,Türkiye,60,net,İş Bankası,Tedarikçi Firma,87654321,TR00 0000 0000 0000 0000 0000 01,,,https://tedarik.com,Üretim,Tedarikçi notu,hayır,aktif,-1500',
  'Örnek Her İkisi A.Ş.,Ayşe Demir,her ikisi,Şişli VD,5555555555,info@herikisi.com,05325555555,Merkez Mah.,İstanbul,,34394,Türkiye,30,net,Yapı Kredi,Her İkisi Firma,11223344,TR00 0000 0000 0000 0000 0000 02,,,,Hem müşteri hem tedarikçi,hayır,aktif,0',
]

const TEMPLATE_ROWS_EN = [
  'Example Customer Inc.,John Doe,customer,Downtown Tax Office,1234567890,info@example.com,+901234567890,123 Main St,Istanbul,,34000,Turkey,30,net,Bank of Example,Example Corp,12345678,TR00 0000 0000 0000 0000 0000 00,,,https://example.com,Technology,Sample note,false,active,5000',
  'Example Vendor Ltd.,Jane Smith,vendor,Industrial Tax Office,9876543210,vendor@example.com,+909876543210,456 Industrial Ave,Istanbul,,34000,Turkey,60,net,Business Bank,Vendor Co,87654321,TR00 0000 0000 0000 0000 0000 01,,,https://vendor.com,Manufacturing,Vendor note,false,active,-1500',
  'Example Both LLC,Alex Brown,both,Central Tax Office,5555555555,info@both.com,+905555555555,789 Center St,Istanbul,,34394,Turkey,30,net,Credit Bank,Both Company,11223344,TR00 0000 0000 0000 0000 0000 02,,,,Customer and vendor,false,active,0',
]

function getTemplateCsv(lang: 'tr' | 'en'): string {
  const headers = lang === 'tr' ? TR_HEADERS : EN_HEADERS
  const rows = lang === 'tr' ? TEMPLATE_ROWS_TR : TEMPLATE_ROWS_EN
  return [headers, ...rows].join('\n')
}

function validateRowForImport(customer: Record<string, unknown>): string | null {
  const tax = customer.tax_number ? String(customer.tax_number).replace(/\D/g, '') : ''
  if (tax.length > 0) {
    if (tax.length === 10 && !validateVKN(tax)) return 'Geçersiz VKN (kontrol rakamı hatalı)'
    if (tax.length === 11 && !validateTCKN(tax)) return 'Geçersiz TCKN (kontrol rakamı hatalı)'
    if (tax.length !== 10 && tax.length !== 11) return 'VKN 10 veya TCKN 11 rakam olmalıdır'
  }
  const iban = customer.bank_iban ? String(customer.bank_iban).replace(/\s/g, '') : ''
  if (iban.length > 0 && !validateTurkishIBAN(iban)) return 'Geçersiz IBAN (TR ile başlamalı, 26 karakter)'
  return null
}

export type ImportReport = {
  successCount: number
  successDetails: { row: number; company: string }[]
  failedCount: number
  failedDetails: { row: number; company: string; reason: string }[]
}

interface CustomerCsvImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CustomerCsvImportDialog({
  isOpen,
  onClose,
  onSuccess,
}: CustomerCsvImportDialogProps) {
  const { tenantId } = useTenant()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][]; count: number } | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [showMergeConfirm, setShowMergeConfirm] = useState(false)
  type PendingImport = {
    toInsert: { rowIndex: number; company: string; data: Record<string, unknown> }[]
    toUpdate: { existing: any; newData: Record<string, unknown>; rowIndex: number; company: string }[]
    skippedSameType: { rowIndex: number; company: string }[]
    initialFailedDetails: { row: number; company: string; reason: string }[]
  }
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [importReport, setImportReport] = useState<ImportReport | null>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setFile(f || null)
    setParseError(null)
    setPreview(null)
    if (!f) return
    const isXlsx = f.name.toLowerCase().endsWith('.xlsx')
    if (!f.name.toLowerCase().endsWith('.csv') && !isXlsx) {
      setParseError('Lütfen .csv veya .xlsx dosyası seçin.')
      return
    }
    if (isXlsx) {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const { headers, rows } = parseExcel(reader.result as ArrayBuffer)
          if (headers.length === 0) {
            setParseError('Excel\'de başlık satırı bulunamadı.')
            return
          }
          setPreview({ headers, rows, count: rows.length })
        } catch (err) {
          setParseError('Excel dosyası okunamadı.')
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
            setParseError('CSV başlıkları bulunamadı.')
            return
          }
          setPreview({ headers, rows, count: rows.length })
        } catch (err) {
          setParseError('Dosya okunamadı.')
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
        : parseCSV(await new Promise<string>((res, rej) => {
            const r = new FileReader()
            r.onload = () => res(String(r.result))
            r.onerror = rej
            r.readAsText(file, 'UTF-8')
          }))
      const failedDetails: { row: number; company: string; reason: string }[] = []
      const validated: { rowIndex: number; company: string; customer: Record<string, unknown> }[] = []

      for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 2
        const customer = mapRowToCustomer(headers, rows[i], tenantId)
        if (!customer) {
          failedDetails.push({ row: rowNum, company: rows[i][0] || '', reason: 'Şirket ünvanı veya yetkili gerekli' })
          continue
        }
        const companyDisplay = String(customer.company_title || customer.name || '')
        const validationError = validateRowForImport(customer)
        if (validationError) {
          failedDetails.push({ row: rowNum, company: companyDisplay, reason: validationError })
          continue
        }
        validated.push({ rowIndex: rowNum, company: companyDisplay, customer })
      }

      if (validated.length === 0) {
        const report: ImportReport = { successCount: 0, successDetails: [], failedCount: failedDetails.length, failedDetails }
        setImportReport(report)
        setShowReportDialog(true)
        setLoading(false)
        return
      }

      const vknList = Array.from(new Set(validated.map((v) => v.customer.tax_number as string).filter(Boolean)))
      let existingByVkn: Map<string, any> = new Map()
      if (vknList.length > 0) {
        const { data: existingRows } = await supabase
          .from('customers')
          .select('*')
          .eq('tenant_id', tenantId)
          .in('tax_number', vknList)
        if (existingRows) {
          existingRows.forEach((r) => existingByVkn.set(String(r.tax_number).trim(), r))
        }
      }

      const toInsert: { rowIndex: number; company: string; data: Record<string, unknown> }[] = []
      const toUpdate: { existing: any; newData: Record<string, unknown>; rowIndex: number; company: string }[] = []
      const skippedSameType: { rowIndex: number; company: string }[] = []

      for (const v of validated) {
        const vkn = v.customer.tax_number ? String(v.customer.tax_number).trim() : null
        if (!vkn) {
          toInsert.push({ rowIndex: v.rowIndex, company: v.company, data: v.customer })
          continue
        }
        const existing = existingByVkn.get(vkn)
        if (!existing) {
          toInsert.push({ rowIndex: v.rowIndex, company: v.company, data: v.customer })
          continue
        }
        if (existing.account_type === v.customer.account_type) {
          skippedSameType.push({ rowIndex: v.rowIndex, company: v.company })
          continue
        }
        toUpdate.push({ existing, newData: v.customer, rowIndex: v.rowIndex, company: v.company })
      }

      const allFailed = [...failedDetails, ...skippedSameType.map((s) => ({ row: s.rowIndex, company: s.company, reason: 'Aynı VKN ve hesap tipinde kayıt zaten var' as const }))]

      if (toUpdate.length > 0) {
        setPendingImport({ toInsert, toUpdate, skippedSameType, initialFailedDetails: failedDetails })
        setShowMergeConfirm(true)
        setLoading(false)
        return
      }

      const BATCH = 50
      const lang = language === 'en' ? 'en' : 'tr'
      for (let i = 0; i < toInsert.length; i += BATCH) {
        const chunk = toInsert.slice(i, i + BATCH)
        const batch = chunk.map((x) => {
          const { opening_balance: _ob, balance: _b, ...rest } = x.data as Record<string, unknown>
          return { ...rest, balance: 0 }
        })
        const { data: inserted, error } = await supabase.from('customers').insert(batch).select('id')
        if (error) throw error
        let balanceInvoiceCount = 0
        for (let j = 0; j < chunk.length && inserted?.[j]; j++) {
          const rawOb = (chunk[j].data as any).opening_balance
          const ob = typeof rawOb === 'number' ? rawOb : (Number(rawOb) || parseOpeningBalance(String(rawOb ?? '')))
          if (ob !== 0) {
            const res = await createOpeningBalanceInvoice(tenantId!, inserted[j].id, ob, lang, false)
            if (res.ok) balanceInvoiceCount++
          }
        }
        if (balanceInvoiceCount > 0) {
          toast.success(language === 'tr' ? `${balanceInvoiceCount} devir faturası oluşturuldu` : `${balanceInvoiceCount} opening balance invoice(s) created`)
        }
      }

      const report: ImportReport = {
        successCount: toInsert.length,
        successDetails: toInsert.map((x) => ({ row: x.rowIndex, company: x.company })),
        failedCount: allFailed.length,
        failedDetails: allFailed,
      }
      setImportReport(report)
      setShowReportDialog(true)
      onSuccess()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'İçe aktarma sırasında hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const getUpdateChanges = (existing: any, newData: Record<string, unknown>) => {
    const changes: { label: string; oldVal: string; newVal: string }[] = []
    const keys = ['company_title', 'name', 'tax_office', 'email', 'phone', 'address', 'city', 'district', 'postal_code', 'country', 'payment_terms', 'payment_terms_type', 'bank_name', 'bank_account_holder', 'bank_account_number', 'bank_iban', 'bank_branch', 'bank_swift', 'website', 'industry', 'notes', 'e_invoice_enabled', 'status'] as const
    for (const key of keys) {
      const ov = existing[key]
      const nv = newData[key]
      const os = ov === null || ov === undefined ? '' : String(ov)
      const ns = nv === null || nv === undefined ? '' : String(nv)
      if (os !== ns) {
        changes.push({ label: FIELD_LABELS[key] || key, oldVal: os || '—', newVal: ns || '—' })
      }
    }
    if (existing.account_type !== 'both') {
      changes.push({ label: 'Hesap Tipi', oldVal: existing.account_type, newVal: 'both' })
    }
    return changes
  }

  const handleMergeConfirmImport = async () => {
    if (!tenantId || !pendingImport) return
    setLoading(true)
    try {
      for (const { existing, newData } of pendingImport.toUpdate) {
        const updatePayload: Record<string, unknown> = {
          company_title: newData.company_title,
          name: newData.name,
          account_type: 'both',
          tax_office: newData.tax_office ?? null,
          tax_number: newData.tax_number ?? null,
          tax_id_type: newData.tax_id_type ?? null,
          email: newData.email ?? null,
          phone: newData.phone ?? null,
          address: newData.address ?? null,
          city: newData.city ?? null,
          district: newData.district ?? null,
          postal_code: newData.postal_code ?? null,
          country: newData.country ?? null,
          payment_terms: newData.payment_terms ?? 0,
          payment_terms_type: newData.payment_terms_type ?? null,
          bank_name: newData.bank_name ?? null,
          bank_account_holder: newData.bank_account_holder ?? null,
          bank_account_number: newData.bank_account_number ?? null,
          bank_iban: newData.bank_iban ?? null,
          bank_branch: newData.bank_branch ?? null,
          bank_swift: newData.bank_swift ?? null,
          website: newData.website ?? null,
          industry: newData.industry ?? null,
          notes: newData.notes ?? null,
          e_invoice_enabled: newData.e_invoice_enabled ?? false,
          status: newData.status ?? 'active',
        }
        const { error } = await supabase
          .from('customers')
          .update(updatePayload)
          .eq('id', existing.id)
          .eq('tenant_id', tenantId)
        if (error) throw error
      }
      const BATCH = 50
      const lang = language === 'en' ? 'en' : 'tr'
      for (let i = 0; i < pendingImport.toInsert.length; i += BATCH) {
        const chunk = pendingImport.toInsert.slice(i, i + BATCH)
        const batch = chunk.map((x) => {
          const { opening_balance: _ob, balance: _b, ...rest } = x.data as Record<string, unknown>
          return { ...rest, balance: 0 }
        })
        const { data: inserted, error } = await supabase.from('customers').insert(batch).select('id')
        if (error) throw error
        let balanceInvoiceCount = 0
        for (let j = 0; j < chunk.length && inserted?.[j]; j++) {
          const rawOb = (chunk[j].data as any).opening_balance
          const ob = typeof rawOb === 'number' ? rawOb : (Number(rawOb) || parseOpeningBalance(String(rawOb ?? '')))
          if (ob !== 0) {
            const res = await createOpeningBalanceInvoice(tenantId!, inserted[j].id, ob, lang, false)
            if (res.ok) balanceInvoiceCount++
          }
        }
        if (balanceInvoiceCount > 0) {
          toast.success(language === 'tr' ? `${balanceInvoiceCount} devir faturası oluşturuldu` : `${balanceInvoiceCount} opening balance invoice(s) created`)
        }
      }
      const successDetails = [
        ...pendingImport.toUpdate.map((x) => ({ row: x.rowIndex, company: x.company })),
        ...pendingImport.toInsert.map((x) => ({ row: x.rowIndex, company: x.company })),
      ]
      const failedDetails = [
        ...pendingImport.initialFailedDetails,
        ...pendingImport.skippedSameType.map((s) => ({ row: s.rowIndex, company: s.company, reason: language === 'tr' ? 'Aynı VKN ve hesap tipinde kayıt zaten var' : 'Record already exists with same VKN and account type' })),
      ]
      const report: ImportReport = {
        successCount: successDetails.length,
        successDetails,
        failedCount: failedDetails.length,
        failedDetails,
      }
      setShowMergeConfirm(false)
      setPendingImport(null)
      setImportReport(report)
      setShowReportDialog(true)
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'İşlem sırasında hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const lang = language === 'en' ? 'en' : 'tr'
    if (format === 'xlsx') {
      const headerLine = lang === 'tr' ? TR_HEADERS : EN_HEADERS
      const rowLines = lang === 'tr' ? TEMPLATE_ROWS_TR : TEMPLATE_ROWS_EN
      const headerArr = parseCSVLine(headerLine, ',')
      const rowArrs = rowLines.map((line) => parseCSVLine(line, ','))
      const aoa = [headerArr, ...rowArrs]
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, lang === 'tr' ? 'Cariler' : 'Customers')
      XLSX.writeFile(wb, lang === 'tr' ? 'cari_import_sablonu.xlsx' : 'customer_import_template.xlsx')
    } else {
      const csv = getTemplateCsv(lang)
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = lang === 'tr' ? 'cari_import_sablonu.csv' : 'customer_import_template.csv'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    setParseError(null)
    setShowMergeConfirm(false)
    setPendingImport(null)
    setImportReport(null)
    setShowReportDialog(false)
    if (inputRef.current) inputRef.current.value = ''
    onClose()
  }

  const downloadReport = () => {
    if (!importReport) return
    const lang = language === 'en' ? 'en' : 'tr'
    const colResult = lang === 'tr' ? 'Sonuç' : 'Result'
    const colRow = lang === 'tr' ? 'Satır' : 'Row'
    const colCompany = lang === 'tr' ? 'Cari / Açıklama' : 'Customer / Description'
    const colReason = lang === 'tr' ? 'Neden' : 'Reason'
    const headers = `${colResult},${colRow},${colCompany},${colReason}\n`
    const successLabel = lang === 'tr' ? 'Başarılı' : 'Success'
    const failedLabel = lang === 'tr' ? 'Başarısız' : 'Failed'
    const successLines = importReport.successDetails.map((s) => `${successLabel},${s.row},${s.company},`).join('\n')
    const failedLines = importReport.failedDetails.map((f) => `${failedLabel},${f.row},${f.company},${f.reason}`).join('\n')
    const summary = lang === 'tr'
      ? `İçe Aktarma Raporu\nToplam başarılı: ${importReport.successCount}\nToplam başarısız: ${importReport.failedCount}\n\n`
      : `Import Report\nTotal success: ${importReport.successCount}\nTotal failed: ${importReport.failedCount}\n\n`
    const csv = '\uFEFF' + summary + headers + successLines + (successLines ? '\n' : '') + failedLines
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = lang === 'tr' ? `cari_import_raporu_${new Date().toISOString().slice(0, 10)}.csv` : `customer_import_report_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={showReportDialog && importReport ? 'sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col' : 'sm:max-w-lg'}>
        {showReportDialog && importReport ? (
          <>
            <DialogHeader>
              <DialogTitle>{language === 'tr' ? 'İçe Aktarma Raporu' : 'Import Report'}</DialogTitle>
              <DialogDescription>
                {language === 'tr'
                  ? `Toplam ${importReport.successCount} başarılı, ${importReport.failedCount} başarısız.`
                  : `Total ${importReport.successCount} success, ${importReport.failedCount} failed.`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 py-2">
              <div className="rounded border bg-green-50 p-3 text-sm">
                <p className="font-semibold text-green-800">
                  {language === 'tr' ? `Başarılı (${importReport.successCount})` : `Success (${importReport.successCount})`}
                </p>
                <ul className="mt-2 max-h-32 overflow-y-auto text-green-700 space-y-1">
                  {importReport.successDetails.length === 0 ? (
                    <li className="text-muted-foreground">—</li>
                  ) : (
                    importReport.successDetails.map((s, i) => (
                      <li key={i}>{language === 'tr' ? `Satır ${s.row}:` : `Row ${s.row}:`} {s.company}</li>
                    ))
                  )}
                </ul>
              </div>
              <div className="rounded border bg-red-50 p-3 text-sm">
                <p className="font-semibold text-red-800">
                  {language === 'tr' ? `Başarısız (${importReport.failedCount})` : `Failed (${importReport.failedCount})`}
                </p>
                <ul className="mt-2 max-h-48 overflow-y-auto text-red-700 space-y-2">
                  {importReport.failedDetails.length === 0 ? (
                    <li className="text-muted-foreground">—</li>
                  ) : (
                    importReport.failedDetails.map((f, i) => (
                      <li key={i}>
                        <span className="font-medium">{language === 'tr' ? `Satır ${f.row}:` : `Row ${f.row}:`} {f.company}</span>
                        <span className="block text-xs text-red-600">{language === 'tr' ? 'Neden:' : 'Reason:'} {f.reason}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={downloadReport} className="gap-2">
                <Download className="h-4 w-4" />
                {language === 'tr' ? 'Raporu İndir' : 'Download Report'}
              </Button>
              <Button type="button" onClick={handleClose}>
                {language === 'tr' ? 'Tamam' : 'OK'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
        <DialogHeader>
          <DialogTitle>CSV ile Cari İçe Aktar</DialogTitle>
          <DialogDescription>
            {language === 'tr'
              ? 'CSV veya Excel dosyasında ilk satır sütun başlıkları olmalıdır. Excel şablonu ile sütunlar ayrı kalır; şablonu indirip doldurup yükleyebilirsiniz.'
              : 'The first row must be column headers. Use the Excel template to keep columns separate; download, fill in, and upload.'}
            <span className="mt-2 block text-xs text-muted-foreground">
              {language === 'tr'
                ? <>Hesap Tipi: <strong>müşteri</strong>, <strong>tedarikçi</strong>, <strong>her ikisi</strong>. Durum: <strong>aktif</strong> / <strong>pasif</strong>. E-Fatura: <strong>evet</strong> / <strong>hayır</strong>.</>
                : <>Account type: <strong>customer</strong>, <strong>vendor</strong>, <strong>both</strong>. Status: <strong>active</strong> / <strong>inactive</strong>. E-Invoice: <strong>true</strong> / <strong>false</strong>.</>}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => handleDownloadTemplate('csv')} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              CSV Şablonu
            </Button>
            <Button type="button" variant="outline" onClick={() => handleDownloadTemplate('xlsx')} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Excel Şablonu
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
              {file ? file.name : 'Dosya Seç'}
            </Button>
          </div>
          {parseError && <p className="text-sm text-red-600">{parseError}</p>}
          {preview && (
            <div className="rounded border bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-700">
                {preview.count} satır bulundu. Önizleme (ilk 5):
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
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!preview || preview.count === 0 || loading}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            İçe Aktar
          </Button>
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>

    <AlertDialog open={showMergeConfirm} onOpenChange={(open) => { setShowMergeConfirm(open); if (!open) setPendingImport(null) }}>
      <AlertDialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Aynı VKN ile farklı tipte kayıtlar güncellenecek</AlertDialogTitle>
          <AlertDialogDescription>
            Aşağıdaki carilerde aynı VKN ile farklı hesap tipi bulundu. Hesap tipi &quot;Her İkisi&quot; yapılıp yeni bilgilerle güncellenecek. Onaylıyor musunuz?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 space-y-4 max-h-96 overflow-y-auto">
          {pendingImport?.toUpdate.map((item, idx) => (
            <div key={idx} className="rounded border bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-800 mb-2">
                {item.existing.company_title || item.existing.name} (VKN: {item.existing.tax_number}) — Mevcut: {item.existing.account_type} → Her İkisi
              </p>
              <ul className="space-y-1 text-slate-600">
                {getUpdateChanges(item.existing, item.newData).map((c, i) => (
                  <li key={i} className="flex flex-wrap gap-x-2">
                    <span className="font-medium">{c.label}:</span>
                    <span className="line-through text-red-600">{c.oldVal}</span>
                    <span>→</span>
                    <span className="text-green-700">{c.newVal}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={handleMergeConfirmImport} disabled={loading} className="bg-[#00D4AA] hover:bg-[#00B894]">
            {loading ? 'İşleniyor...' : 'Güncelle ve içe aktar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
