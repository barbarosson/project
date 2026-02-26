'use client'

import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TurkishProvinceSelect } from '@/components/turkish-province-select'
import { TurkishBankSelect } from '@/components/turkish-bank-select'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { CURRENCY_LIST, getCurrencyLabel } from '@/lib/currencies'
import {
  validateTaxNumber,
  validateVKN,
  validateTCKN,
  validateTurkishIBAN,
  formatIBAN
} from '@/lib/turkish-validations'
import { createOpeningBalanceInvoice as createOpeningBalanceInvoiceLib } from '@/lib/customer-opening-balance'
import {
  getDistrictsByProvince,
  hasDistrictData
} from '@/lib/turkish-districts'
import {
  TURKISH_INDUSTRIES,
  getIndustryOptions
} from '@/lib/turkish-industries'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AddCustomerDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  /** Üst cari ID (alt şube eklerken) */
  initialParentCustomerId?: string | null
  /** Üst cari verisi (Şube/Alt Cariler sheet'inden gelirse; form anında bu veriyle dolar) */
  initialParentData?: Record<string, unknown> | null
}

export function AddCustomerDialog({ isOpen, onClose, onSuccess, initialParentCustomerId, initialParentData }: AddCustomerDialogProps) {
  const { tenantId } = useTenant()
  const { t, language } = useLanguage()
  const { currency: companyCurrency } = useCurrency()
  /** Sheet'ten alt cari eklerken ana cari bilgileri salt okunur */
  const isSubFromSheet = !!initialParentCustomerId
  const [loading, setLoading] = useState(false)
  const [showBalanceConfirm, setShowBalanceConfirm] = useState(false)
  const [balanceDifference, setBalanceDifference] = useState(0)

  const [formData, setFormData] = useState({
    company_title: '',
    name: '',
    account_type: 'customer',
    tax_office: '',
    tax_number: '',
    tax_id_type: '' as 'VKN' | 'TCKN' | '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    postal_code: '',
    country: 'Türkiye',
    currency: 'TRY',
    payment_terms: 0,
    payment_terms_unit: 'days' as 'days' | 'months',
    payment_terms_type: 'net',
    bank_name: '',
    bank_account_holder: '',
    bank_account_number: '',
    bank_iban: '',
    bank_branch: '',
    bank_swift: '',
    website: '',
    industry: '',
    industry_custom: '',
    notes: '',
    e_invoice_enabled: false,
    status: 'active',
    opening_balance: 0,
    parent_customer_id: null as string | null,
    branch_type: 'main' as 'main' | 'branch' | 'warehouse' | 'department' | 'center',
    branch_code: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([])
  const [showCustomIndustry, setShowCustomIndustry] = useState(false)
  const [showCustomDistrict, setShowCustomDistrict] = useState(false)
  const [availableParentCustomers, setAvailableParentCustomers] = useState<any[]>([])
  const [showMergeConfirm, setShowMergeConfirm] = useState(false)
  const [mergeTargetCustomer, setMergeTargetCustomer] = useState<any | null>(null)

  useEffect(() => {
    if (isOpen && companyCurrency) {
      setFormData(prev => ({ ...prev, currency: companyCurrency }))
    }
  }, [isOpen, companyCurrency])

  // Alt şube eklerken üst carinin bilgilerini forma doldur (veri sheet'ten gelirse anında, yoksa fetch)
  const applyParentToForm = (parent: Record<string, unknown>, parentId: string) => {
    const paymentTermsDays = Number(parent.payment_terms) || 0
    const asMonths = paymentTermsDays % 30 === 0 && paymentTermsDays > 0
    setFormData(prev => ({
      ...prev,
      parent_customer_id: parentId,
      branch_type: 'branch',
      company_title: (parent.company_title as string) ?? prev.company_title,
      name: (parent.name as string) ?? prev.name,
      account_type: (parent.account_type as string) ?? prev.account_type,
      tax_office: (parent.tax_office as string) ?? '',
      tax_number: (parent.tax_number as string) ?? '',
      tax_id_type: (parent.tax_id_type as 'VKN' | 'TCKN') || prev.tax_id_type,
      email: (parent.email as string) ?? '',
      phone: (parent.phone as string) ?? '',
      address: (parent.address as string) ?? '',
      city: (parent.city as string) ?? '',
      district: (parent.district as string) ?? '',
      postal_code: (parent.postal_code as string) ?? '',
      country: (parent.country as string) ?? 'Türkiye',
      currency: (parent.currency as string) ?? companyCurrency ?? 'TRY',
      payment_terms: asMonths ? paymentTermsDays / 30 : paymentTermsDays,
      payment_terms_unit: asMonths ? 'months' : 'days',
      payment_terms_type: (parent.payment_terms_type as string) ?? 'net',
      bank_name: (parent.bank_name as string) ?? '',
      bank_account_holder: (parent.bank_account_holder as string) ?? '',
      bank_account_number: (parent.bank_account_number as string) ?? '',
      bank_iban: (parent.bank_iban as string) ?? '',
      bank_branch: (parent.bank_branch as string) ?? '',
      bank_swift: (parent.bank_swift as string) ?? '',
      website: (parent.website as string) ?? '',
      industry: (parent.industry as string) ?? '',
      industry_custom: '',
      notes: (parent.notes as string) ?? '',
      e_invoice_enabled: Boolean(parent.e_invoice_enabled),
      status: (parent.status as string) ?? 'active',
      opening_balance: 0,
      branch_code: '',
    }))
  }

  useEffect(() => {
    if (!isOpen || !initialParentCustomerId) return
    if (initialParentData && Object.keys(initialParentData).length > 0) {
      applyParentToForm(initialParentData, initialParentCustomerId)
      return
    }
    if (!tenantId) return
    let cancelled = false
    ;(async () => {
      try {
        const { data: parent, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', initialParentCustomerId)
          .eq('tenant_id', tenantId)
          .single()
        if (error || !parent || cancelled) return
        applyParentToForm(parent as Record<string, unknown>, initialParentCustomerId)
      } catch (e) {
        console.error('Üst cari bilgileri yüklenemedi:', e)
      }
    })()
    return () => { cancelled = true }
  }, [isOpen, initialParentCustomerId, initialParentData, tenantId, companyCurrency])

  useEffect(() => {
    if (formData.city && hasDistrictData(formData.city)) {
      const districts = getDistrictsByProvince(formData.city)
      setAvailableDistricts(districts)
    } else {
      setAvailableDistricts([])
    }
  }, [formData.city])

  // Cari tipi (tüzel/gerçek kişi) kullanıcı seçimine göre belirlenir; vergi no ile otomatik değiştirilmez

  useEffect(() => {
    if (isOpen && tenantId) {
      fetchParentCustomers()
    }
  }, [isOpen, tenantId])

  const fetchParentCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_title, branch_type')
        .eq('tenant_id', tenantId)
        .order('company_title')

      if (error) throw error
      setAvailableParentCustomers(data || [])
    } catch (error) {
      console.error('Error fetching parent customers:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.tax_id_type) {
      newErrors.tax_id_type = language === 'tr' ? 'Cari tipi seçin (Tüzel veya gerçek kişi)' : 'Please select account type (legal entity or natural person)'
    }

    if (!formData.company_title.trim()) {
      newErrors.company_title = t.validation.companyTitleRequired
    }

    if (!formData.name.trim()) {
      newErrors.name = t.validation.contactNameRequired
    }

    const taxNum = formData.tax_number.trim()
    if (!taxNum) {
      newErrors.tax_number = language === 'tr' ? 'Vergi/Kimlik numarası gereklidir' : 'Tax/ID number is required'
    } else if (formData.tax_id_type === 'VKN') {
      if (taxNum.replace(/\D/g, '').length !== 10) {
        newErrors.tax_number = language === 'tr' ? 'Tüzel kişi için VKN 10 haneli olmalıdır' : 'VKN must be 10 digits for legal entity'
      } else if (!validateVKN(taxNum.replace(/\D/g, ''))) {
        newErrors.tax_number = language === 'tr' ? 'Geçersiz VKN. Lütfen kontrol edin.' : 'Invalid VKN. Please check.'
      }
    } else if (formData.tax_id_type === 'TCKN') {
      if (taxNum.replace(/\D/g, '').length !== 11) {
        newErrors.tax_number = language === 'tr' ? 'Gerçek kişi için TCKN 11 haneli olmalıdır' : 'TCKN must be 11 digits for natural person'
      } else if (!validateTCKN(taxNum.replace(/\D/g, ''))) {
        newErrors.tax_number = language === 'tr' ? 'Geçersiz TCKN. Lütfen kontrol edin.' : 'Invalid TCKN. Please check.'
      }
    } else if (!validateTaxNumber(formData.tax_number)) {
      newErrors.tax_number = language === 'tr' ? 'Geçersiz VKN veya TCKN. Lütfen kontrol edin.' : 'Invalid VKN or TCKN. Please check.'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.validation.invalidEmailFormat
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = t.validation.invalidPhoneFormat
    }

    if (formData.bank_iban && !validateTurkishIBAN(formData.bank_iban)) {
      newErrors.bank_iban = 'Geçersiz IBAN. Türk IBAN TR ile başlamalı ve 26 karakter olmalıdır.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkDuplicateVKN = async (): Promise<{exists: boolean, customer?: any}> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('tax_number', formData.tax_number)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) throw error
    return { exists: !!data, customer: data }
  }

  const FIELD_LABELS: Record<string, string> = {
    company_title: 'Şirket Ünvanı',
    name: 'Yetkili / İsim',
    account_type: 'Hesap Tipi',
    tax_office: 'Vergi Dairesi',
    tax_number: 'Vergi No',
    email: 'E-posta',
    phone: 'Telefon',
    address: 'Adres',
    city: 'İl',
    district: 'İlçe',
    postal_code: 'Posta Kodu',
    country: 'Ülke',
    payment_terms: 'Ödeme Vadesi (gün)',
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

  const getMergeChanges = () => {
    if (!mergeTargetCustomer) return []
    const payment_terms_days = formData.payment_terms_unit === 'months'
      ? formData.payment_terms * 30
      : formData.payment_terms
    const newIndustry = showCustomIndustry ? formData.industry_custom : formData.industry
    const newIban = formData.bank_iban ? formatIBAN(formData.bank_iban) : null
    const changes: { field: string; label: string; oldVal: string; newVal: string }[] = []
    const pairs: [string, string | number | boolean | null][] = [
      ['company_title', formData.company_title],
      ['name', formData.name],
      ['account_type', 'both'],
      ['tax_office', formData.tax_office],
      ['email', formData.email],
      ['phone', formData.phone],
      ['address', formData.address],
      ['city', formData.city],
      ['district', formData.district],
      ['postal_code', formData.postal_code],
      ['country', formData.country],
      ['payment_terms', payment_terms_days],
      ['payment_terms_type', formData.payment_terms_type],
      ['bank_name', formData.bank_name],
      ['bank_account_holder', formData.bank_account_holder],
      ['bank_account_number', formData.bank_account_number],
      ['bank_iban', newIban],
      ['bank_branch', formData.bank_branch],
      ['bank_swift', formData.bank_swift],
      ['website', formData.website],
      ['industry', newIndustry],
      ['notes', formData.notes],
      ['e_invoice_enabled', formData.e_invoice_enabled],
      ['status', formData.status],
    ]
    for (const [key, newVal] of pairs) {
      const oldVal = mergeTargetCustomer[key]
      const os = oldVal === null || oldVal === undefined ? '' : String(oldVal)
      const ns = newVal === null || newVal === undefined ? '' : String(newVal)
      if (os !== ns) {
        changes.push({ field: key, label: FIELD_LABELS[key] || key, oldVal: os || '—', newVal: ns || '—' })
      }
    }
    return changes
  }

  const handleMergeConfirm = async () => {
    if (!mergeTargetCustomer || !tenantId) return
    setLoading(true)
    try {
      const payment_terms_days = formData.payment_terms_unit === 'months'
        ? formData.payment_terms * 30
        : formData.payment_terms
      const updateData: Record<string, unknown> = {
        company_title: formData.company_title,
        name: formData.name,
        account_type: 'both',
        tax_office: formData.tax_office || null,
        tax_number: formData.tax_number || null,
        tax_id_type: formData.tax_id_type || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        district: formData.district || null,
        postal_code: formData.postal_code || null,
        country: formData.country || null,
        payment_terms: payment_terms_days,
        payment_terms_type: formData.payment_terms_type || null,
        bank_name: formData.bank_name || null,
        bank_account_holder: formData.bank_account_holder || null,
        bank_account_number: formData.bank_account_number || null,
        bank_iban: formData.bank_iban ? formatIBAN(formData.bank_iban) : null,
        bank_branch: formData.bank_branch || null,
        bank_swift: formData.bank_swift || null,
        website: formData.website || null,
        industry: showCustomIndustry ? formData.industry_custom : formData.industry || null,
        notes: formData.notes || null,
        e_invoice_enabled: formData.e_invoice_enabled,
        status: formData.status,
      }
      const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', mergeTargetCustomer.id)
        .eq('tenant_id', tenantId)
      if (error) throw error
      toast.success('Cari "Her İkisi" yapıldı ve bilgiler güncellendi.')
      setShowMergeConfirm(false)
      setMergeTargetCustomer(null)
      onSuccess()
      handleClose()
    } catch (err: any) {
      toast.error(err.message || 'Güncelleme yapılamadı')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData?.user?.id) {
        throw new Error(t.inventory.authRequired)
      }

      const tenant_id = userData.user.id

      // Alt cari/şube eklerken VKN kontrolü yapma (aynı VKN ana cari ile paylaşılır)
      const isSubCustomer = Boolean(formData.parent_customer_id)
      if (!isSubCustomer && formData.tax_number && formData.tax_number.trim()) {
        const duplicateCheck = await checkDuplicateVKN()

        if (duplicateCheck.exists && duplicateCheck.customer) {
        const existing = duplicateCheck.customer

        if (existing.account_type === formData.account_type) {
          setLoading(false)
          throw new Error(`Bu VKN ile aynı hesap tipinde kayıt zaten var: ${existing.company_title || existing.name}`)
        }

        // Farklı hesap tipi: kullanıcıdan onay alıp güncelleyeceğiz
        setMergeTargetCustomer(existing)
        setShowMergeConfirm(true)
        setLoading(false)
        return
        }
      }

      const payment_terms_days = formData.payment_terms_unit === 'months'
        ? formData.payment_terms * 30
        : formData.payment_terms

      const customerData = {
        ...formData,
        tenant_id,
        payment_terms: payment_terms_days,
        industry: showCustomIndustry ? formData.industry_custom : formData.industry,
        bank_iban: formData.bank_iban ? formatIBAN(formData.bank_iban) : null,
        tax_id_type: formData.tax_id_type || null
      }

      delete (customerData as any).payment_terms_unit
      delete (customerData as any).industry_custom
      delete (customerData as any).opening_balance

      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()

      if (error) throw error

      if (formData.opening_balance !== 0 && data && data[0] && tenantId) {
        const res = await createOpeningBalanceInvoiceLib(tenantId, data[0].id, formData.opening_balance, language)
        if (res.ok) {
          const msg = formData.opening_balance < 0
            ? (language === 'tr' ? 'Açılış bakiyesi için devir iade faturası oluşturuldu.' : 'Opening balance refund invoice created.')
            : (language === 'tr' ? 'Açılış bakiyesi için devir faturası oluşturuldu.' : 'Opening balance invoice created.')
          toast.success(msg)
        } else toast.error(res.error || (language === 'tr' ? 'Devir faturası oluşturulamadı' : 'Failed to create opening balance invoice'))
      }

      toast.success(t.toast.customerAdded)
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Error adding customer:', error)
      toast.error(error.message || t.toast.customerError)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      company_title: '',
      name: '',
      account_type: 'customer',
      tax_office: '',
      tax_number: '',
      tax_id_type: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      district: '',
      postal_code: '',
      country: 'Türkiye',
      currency: companyCurrency || 'TRY',
      payment_terms: 0,
      payment_terms_unit: 'days',
      payment_terms_type: 'net',
      bank_name: '',
      bank_account_holder: '',
      bank_account_number: '',
      bank_iban: '',
      bank_branch: '',
      bank_swift: '',
      website: '',
      industry: '',
      industry_custom: '',
      notes: '',
      e_invoice_enabled: false,
      status: 'active',
      opening_balance: 0,
      parent_customer_id: null,
      branch_type: 'main',
      branch_code: ''
    })
    setErrors({})
    setShowCustomIndustry(false)
    onClose()
  }

  const industryOptions = getIndustryOptions(language)

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t.customers.addCustomer}</DialogTitle>
          <DialogDescription>
            {t.customers.customerDetails}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <Tabs defaultValue="basic" className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <TabsList className="grid w-full grid-cols-4 shrink-0">
              <TabsTrigger value="basic">{t.customers.basicInfo}</TabsTrigger>
              <TabsTrigger value="address">{t.customers.address}</TabsTrigger>
              <TabsTrigger value="payment">{t.common.payment}</TabsTrigger>
              <TabsTrigger value="bank">{t.customers.bankInfo}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-2">
              <Label htmlFor="customer_type">{t.customers.customerType} <span className="text-red-500">*</span></Label>
              <Select
                value={formData.tax_id_type || ''}
                onValueChange={(value: 'VKN' | 'TCKN') => setFormData({ ...formData, tax_id_type: value })}
                disabled={isSubFromSheet}
              >
                <SelectTrigger id="customer_type" data-field="add-customer-type">
                  <SelectValue placeholder={language === 'tr' ? 'Tüzel veya gerçek kişi seçin' : 'Select legal entity or natural person'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VKN">{t.customers.legalEntity}</SelectItem>
                  <SelectItem value="TCKN">{t.customers.naturalPerson}</SelectItem>
                </SelectContent>
              </Select>
              {errors.tax_id_type && (
                <p className="text-xs text-red-500">{errors.tax_id_type}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_title">
                  {t.customers.companyTitle} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company_title"
                  value={formData.company_title}
                  onChange={(e) => setFormData({ ...formData, company_title: e.target.value })}
                  placeholder={t.placeholders.acmeCorporation}
                  className={errors.company_title ? 'border-red-500' : ''}
                  readOnly={isSubFromSheet}
                />
                {errors.company_title && (
                  <p className="text-xs text-red-500">{errors.company_title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  {t.customers.contactName} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t.placeholders.johnDoe}
                  className={errors.name ? 'border-red-500' : ''}
                  readOnly={isSubFromSheet}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_type">{t.customers.accountType}</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                disabled={isSubFromSheet}
              >
                <SelectTrigger id="account_type" data-field="add-customer-account-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">{t.customers.typeCustomer}</SelectItem>
                  <SelectItem value="vendor">{t.customers.typeVendor}</SelectItem>
                  <SelectItem value="both">{t.customers.typeBoth}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_office">{t.customers.taxOffice}</Label>
                <Input
                  id="tax_office"
                  value={formData.tax_office}
                  onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
                  placeholder={t.placeholders.kadikoyTaxOffice}
                  readOnly={isSubFromSheet}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_number">
                  {t.customers.taxNumber} (VKN/TCKN) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tax_number"
                  value={formData.tax_number}
                  onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                  placeholder="1234567890 veya 12345678901"
                  maxLength={11}
                  className={errors.tax_number ? 'border-red-500' : ''}
                  readOnly={isSubFromSheet}
                />
                {errors.tax_number && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.tax_number}
                  </p>
                )}
                {formData.tax_id_type && !errors.tax_number && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Geçerli {formData.tax_id_type}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.customers.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t.placeholders.contactEmail}
                  className={errors.email ? 'border-red-500' : ''}
                  readOnly={isSubFromSheet}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t.customers.phone}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t.placeholders.phoneNumber}
                  className={errors.phone ? 'border-red-500' : ''}
                  readOnly={isSubFromSheet}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">{t.customers.website}</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder={t.placeholders.websiteUrl}
                  readOnly={isSubFromSheet}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">
                  {t.customers.industry}
                  {!isSubFromSheet && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-6 px-2 text-xs"
                      onClick={() => setShowCustomIndustry(!showCustomIndustry)}
                    >
                      {showCustomIndustry ? 'Listeden Seç' : 'Manuel Giriş'}
                    </Button>
                  )}
                </Label>
                {showCustomIndustry ? (
                  <Input
                    id="industry_custom"
                    value={formData.industry_custom}
                    onChange={(e) => setFormData({ ...formData, industry_custom: e.target.value })}
                    placeholder="Sektör adını yazın"
                    readOnly={isSubFromSheet}
                  />
                ) : (
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData({ ...formData, industry: value })}
                    disabled={isSubFromSheet}
                  >
                    <SelectTrigger id="industry" data-field="add-customer-industry">
                      <SelectValue placeholder="Sektör seçin" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {industryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Label className="font-semibold text-blue-900">Şube/Alt Cari Yapısı</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch_type">Cari Tipi</Label>
                  <Select
                    value={formData.branch_type}
                    onValueChange={(value: any) => setFormData({ ...formData, branch_type: value })}
                  >
                    <SelectTrigger id="branch_type" data-field="add-customer-branch-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Ana Cari (Merkez)</SelectItem>
                      <SelectItem value="branch">Şube</SelectItem>
                      <SelectItem value="warehouse">Depo</SelectItem>
                      <SelectItem value="department">Departman</SelectItem>
                      <SelectItem value="center">Merkez</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">
                    Bu cari ana cari mi yoksa bir carinin alt birimi mi?
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch_code">Şube/Birim Kodu</Label>
                  <Input
                    id="branch_code"
                    value={formData.branch_code}
                    onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                    placeholder="ŞB-01, DEP-MAR vb."
                  />
                  <p className="text-xs text-gray-600">
                    Şube veya birim için özel kod
                  </p>
                </div>
              </div>

              {formData.branch_type !== 'main' && !initialParentCustomerId && (
                <div className="space-y-2">
                  <Label htmlFor="parent_customer">Bağlı Olduğu Ana Cari</Label>
                  <Select
                    value={formData.parent_customer_id || '__none__'}
                    onValueChange={(value) => setFormData({ ...formData, parent_customer_id: value === '__none__' ? null : value })}
                  >
                    <SelectTrigger id="parent_customer" data-field="add-customer-parent">
                      <SelectValue placeholder="Ana cari seçin..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="__none__">Ana cari yok (bağımsız)</SelectItem>
                      {availableParentCustomers
                        .filter(c => c.branch_type === 'main')
                        .map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.company_title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">
                    Bu şube/birim hangi ana cariye bağlı?
                  </p>
                </div>
              )}
            </div>

          </TabsContent>

          <TabsContent value="address" className="space-y-4 mt-4 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-2">
              <Label htmlFor="address">{t.customers.streetAddress}</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t.placeholders.streetName}
                rows={2}
                readOnly={isSubFromSheet}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t.customers.city}</Label>
                <TurkishProvinceSelect
                  value={formData.city}
                  onValueChange={(value) => setFormData({ ...formData, city: value, district: '' })}
                  disabled={isSubFromSheet}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">
                  {t.customers.district}
                  {availableDistricts.length > 0 && !isSubFromSheet && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-6 px-2 text-xs"
                      onClick={() => {
                        setShowCustomDistrict(!showCustomDistrict)
                        setFormData({ ...formData, district: '' })
                      }}
                    >
                      {showCustomDistrict ? 'Listeden Seç' : 'Manuel Giriş'}
                    </Button>
                  )}
                </Label>
                {availableDistricts.length > 0 && !showCustomDistrict ? (
                  <Select
                    value={formData.district}
                    onValueChange={(value) => setFormData({ ...formData, district: value })}
                    disabled={isSubFromSheet}
                  >
                    <SelectTrigger id="district" data-field="add-customer-district">
                      <SelectValue placeholder={t.placeholders.districtName} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {availableDistricts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder={t.placeholders.districtName}
                    readOnly={isSubFromSheet}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">{t.customers.postalCode}</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="34000"
                  readOnly={isSubFromSheet}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">{t.customers.country}</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder={t.placeholders.turkeyCountry}
                  readOnly={isSubFromSheet}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4 mt-4 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-2">
              <Label htmlFor="currency">{language === 'tr' ? 'Para Birimi' : 'Currency'}</Label>
              <Select
                value={formData.currency || 'TRY'}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
                disabled={isSubFromSheet}
              >
                <SelectTrigger id="currency" data-field="add-customer-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_LIST.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {getCurrencyLabel(c, language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms_unit">Vade Tipi</Label>
                <Select
                  value={formData.payment_terms_unit}
                  onValueChange={(value: 'days' | 'months') => setFormData({ ...formData, payment_terms_unit: value })}
                  disabled={isSubFromSheet}
                >
                  <SelectTrigger id="payment_terms_unit" data-field="add-customer-payment-terms-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Gün</SelectItem>
                    <SelectItem value="months">Ay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_terms">Vade Süresi</Label>
                <Input
                  id="payment_terms"
                  type="number"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: parseInt(e.target.value) || 0 })}
                  placeholder="30"
                  readOnly={isSubFromSheet}
                />
                <p className="text-xs text-gray-500">
                  {formData.payment_terms_unit === 'months'
                    ? `${formData.payment_terms} ay = ${formData.payment_terms * 30} gün`
                    : `${formData.payment_terms} gün`
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_terms_type">{t.customers.paymentTermsType}</Label>
                <Select
                  value={formData.payment_terms_type}
                  onValueChange={(value) => setFormData({ ...formData, payment_terms_type: value })}
                  disabled={isSubFromSheet}
                >
                  <SelectTrigger id="payment_terms_type" data-field="add-customer-payment-terms-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net">{t.campaigns.net}</SelectItem>
                    <SelectItem value="eom">{t.campaigns.eom}</SelectItem>
                    <SelectItem value="days">{t.campaigns.daysFromInvoiceDate}</SelectItem>
                    <SelectItem value="immediate">{t.campaigns.immediate}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opening_balance">Açılış Bakiyesi (TL)</Label>
              <Input
                id="opening_balance"
                type="number"
                step="0.01"
                value={formData.opening_balance}
                onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                readOnly={isSubFromSheet}
              />
              <p className="text-xs text-gray-500">
                Pozitif: Alacak (Müşteri borçlu) | Negatif: Borç (Biz borçluyuz)
              </p>
              {formData.opening_balance !== 0 && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Kaydettiğinizde {Math.abs(formData.opening_balance)} TL tutarında devir faturası oluşturulacak.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t.customers.internalNotes}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t.customers.internalNotesPlaceholder}
                rows={4}
                readOnly={isSubFromSheet}
              />
            </div>
          </TabsContent>

          <TabsContent value="bank" className="space-y-4 mt-4 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-2">
              <Label htmlFor="bank_name">{t.settings.bankName}</Label>
              <TurkishBankSelect
                value={formData.bank_name}
                onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                disabled={isSubFromSheet}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account_holder">{t.customers.accountHolderName}</Label>
                <Input
                  id="bank_account_holder"
                  value={formData.bank_account_holder}
                  onChange={(e) => setFormData({ ...formData, bank_account_holder: e.target.value })}
                  placeholder={t.placeholders.companyOrPersonName}
                  readOnly={isSubFromSheet}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_branch">{t.customers.bankBranch}</Label>
                <Input
                  id="bank_branch"
                  value={formData.bank_branch}
                  onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                  placeholder={t.placeholders.branchNameOrCode}
                  readOnly={isSubFromSheet}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_iban">{t.customers.iban}</Label>
              <Input
                id="bank_iban"
                value={formData.bank_iban}
                onChange={(e) => setFormData({ ...formData, bank_iban: e.target.value.toUpperCase() })}
                onBlur={() => {
                  if (formData.bank_iban && validateTurkishIBAN(formData.bank_iban)) {
                    setFormData({ ...formData, bank_iban: formatIBAN(formData.bank_iban) })
                  }
                }}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                maxLength={34}
                className={errors.bank_iban ? 'border-red-500' : ''}
                readOnly={isSubFromSheet}
              />
              {errors.bank_iban && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.bank_iban}
                </p>
              )}
              {formData.bank_iban && validateTurkishIBAN(formData.bank_iban) && !errors.bank_iban && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Geçerli IBAN
                </p>
              )}
              <p className="text-xs text-gray-500">{t.customers.ibanHelp}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account_number">{t.customers.accountNumber}</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  placeholder="0000000000"
                  readOnly={isSubFromSheet}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_swift">{t.customers.swiftBic}</Label>
                <Input
                  id="bank_swift"
                  value={formData.bank_swift}
                  onChange={(e) => setFormData({ ...formData, bank_swift: e.target.value })}
                  placeholder={t.placeholders.swiftExample}
                  readOnly={isSubFromSheet}
                />
              </div>
            </div>
          </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4 shrink-0 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#00D4AA] hover:bg-[#00B894] text-[var(--color-primary)]"
            >
              {loading ? t.common.adding : t.customers.addCustomer}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showMergeConfirm} onOpenChange={setShowMergeConfirm}>
      <AlertDialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>VKN ile eşleşen cari güncellenecek</AlertDialogTitle>
          <AlertDialogDescription>
            Bu VKN ile kayıtlı &quot;{mergeTargetCustomer?.account_type === 'customer' ? 'Müşteri' : 'Tedarikçi'}&quot; tipinde bir cari var.
            Hesap tipi &quot;Her İkisi&quot; yapılıp aşağıdaki alanlar yeni bilgilerle güncellenecek. Onaylıyor musunuz?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 rounded border bg-slate-50 p-3 text-sm">
          <p className="font-medium text-slate-700 mb-2">Değişecek alanlar:</p>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {getMergeChanges().map((c, i) => (
              <li key={i} className="flex flex-wrap gap-x-2 text-slate-600">
                <span className="font-medium text-slate-800">{c.label}:</span>
                <span className="line-through text-red-600">{c.oldVal}</span>
                <span>→</span>
                <span className="text-green-700">{c.newVal}</span>
              </li>
            ))}
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setMergeTargetCustomer(null)}>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={handleMergeConfirm} disabled={loading} className="bg-[#00D4AA] hover:bg-[#00B894]">
            {loading ? 'Güncelleniyor...' : 'Güncelle'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
}
