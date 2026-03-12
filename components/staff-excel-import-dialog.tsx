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
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, Loader2, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const TEMPLATE_KEYS = [
  'name',
  'last_name',
  'email',
  'phone',
  'national_id',
  'department',
  'position',
  'hire_date',
  'salary',
  'bank_name',
  'bank_iban',
  'bank_account_number',
] as const

const HEADER_ALIASES: Record<string, string> = {
  name: 'name',
  ad: 'name',
  'first name': 'name',
  last_name: 'last_name',
  'last name': 'last_name',
  soyad: 'last_name',
  email: 'email',
  'e-posta': 'email',
  phone: 'phone',
  telefon: 'phone',
  national_id: 'national_id',
  tckn: 'national_id',
  'tc kimlik': 'national_id',
  department: 'department',
  departman: 'department',
  position: 'position',
  pozisyon: 'position',
  hire_date: 'hire_date',
  'hire date': 'hire_date',
  'işe giriş': 'hire_date',
  salary: 'salary',
  maaş: 'salary',
  bank_name: 'bank_name',
  'bank name': 'bank_name',
  banka: 'bank_name',
  bank_iban: 'bank_iban',
  iban: 'bank_iban',
  bank_account_number: 'bank_account_number',
  'account number': 'bank_account_number',
  'hesap no': 'bank_account_number',
}

function cellStr(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'number') return String(val)
  if (typeof val === 'boolean') return val ? '1' : '0'
  if (val instanceof Date) return val.toISOString().slice(0, 10)
  return String(val).trim()
}

function parseExcel(buffer: ArrayBuffer): { headers: string[]; rows: string[][] } {
  const wb = XLSX.read(buffer, { type: 'array' })
  const first = wb.Sheets[wb.SheetNames[0]]
  if (!first) return { headers: [], rows: [] }
  const aoa = XLSX.utils.sheet_to_json(first, { header: 1, defval: '' }) as unknown[][]
  if (aoa.length === 0) return { headers: [], rows: [] }
  const headers = (aoa[0] || []).map(cellStr)
  const colCount = headers.length
  const rows = aoa
    .slice(1)
    .map((row) => {
      const arr = (Array.isArray(row) ? row : []).map(cellStr)
      while (arr.length < colCount) arr.push('')
      return arr.slice(0, colCount)
    })
    .filter((r) => r.some((c) => c !== ''))
  return { headers, rows }
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, ' ').trim()
}

function parseNum(s: string): number {
  const v = String(s || '').replace(/\s/g, '').replace(',', '.')
  const n = parseFloat(v)
  return Number.isNaN(n) ? 0 : n
}

