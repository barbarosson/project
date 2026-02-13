'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { testNesConnection } from '@/lib/nes-api'
import { toast } from 'sonner'
import { Save, Loader2, CheckCircle2, XCircle, Wifi, Settings2, Building2, Shield } from 'lucide-react'

interface EdocumentSettingsProps {
  tenantId: string
  language: 'en' | 'tr'
  translations: Record<string, string>
  onSaved?: () => void
}

interface SettingsData {
  id?: string
  provider: string
  api_base_url: string
  api_key: string
  username: string
  password_encrypted: string
  is_active: boolean
  efatura_enabled: boolean
  earsiv_enabled: boolean
  edespatch_enabled: boolean
  esmm_enabled: boolean
  emm_enabled: boolean
  ebook_enabled: boolean
  default_series: string
  company_vkn: string
  company_title: string
}

const defaultSettings: SettingsData = {
  provider: 'nes_bilgi',
  api_base_url: '',
  api_key: '',
  username: '',
  password_encrypted: '',
  is_active: false,
  efatura_enabled: false,
  earsiv_enabled: false,
  edespatch_enabled: false,
  esmm_enabled: false,
  emm_enabled: false,
  ebook_enabled: false,
  default_series: '',
  company_vkn: '',
  company_title: '',
}

export function EdocumentSettings({ tenantId, language, translations: t, onSaved }: EdocumentSettingsProps) {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    loadSettings()
  }, [tenantId])

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from('edocument_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (error) throw error
      if (data) setSettings(data)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (settings.id) {
        const { error } = await supabase
          .from('edocument_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('edocument_settings')
          .insert({
            ...settings,
            tenant_id: tenantId,
          })
          .select()
          .single()

        if (error) throw error
        setSettings(data)
      }

      toast.success(language === 'tr' ? 'Ayarlar kaydedildi' : 'Settings saved')
      onSaved?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleTestConnection() {
    setTesting(true)
    setConnectionStatus('idle')
    try {
      await testNesConnection(tenantId)
      setConnectionStatus('success')
      toast.success(t.connectionSuccess)
    } catch (error: any) {
      setConnectionStatus('error')
      toast.error(`${t.connectionFailed}: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  function updateField(field: keyof SettingsData, value: unknown) {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0D1B2A]">
              <Settings2 className="h-5 w-5 text-[#B8E6FF]" />
            </div>
            <div>
              <CardTitle className="text-lg">{t.provider} {language === 'tr' ? 'Bilgileri' : 'Credentials'}</CardTitle>
              <CardDescription>
                {language === 'tr' ? 'NES Bilgi API bağlantı ayarları' : 'NES Bilgi API connection settings'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.provider}</Label>
              <Select value={settings.provider} onValueChange={(v) => updateField('provider', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nes_bilgi">NES Bilgi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.apiUrl}</Label>
              <Input
                value={settings.api_base_url}
                onChange={(e) => updateField('api_base_url', e.target.value)}
                placeholder="https://api.nesbilgi.com.tr"
              />
              <p className="text-[11px] text-muted-foreground">
                {language === 'tr' ? 'NES Bilgi tarafından verilen API adresi' : 'API base URL provided by NES Bilgi'}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{language === 'tr' ? 'API Anahtarı' : 'API Key'}</Label>
              <Input
                type="password"
                value={settings.api_key}
                onChange={(e) => updateField('api_key', e.target.value)}
                placeholder={language === 'tr' ? 'NES Portal\'dan üretilen API anahtarı' : 'API key generated from NES Portal'}
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                {language === 'tr'
                  ? 'NES Portal üzerinden üretilen Persisted Access Token. Örnek: 9EE05B6564525810C86A32646DB46A26...'
                  : 'Persisted Access Token generated from NES Portal. Example: 9EE05B6564525810C86A32646DB46A26...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !settings.api_key || !settings.api_base_url}
            >
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wifi className="mr-2 h-4 w-4" />
              )}
              {t.testConnection}
            </Button>
            {connectionStatus === 'success' && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {t.connectionSuccess}
              </Badge>
            )}
            {connectionStatus === 'error' && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <XCircle className="mr-1 h-3 w-3" />
                {t.connectionFailed}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0D1B2A]">
              <Building2 className="h-5 w-5 text-[#B8E6FF]" />
            </div>
            <div>
              <CardTitle className="text-lg">{language === 'tr' ? 'Firma Bilgileri' : 'Company Information'}</CardTitle>
              <CardDescription>
                {language === 'tr' ? 'E-belge gönderiminde kullanılacak firma bilgileri' : 'Company details used in e-document submissions'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.companyVkn}</Label>
              <Input
                value={settings.company_vkn}
                onChange={(e) => updateField('company_vkn', e.target.value)}
                placeholder="1234567890"
                maxLength={11}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.companyTitle}</Label>
              <Input
                value={settings.company_title}
                onChange={(e) => updateField('company_title', e.target.value)}
                placeholder={language === 'tr' ? 'Firma unvanı' : 'Company legal title'}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'tr' ? 'Fatura Seri Öneki' : 'Invoice Series Prefix'}</Label>
              <Input
                value={settings.default_series}
                onChange={(e) => updateField('default_series', e.target.value)}
                placeholder="ABC"
                maxLength={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0D1B2A]">
              <Shield className="h-5 w-5 text-[#B8E6FF]" />
            </div>
            <div>
              <CardTitle className="text-lg">{language === 'tr' ? 'Modül Ayarları' : 'Module Settings'}</CardTitle>
              <CardDescription>
                {language === 'tr' ? 'Aktif modülleri seçin' : 'Select active modules'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">{language === 'tr' ? 'Entegrasyonu Etkinleştir' : 'Enable Integration'}</p>
              <p className="text-xs text-muted-foreground">{language === 'tr' ? 'Ana aç/kapa' : 'Master toggle'}</p>
            </div>
            <Switch checked={settings.is_active} onCheckedChange={(v) => updateField('is_active', v)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'efatura_enabled' as const, label: t.efatura, desc: language === 'tr' ? 'Elektronik fatura gönder/al' : 'Send/receive e-invoices' },
              { key: 'earsiv_enabled' as const, label: t.earsiv, desc: language === 'tr' ? 'E-arşiv fatura oluştur' : 'Create e-archive invoices' },
              { key: 'edespatch_enabled' as const, label: t.edespatch, desc: language === 'tr' ? 'E-irsaliye gönder/al' : 'Send/receive e-waybills' },
              { key: 'esmm_enabled' as const, label: t.esmm, desc: language === 'tr' ? 'Serbest meslek makbuzu' : 'Freelancer receipt' },
              { key: 'emm_enabled' as const, label: t.emm, desc: language === 'tr' ? 'Müstahsil makbuzu' : 'Producer receipt' },
              { key: 'ebook_enabled' as const, label: t.ebook, desc: language === 'tr' ? 'Elektronik defter' : 'Electronic ledger' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50">
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={settings[key]}
                  onCheckedChange={(v) => updateField(key, v)}
                  disabled={!settings.is_active}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-[#0D1B2A] hover:bg-[#132d46]">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {language === 'tr' ? 'Ayarları Kaydet' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
