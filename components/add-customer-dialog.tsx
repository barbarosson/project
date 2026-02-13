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
import {
  validateTaxNumber,
  validateTurkishIBAN,
  formatIBAN,
  getTaxIdType
} from '@/lib/turkish-validations'
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
}

export function AddCustomerDialog({ isOpen, onClose, onSuccess }: AddCustomerDialogProps) {
  const { tenantId } = useTenant()
  const { t, language } = useLanguage()
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

  useEffect(() => {
    if (formData.city && hasDistrictData(formData.city)) {
      const districts = getDistrictsByProvince(formData.city)
      setAvailableDistricts(districts)
    } else {
      setAvailableDistricts([])
    }
  }, [formData.city])

  useEffect(() => {
    if (formData.tax_number) {
      const type = getTaxIdType(formData.tax_number)
      if (type !== 'INVALID') {
        setFormData(prev => ({ ...prev, tax_id_type: type }))
      }
    }
  }, [formData.tax_number])

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

    if (!formData.company_title.trim()) {
      newErrors.company_title = t.validation.companyTitleRequired
    }

    if (!formData.name.trim()) {
      newErrors.name = t.validation.contactNameRequired
    }

    if (!formData.tax_number.trim()) {
      newErrors.tax_number = 'Vergi/Kimlik numarası gereklidir'
    } else if (!validateTaxNumber(formData.tax_number)) {
      newErrors.tax_number = 'Geçersiz VKN veya TCKN. Lütfen kontrol edin.'
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

      const duplicateCheck = await checkDuplicateVKN()

      if (duplicateCheck.exists && duplicateCheck.customer) {
        const existing = duplicateCheck.customer

        if (
          (existing.account_type === 'customer' && formData.account_type === 'vendor') ||
          (existing.account_type === 'vendor' && formData.account_type === 'customer')
        ) {
          const { error: updateError } = await supabase
            .from('customers')
            .update({ account_type: 'both' })
            .eq('id', existing.id)

          if (updateError) throw updateError

          toast.success(`Bu VKN ile kayıtlı cari bulundu. Hesap tipi "Her İkisi" olarak güncellendi.`)
          onSuccess()
          handleClose()
          return
        } else {
          throw new Error(`Bu VKN ile sistemde zaten bir cari kayıtlı: ${existing.company_title}`)
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

      if (formData.opening_balance !== 0 && data && data[0]) {
        await createOpeningBalanceInvoice(data[0].id, formData.opening_balance)
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

  const createOpeningBalanceInvoice = async (customerId: string, balance: number) => {
    try {
      const invoiceData = {
        customer_id: customerId,
        invoice_number: `DEV-${Date.now()}`,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        subtotal: Math.abs(balance),
        total: Math.abs(balance),
        tax_amount: 0,
        status: balance > 0 ? 'paid' : 'unpaid',
        notes: 'Devir Faturası - Açılış bakiyesi',
        tenant_id: tenantId,
        type: balance > 0 ? 'income' : 'expense'
      }

      await supabase.from('invoices').insert([invoiceData])
      toast.success('Açılış bakiyesi için devir faturası oluşturuldu')
    } catch (error) {
      console.error('Error creating opening invoice:', error)
      toast.error('Devir faturası oluşturulamadı')
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.customers.addCustomer}</DialogTitle>
          <DialogDescription>
            {t.customers.customerDetails}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">{t.customers.basicInfo}</TabsTrigger>
              <TabsTrigger value="address">{t.customers.address}</TabsTrigger>
              <TabsTrigger value="payment">{t.common.payment}</TabsTrigger>
              <TabsTrigger value="bank">{t.customers.bankInfo}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
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
              >
                <SelectTrigger id="account_type">
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">
                  {t.customers.industry}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-6 px-2 text-xs"
                    onClick={() => setShowCustomIndustry(!showCustomIndustry)}
                  >
                    {showCustomIndustry ? 'Listeden Seç' : 'Manuel Giriş'}
                  </Button>
                </Label>
                {showCustomIndustry ? (
                  <Input
                    id="industry_custom"
                    value={formData.industry_custom}
                    onChange={(e) => setFormData({ ...formData, industry_custom: e.target.value })}
                    placeholder="Sektör adını yazın"
                  />
                ) : (
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  >
                    <SelectTrigger id="industry">
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
                    <SelectTrigger id="branch_type">
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

              {formData.branch_type !== 'main' && (
                <div className="space-y-2">
                  <Label htmlFor="parent_customer">Bağlı Olduğu Ana Cari</Label>
                  <Select
                    value={formData.parent_customer_id || ''}
                    onValueChange={(value) => setFormData({ ...formData, parent_customer_id: value || null })}
                  >
                    <SelectTrigger id="parent_customer">
                      <SelectValue placeholder="Ana cari seçin..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="">Ana cari yok (bağımsız)</SelectItem>
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

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="e_invoice">{t.customers.eInvoiceIntegration}</Label>
                <p className="text-xs text-gray-500">
                  {t.customers.enableEInvoice}
                </p>
              </div>
              <Switch
                id="e_invoice"
                checked={formData.e_invoice_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, e_invoice_enabled: checked })}
              />
            </div>
          </TabsContent>

          <TabsContent value="address" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="address">{t.customers.streetAddress}</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t.placeholders.streetName}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t.customers.city}</Label>
                <TurkishProvinceSelect
                  value={formData.city}
                  onValueChange={(value) => setFormData({ ...formData, city: value, district: '' })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">
                  {t.customers.district}
                  {availableDistricts.length > 0 && (
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
                  >
                    <SelectTrigger id="district">
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">{t.customers.country}</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder={t.placeholders.turkeyCountry}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms_unit">Vade Tipi</Label>
                <Select
                  value={formData.payment_terms_unit}
                  onValueChange={(value: 'days' | 'months') => setFormData({ ...formData, payment_terms_unit: value })}
                >
                  <SelectTrigger id="payment_terms_unit">
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
                >
                  <SelectTrigger id="payment_terms_type">
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
              />
            </div>
          </TabsContent>

          <TabsContent value="bank" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">{t.settings.bankName}</Label>
              <TurkishBankSelect
                value={formData.bank_name}
                onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_branch">{t.customers.bankBranch}</Label>
                <Input
                  id="bank_branch"
                  value={formData.bank_branch}
                  onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                  placeholder={t.placeholders.branchNameOrCode}
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_swift">{t.customers.swiftBic}</Label>
                <Input
                  id="bank_swift"
                  value={formData.bank_swift}
                  onChange={(e) => setFormData({ ...formData, bank_swift: e.target.value })}
                  placeholder={t.placeholders.swiftExample}
                />
              </div>
            </div>
          </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
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
              className="bg-[#00D4AA] hover:bg-[#00B894]"
            >
              {loading ? t.common.adding : t.customers.addCustomer}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