function parseDate(s: string): string | null {
  const v = String(s || '').trim()
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

interface StaffExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StaffExcelImportDialog({ open, onOpenChange, onSuccess }: StaffExcelImportDialogProps) {
  const { tenantId } = useTenant()
  const { t, language } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const isTr = language === 'tr'

  const downloadTemplate = () => {
    const headers = isTr
      ? ['ad', 'soyad', 'e-posta', 'telefon', 'tckn', 'departman', 'pozisyon', 'işe_giriş_tarihi', 'maaş', 'banka_adı', 'iban', 'hesap_no']
      : ['name', 'last_name', 'email', 'phone', 'national_id', 'department', 'position', 'hire_date', 'salary', 'bank_name', 'bank_iban', 'bank_account_number']
    const example = isTr
      ? ['Ahmet', 'Yılmaz', 'ahmet@ornek.com', '5321234567', '12345678901', 'Genel', 'Personel', '2025-01-15', '25000', 'Ziraat Bankası', 'TR00 0000 0000 0000 0000 0000 00', '12345678']
      : ['John', 'Doe', 'john@example.com', '5321234567', '', 'General', 'Staff', '2025-01-15', '25000', '', '', '']
    const ws = XLSX.utils.aoa_to_sheet([headers, example])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, isTr ? 'Personel' : 'Staff')
    XLSX.writeFile(wb, isTr ? 'personel_sablonu.xlsx' : 'staff_template.xlsx')
    toast.success(t.common.downloadTemplate)
  }

  const mapHeaders = (headers: string[]): Record<string, number> => {
    const map: Record<string, number> = {}
    headers.forEach((h, i) => {
      const n = normalizeHeader(h)
      const key = HEADER_ALIASES[n] || HEADER_ALIASES[n.replace(/\s/g, '_')]
      if (key) map[key] = i
    })
    return map
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return
    setUploading(true)
    try {
      const buf = await file.arrayBuffer()
      const { headers, rows } = parseExcel(buf)
      const colMap = mapHeaders(headers)
      if (colMap.name === undefined) {
        toast.error(isTr ? 'Excel\'de "ad" veya "name" sütunu zorunludur.' : 'Excel must have "name" or "ad" column.')
        setUploading(false)
        return
      }

      let created = 0
      const failed: { row: number; reason: string }[] = []

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const name = (row[colMap.name] ?? '').trim()
        if (!name) {
          failed.push({ row: i + 2, reason: isTr ? 'Ad boş' : 'Name empty' })
          continue
        }
        const nationalId = (row[colMap.national_id] ?? '').trim()
        if (nationalId && !/^\d{11}$/.test(nationalId)) {
          failed.push({ row: i + 2, reason: isTr ? 'TCKN 11 haneli olmalı' : 'National ID must be 11 digits' })
          continue
        }

        const hireDate = parseDate(row[colMap.hire_date] ?? '') ?? new Date().toISOString().slice(0, 10)
        const salary = parseNum(row[colMap.salary] ?? '0')
        const department = (row[colMap.department] ?? '').trim() || t.hr.defaultDepartment
        const position = (row[colMap.position] ?? '').trim() || t.hr.defaultPosition

        const { error } = await supabase.from('staff').insert({
          tenant_id: String(tenantId),
          name,
          last_name: (row[colMap.last_name] ?? '').trim() || null,
          email: (row[colMap.email] ?? '').trim() || null,
          phone: (row[colMap.phone] ?? '').trim() || null,
          national_id: nationalId || null,
          department,
          position,
          hire_date: hireDate,
          salary,
          bank_name: (row[colMap.bank_name] ?? '').trim() || null,
          bank_iban: (row[colMap.bank_iban] ?? '').trim() || null,
          bank_account_number: (row[colMap.bank_account_number] ?? '').trim() || null,
          performance_score: 0,
          burnout_risk: 'low',
          churn_risk: 'low',
          status: 'active',
        })

        if (error) {
          failed.push({ row: i + 2, reason: error.message })
        } else {
          created++
        }
      }

      if (created > 0) {
        toast.success(isTr ? `${created} personel eklendi.` : `${created} staff members added.`)
        onSuccess()
        onOpenChange(false)
      }
      if (failed.length > 0) {
        toast.error(isTr ? `${failed.length} satır atlandı veya hata.` : `${failed.length} rows skipped or failed.`)
      }
      if (created === 0 && failed.length === 0) {
        toast.error(isTr ? 'Geçerli veri bulunamadı.' : 'No valid data found.')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isTr ? 'İçe aktarma hatası' : 'Import error'))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#00D4AA]" />
            {t.hr.bulkImport} – Excel
          </DialogTitle>
          <DialogDescription>
            {isTr
              ? 'Şablonu indirip doldurun. En az "ad" (name) sütunu zorunludur. Diğer sütunlar: soyad, e-posta, telefon, tckn, departman, pozisyon, işe giriş tarihi, maaş, banka bilgileri.'
              : 'Download the template and fill it. At least "name" column is required. Other columns: last_name, email, phone, national_id, department, position, hire_date, salary, bank details.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Button
            type="button"
            variant="outline"
            onClick={downloadTemplate}
            disabled={uploading}
            className="border border-input bg-white hover:bg-gray-50 font-semibold text-contrast-body"
          >
            <Download className="h-4 w-4 mr-2" />
            {t.common.downloadTemplate}
          </Button>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="bg-[#00D4AA] hover:bg-[#00B894] font-semibold text-contrast-body"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? (isTr ? 'Yükleniyor...' : 'Uploading...') : t.common.import}
          </Button>
        </div>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  )
}
