'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DemoRestrictedButton } from '@/components/demo-restricted-button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building, Upload, Globe, Languages, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { CURRENCY_LIST, getCurrencyLabel } from '@/lib/currencies'
import { toast } from 'sonner'
import { TurkishProvinceSelect } from '@/components/turkish-province-select'
import { TurkishBankSelect } from '@/components/turkish-bank-select'
import { MfaSetup } from '@/components/mfa-setup'

interface CompanySettings {
  id?: string
  company_name: string
  company_title: string
  tax_office: string
  tax_number: string
  address: string
  city: string
  country: string
  postal_code: string
  phone: string
  email: string
  website: string
  iban: string
  bank_name: string
  logo_url: string | null
  currency: string
}

export default function SettingsPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { t, language, setLanguage } = useLanguage()
  const { currency: selectedCurrency, setCurrency: updateCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    company_name: '',
    company_title: '',
    tax_office: '',
    tax_number: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    iban: '',
    bank_name: '',
    logo_url: null,
    currency: 'USD'
  })

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchCompanySettings()
    }
  }, [tenantId, tenantLoading])

  async function fetchCompanySettings() {
    if (!tenantId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setCompanySettings({ ...data, currency: data.currency || 'USD' })
      }
    } catch (error: any) {
      toast.error(error.message || t.common.loading)
    } finally {
      setLoading(false)
    }
  }

  async function handleCurrencyChange(newCurrency: string) {
    try {
      await updateCurrency(newCurrency)
      setCompanySettings({ ...companySettings, currency: newCurrency })
      toast.success(language === 'tr' ? 'Para birimi güncellendi' : 'Currency updated successfully')
    } catch (error: any) {
      toast.error(error.message || (language === 'tr' ? 'Para birimi güncellenemedi' : 'Failed to update currency'))
    }
  }

  async function handleSaveCompanySettings() {
    if (!tenantId) return

    setSaving(true)
    try {
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('company_settings')
          .update({
            ...companySettings,
            updated_at: new Date().toISOString()
          })
          .eq('tenant_id', tenantId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('company_settings')
          .insert({
            tenant_id: tenantId,
            ...companySettings
          })

        if (error) throw error
      }

      toast.success(language === 'tr' ? 'Şirket ayarları kaydedildi' : 'Company settings saved successfully')
      fetchCompanySettings()
    } catch (error: any) {
      toast.error(error.message || (language === 'tr' ? 'Şirket ayarları kaydedilemedi' : 'Failed to save company settings'))
    } finally {
      setSaving(false)
    }
  }

  if (loading || tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-500">{t.common.loading}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t.settings.title}</h1>
          <p className="text-gray-500 mt-1">
            {language === 'tr' ? 'Şirket bilgilerinizi ve uygulama tercihlerinizi yönetin' : 'Manage your company information and application preferences'}
          </p>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList>
            <TabsTrigger value="company" className="data-[state=inactive]:text-[#0A192F]">
              <Building className="mr-2 h-4 w-4" />
              {t.settings.companyInfo}
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=inactive]:text-[#0A192F]">
              <Globe className="mr-2 h-4 w-4" />
              {t.settings.preferences}
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=inactive]:text-[#0A192F]">
              <ShieldCheck className="mr-2 h-4 w-4" />
              {language === 'tr' ? 'Guvenlik' : 'Security'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.settings.companyInfo}</CardTitle>
                <CardDescription>
                  {t.settings.companyInfoDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">{t.settings.companyLogo}</Label>
                  <div className="flex items-center gap-4">
                    {companySettings.logo_url && (
                      <img
                        src={companySettings.logo_url}
                        alt="Company Logo"
                        className="h-16 w-16 object-contain border rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">{t.settings.clickToUpload}</p>
                        <p className="text-xs text-gray-500 mt-1">{t.settings.fileSize}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">{t.settings.companyName} *</Label>
                    <Input
                      id="company_name"
                      value={companySettings.company_name}
                      onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                      placeholder="MODULUS Inc."
                      data-field="settings-company-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_title">{t.settings.fullLegalTitle} *</Label>
                    <Input
                      id="company_title"
                      value={companySettings.company_title}
                      onChange={(e) => setCompanySettings({ ...companySettings, company_title: e.target.value })}
                      placeholder="MODULUS Technology Inc."
                      data-field="settings-company-title"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tax_office">{t.settings.taxOffice}</Label>
                    <Input
                      id="tax_office"
                      value={companySettings.tax_office}
                      onChange={(e) => setCompanySettings({ ...companySettings, tax_office: e.target.value })}
                      placeholder={language === 'tr' ? 'Merkez Vergi Dairesi' : 'Central Tax Office'}
                      data-field="settings-tax-office"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_number">{t.settings.taxNumber}</Label>
                    <Input
                      id="tax_number"
                      value={companySettings.tax_number}
                      onChange={(e) => setCompanySettings({ ...companySettings, tax_number: e.target.value })}
                      placeholder="1234567890"
                      data-field="settings-tax-number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t.settings.address}</Label>
                  <Textarea
                    id="address"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    placeholder={language === 'tr' ? 'Atatürk Caddesi No:123 Kat:4' : '123 Business Street, Suite 100'}
                    rows={2}
                    data-field="settings-address"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t.settings.city}</Label>
                    <TurkishProvinceSelect
                      value={companySettings.city}
                      onValueChange={(value) => setCompanySettings({ ...companySettings, city: value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">{t.settings.postalCode}</Label>
                    <Input
                      id="postal_code"
                      value={companySettings.postal_code}
                      onChange={(e) => setCompanySettings({ ...companySettings, postal_code: e.target.value })}
                      placeholder="34000"
                      data-field="settings-postal-code"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">{t.settings.country}</Label>
                    <Select
                      value={companySettings.country}
                      onValueChange={(value) => setCompanySettings({ ...companySettings, country: value })}
                    >
                      <SelectTrigger data-field="settings-country">
                        <SelectValue placeholder={language === 'tr' ? 'Ülke seçin' : 'Select country'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Türkiye">🇹🇷 {language === 'tr' ? 'Türkiye' : 'Turkey'}</SelectItem>
                        <SelectItem value="United States">🇺🇸 United States</SelectItem>
                        <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                        <SelectItem value="Germany">🇩🇪 {language === 'tr' ? 'Almanya' : 'Germany'}</SelectItem>
                        <SelectItem value="France">🇫🇷 {language === 'tr' ? 'Fransa' : 'France'}</SelectItem>
                        <SelectItem value="Italy">🇮🇹 {language === 'tr' ? 'İtalya' : 'Italy'}</SelectItem>
                        <SelectItem value="Spain">🇪🇸 {language === 'tr' ? 'İspanya' : 'Spain'}</SelectItem>
                        <SelectItem value="Netherlands">🇳🇱 {language === 'tr' ? 'Hollanda' : 'Netherlands'}</SelectItem>
                        <SelectItem value="Belgium">🇧🇪 {language === 'tr' ? 'Belçika' : 'Belgium'}</SelectItem>
                        <SelectItem value="Switzerland">🇨🇭 {language === 'tr' ? 'İsviçre' : 'Switzerland'}</SelectItem>
                        <SelectItem value="Austria">🇦🇹 {language === 'tr' ? 'Avusturya' : 'Austria'}</SelectItem>
                        <SelectItem value="Canada">🇨🇦 {language === 'tr' ? 'Kanada' : 'Canada'}</SelectItem>
                        <SelectItem value="Australia">🇦🇺 {language === 'tr' ? 'Avustralya' : 'Australia'}</SelectItem>
                        <SelectItem value="Japan">🇯🇵 {language === 'tr' ? 'Japonya' : 'Japan'}</SelectItem>
                        <SelectItem value="China">🇨🇳 {language === 'tr' ? 'Çin' : 'China'}</SelectItem>
                        <SelectItem value="South Korea">🇰🇷 {language === 'tr' ? 'Güney Kore' : 'South Korea'}</SelectItem>
                        <SelectItem value="India">🇮🇳 {language === 'tr' ? 'Hindistan' : 'India'}</SelectItem>
                        <SelectItem value="Brazil">🇧🇷 {language === 'tr' ? 'Brezilya' : 'Brazil'}</SelectItem>
                        <SelectItem value="Mexico">🇲🇽 {language === 'tr' ? 'Meksika' : 'Mexico'}</SelectItem>
                        <SelectItem value="Russia">🇷🇺 {language === 'tr' ? 'Rusya' : 'Russia'}</SelectItem>
                        <SelectItem value="Saudi Arabia">🇸🇦 {language === 'tr' ? 'Suudi Arabistan' : 'Saudi Arabia'}</SelectItem>
                        <SelectItem value="United Arab Emirates">🇦🇪 {language === 'tr' ? 'Birleşik Arap Emirlikleri' : 'United Arab Emirates'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t.settings.phone}</Label>
                    <Input
                      id="phone"
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                      placeholder="+90 212 345 6789"
                      data-field="settings-phone"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t.settings.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                      placeholder="info@sirket.com"
                      data-field="settings-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">{t.settings.website}</Label>
                  <Input
                    id="website"
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                    placeholder="https://www.sirket.com"
                    data-field="settings-website"
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold mb-4">{t.settings.bankingInfo}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">{t.settings.bankName}</Label>
                      <TurkishBankSelect
                        value={companySettings.bank_name}
                        onValueChange={(value) => setCompanySettings({ ...companySettings, bank_name: value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="iban">{t.settings.iban}</Label>
                      <Input
                        id="iban"
                        value={companySettings.iban}
                        onChange={(e) => setCompanySettings({ ...companySettings, iban: e.target.value })}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        data-field="settings-iban"
                      />
                    </div>
                  </div>
                </div>

                <DemoRestrictedButton
                  onClick={handleSaveCompanySettings}
                  disabled={saving}
                  className="bg-[#00D4AA] hover:bg-[#00B894]"
                  action="save"
                >
                  {saving ? t.common.loading : t.common.save}
                </DemoRestrictedButton>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Languages className="inline-block mr-2 h-5 w-5" />
                  {t.settings.languagePreferences}
                </CardTitle>
                <CardDescription>
                  {t.settings.languageDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t.settings.applicationLanguage}</Label>
                  <div className="flex gap-3">
                    <Button
                      variant={language === 'en' ? 'default' : 'outline'}
                      onClick={() => setLanguage('en')}
                      className={language === 'en' ? 'bg-[#00D4AA] hover:bg-[#00B894]' : ''}
                    >
                      🇺🇸 English
                    </Button>
                    <Button
                      variant={language === 'tr' ? 'default' : 'outline'}
                      onClick={() => setLanguage('tr')}
                      className={language === 'tr' ? 'bg-[#00D4AA] hover:bg-[#00B894]' : ''}
                    >
                      🇹🇷 Türkçe
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold mb-4">{t.settings.currencyFormat}</h3>
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t.settings.defaultCurrency}</Label>
                    <Select
                      value={selectedCurrency}
                      onValueChange={(value) => handleCurrencyChange(value)}
                    >
                      <SelectTrigger data-field="settings-currency">
                        <SelectValue placeholder={t.settings.selectCurrency} />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_LIST.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {getCurrencyLabel(c, language)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {language === 'tr'
                        ? 'Seçilen para birimi tüm finansal gösterimlerde kullanılacaktır'
                        : 'Selected currency will be used across all financial displays'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <MfaSetup language={language} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
