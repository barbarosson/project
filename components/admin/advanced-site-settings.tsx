'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Save, Globe, Mail, Code, AlertCircle, Phone, MapPin, Award, TrendingUp, Image as ImageIcon, Palette, MessageCircle } from 'lucide-react'
import Image from 'next/image'

interface SiteConfig {
  id: string
  site_name_en: string
  site_name_tr: string
  tagline_en: string
  tagline_tr: string
  logo_url: string
  logo_url_dark: string
  primary_color: string
  secondary_color: string
  accent_color: string
  meta_title_en: string
  meta_title_tr: string
  meta_description_en: string
  meta_description_tr: string
  keywords_en: string
  keywords_tr: string
  og_image_url: string
  contact_email: string
  contact_phone: string
  contact_address: string
  whatsapp_number: string
  whatsapp_enabled: boolean
  trust_badge_en: string
  trust_badge_tr: string
  stats_customers_count: number
  stats_transactions_count: number
  stats_years_active: number
  stats_satisfaction_rate: number
  maintenance_mode: boolean
  maintenance_message_en: string
  maintenance_message_tr: string
  custom_css: string
}

export function AdvancedSiteSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<Partial<SiteConfig>>({})

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .maybeSingle()

      if (error) throw error

      if (data) {
        console.log('✅ Site config loaded:', data.id)
        setConfig(data)
      } else {
        console.warn('⚠️ No site config found in database')
        toast.warning('No configuration found. Please contact support.')
      }
    } catch (error) {
      console.error('❌ Error fetching config:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config.id) {
      toast.error('Configuration not loaded. Please refresh the page.')
      return
    }

    try {
      setSaving(true)

      console.log('💾 Saving config:', config.id)
      const { error } = await supabase
        .from('site_config')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)

      if (error) throw error

      console.log('✅ Config saved successfully')
      toast.success('Settings saved successfully')
      await fetchConfig()
    } catch (error) {
      console.error('❌ Error saving config:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof SiteConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-[#0A192F]">Loading settings...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!config.id) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-[#0A192F]">Configuration Not Found</h3>
            <p className="text-[#0A192F] mb-4">
              No site configuration exists in the database.
            </p>
            <Button onClick={fetchConfig}>
              Retry Loading
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0A192F]">Advanced Site Settings</h2>
          <p className="text-[#0A192F]">Configure SEO, contact info, and advanced options</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !config.id}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="branding">
            <Palette className="mr-2 h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Globe className="mr-2 h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Mail className="mr-2 h-4 w-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="trust">
            <Award className="mr-2 h-4 w-4" />
            Trust
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <AlertCircle className="mr-2 h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Code className="mr-2 h-4 w-4" />
            Custom CSS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0A192F]">
                  <Palette className="h-5 w-5" />
                  Brand Identity
                </CardTitle>
                <CardDescription className="text-[#0A192F]">Configure your site name, tagline, and brand identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_name_en" className="text-[#0A192F]">Site Name (English)</Label>
                    <Input
                      id="site_name_en"
                      value={config.site_name_en || ''}
                      onChange={(e) => updateField('site_name_en', e.target.value)}
                      placeholder="Modulus ERP"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site_name_tr" className="text-[#0A192F]">Site Adı (Türkçe)</Label>
                    <Input
                      id="site_name_tr"
                      value={config.site_name_tr || ''}
                      onChange={(e) => updateField('site_name_tr', e.target.value)}
                      placeholder="Modulus ERP"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tagline_en" className="text-[#0A192F]">Tagline (English)</Label>
                    <Input
                      id="tagline_en"
                      value={config.tagline_en || ''}
                      onChange={(e) => updateField('tagline_en', e.target.value)}
                      placeholder="Smart Business Management"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tagline_tr" className="text-[#0A192F]">Slogan (Türkçe)</Label>
                    <Input
                      id="tagline_tr"
                      value={config.tagline_tr || ''}
                      onChange={(e) => updateField('tagline_tr', e.target.value)}
                      placeholder="Akıllı İşletme Yönetimi"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0A192F]">
                  <ImageIcon className="h-5 w-5" />
                  Logo Settings
                </CardTitle>
                <CardDescription className="text-[#0A192F]">
                  Upload or link your logo images. Leave blank to use default logo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="logo_url" className="text-[#0A192F]">Logo URL (Light Mode)</Label>
                  <Input
                    id="logo_url"
                    value={config.logo_url || ''}
                    onChange={(e) => updateField('logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png or /logo.png"
                  />
                  <p className="text-xs text-[#0A192F]">
                    Enter a full URL or a path to a file in your public folder. Leave empty to use default.
                  </p>
                  {config.logo_url && (
                    <div className="mt-4 p-4 border rounded-lg bg-white">
                      <p className="text-sm font-medium mb-2 text-[#0A192F]">Preview (Light Mode):</p>
                      <div className="relative h-16 bg-gray-50 rounded flex items-center justify-center">
                        <Image
                          src={config.logo_url}
                          alt="Logo Preview"
                          width={150}
                          height={50}
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_url_dark" className="text-[#0A192F]">Logo URL (Dark Mode)</Label>
                  <Input
                    id="logo_url_dark"
                    value={config.logo_url_dark || ''}
                    onChange={(e) => updateField('logo_url_dark', e.target.value)}
                    placeholder="https://example.com/logo-dark.png or /logo-dark.png"
                  />
                  <p className="text-xs text-[#0A192F]">
                    Logo variant for dark backgrounds. Leave empty to use the same as light mode.
                  </p>
                  {config.logo_url_dark && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-900">
                      <p className="text-sm font-medium mb-2 text-[#7DD3FC]">Preview (Dark Mode):</p>
                      <div className="relative h-16 bg-gray-800 rounded flex items-center justify-center">
                        <Image
                          src={config.logo_url_dark}
                          alt="Logo Preview Dark"
                          width={150}
                          height={50}
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ImageIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Logo Tips</p>
                      <ul className="text-sm text-blue-800 mt-1 space-y-1 list-disc list-inside">
                        <li>Recommended size: 150-200px wide, 40-60px tall</li>
                        <li>Format: PNG with transparent background works best</li>
                        <li>To remove logo: clear the input field and save</li>
                        <li>Default logo will be used if field is empty</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0A192F]">
                  <Palette className="h-5 w-5" />
                  Brand Colors
                </CardTitle>
                <CardDescription className="text-[#0A192F]">Define your primary brand colors</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color" className="text-[#0A192F]">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={config.primary_color || '#00D4AA'}
                      onChange={(e) => updateField('primary_color', e.target.value)}
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      value={config.primary_color || '#00D4AA'}
                      onChange={(e) => updateField('primary_color', e.target.value)}
                      placeholder="#00D4AA"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_color" className="text-[#0A192F]">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={config.secondary_color || '#3498DB'}
                      onChange={(e) => updateField('secondary_color', e.target.value)}
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      value={config.secondary_color || '#3498DB'}
                      onChange={(e) => updateField('secondary_color', e.target.value)}
                      placeholder="#3498DB"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent_color" className="text-[#0A192F]">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent_color"
                      type="color"
                      value={config.accent_color || '#E74C3C'}
                      onChange={(e) => updateField('accent_color', e.target.value)}
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      value={config.accent_color || '#E74C3C'}
                      onChange={(e) => updateField('accent_color', e.target.value)}
                      placeholder="#E74C3C"
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A192F]">SEO Settings - English</CardTitle>
                <CardDescription className="text-[#0A192F]">Configure meta tags and SEO for English version</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title_en" className="text-[#0A192F]">Meta Title</Label>
                  <Input
                    id="meta_title_en"
                    value={config.meta_title_en || ''}
                    onChange={(e) => updateField('meta_title_en', e.target.value)}
                    placeholder="Your Site Title - Tagline"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description_en" className="text-[#0A192F]">Meta Description</Label>
                  <Textarea
                    id="meta_description_en"
                    value={config.meta_description_en || ''}
                    onChange={(e) => updateField('meta_description_en', e.target.value)}
                    placeholder="Brief description of your site (150-160 characters)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords_en" className="text-[#0A192F]">Keywords (comma separated)</Label>
                  <Input
                    id="keywords_en"
                    value={config.keywords_en || ''}
                    onChange={(e) => updateField('keywords_en', e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A192F]">SEO Settings - Turkish</CardTitle>
                <CardDescription className="text-[#0A192F]">Configure meta tags and SEO for Turkish version</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title_tr" className="text-[#0A192F]">Meta Başlık</Label>
                  <Input
                    id="meta_title_tr"
                    value={config.meta_title_tr || ''}
                    onChange={(e) => updateField('meta_title_tr', e.target.value)}
                    placeholder="Site Başlığınız - Slogan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description_tr" className="text-[#0A192F]">Meta Açıklama</Label>
                  <Textarea
                    id="meta_description_tr"
                    value={config.meta_description_tr || ''}
                    onChange={(e) => updateField('meta_description_tr', e.target.value)}
                    placeholder="Sitenizin kısa açıklaması (150-160 karakter)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords_tr" className="text-[#0A192F]">Anahtar Kelimeler (virgülle ayrılmış)</Label>
                  <Input
                    id="keywords_tr"
                    value={config.keywords_tr || ''}
                    onChange={(e) => updateField('keywords_tr', e.target.value)}
                    placeholder="kelime1, kelime2, kelime3"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#0A192F]">Open Graph Image</CardTitle>
                <CardDescription className="text-[#0A192F]">Image shown when sharing on social media (1200x630px)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="og_image_url" className="text-[#0A192F]">Image URL</Label>
                  <Input
                    id="og_image_url"
                    value={config.og_image_url || ''}
                    onChange={(e) => updateField('og_image_url', e.target.value)}
                    placeholder="https://example.com/og-image.jpg"
                  />
                  {config.og_image_url && (
                    <div className="mt-4 border rounded-lg p-2">
                      <img
                        src={config.og_image_url}
                        alt="OG Preview"
                        className="w-full max-w-md rounded"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A192F]">Contact Information</CardTitle>
              <CardDescription className="text-[#0A192F]">Configure public contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email" className="text-[#0A192F]">
                  <Mail className="inline mr-2 h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={config.contact_email || ''}
                  onChange={(e) => updateField('contact_email', e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="text-[#0A192F]">
                  <Phone className="inline mr-2 h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={config.contact_phone || ''}
                  onChange={(e) => updateField('contact_phone', e.target.value)}
                  placeholder="+90 (XXX) XXX XX XX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp_number" className="text-[#0A192F]">
                  <MessageCircle className="inline mr-2 h-4 w-4" />
                  WhatsApp Number
                </Label>
                <Input
                  id="whatsapp_number"
                  type="tel"
                  value={config.whatsapp_number || ''}
                  onChange={(e) => updateField('whatsapp_number', e.target.value)}
                  placeholder="+905551234567"
                />
                <p className="text-xs text-gray-500">Enter number in international format (e.g., +905551234567)</p>
              </div>

              <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg bg-gray-50">
                <div className="space-y-0.5">
                  <Label htmlFor="whatsapp_enabled" className="text-[#0A192F] font-medium">
                    Enable WhatsApp Support
                  </Label>
                  <p className="text-xs text-gray-500">
                    Show WhatsApp contact option when live support is offline
                  </p>
                </div>
                <Switch
                  id="whatsapp_enabled"
                  checked={config.whatsapp_enabled || false}
                  onCheckedChange={(checked) => updateField('whatsapp_enabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_address" className="text-[#0A192F]">
                  <MapPin className="inline mr-2 h-4 w-4" />
                  Address
                </Label>
                <Textarea
                  id="contact_address"
                  value={config.contact_address || ''}
                  onChange={(e) => updateField('contact_address', e.target.value)}
                  placeholder="Full business address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trust">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0A192F]">
                  <Award className="h-5 w-5" />
                  Trust Indicators
                </CardTitle>
                <CardDescription className="text-[#0A192F]">
                  Social proof messages displayed on landing pages to build credibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trust_badge_en" className="text-[#0A192F]">Trust Badge (English)</Label>
                  <Input
                    id="trust_badge_en"
                    value={config.trust_badge_en || ''}
                    onChange={(e) => updateField('trust_badge_en', e.target.value)}
                    placeholder="Trusted by 10,000+ businesses"
                  />
                  <p className="text-xs text-[#0A192F]">
                    This text appears in the hero section of landing pages
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trust_badge_tr" className="text-[#0A192F]">Güven Rozeti (Türkçe)</Label>
                  <Input
                    id="trust_badge_tr"
                    value={config.trust_badge_tr || ''}
                    onChange={(e) => updateField('trust_badge_tr', e.target.value)}
                    placeholder="10.000+ işletme tarafından güveniliyor"
                  />
                  <p className="text-xs text-[#0A192F]">
                    Bu metin açılış sayfalarının hero bölümünde görünür
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0A192F]">
                  <TrendingUp className="h-5 w-5" />
                  Business Statistics
                </CardTitle>
                <CardDescription className="text-[#0A192F]">
                  Key metrics to showcase your business credibility and reach
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stats_customers_count" className="text-[#0A192F]">Total Customers</Label>
                  <Input
                    id="stats_customers_count"
                    type="number"
                    value={config.stats_customers_count || 0}
                    onChange={(e) => updateField('stats_customers_count', parseInt(e.target.value) || 0)}
                    placeholder="10000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stats_transactions_count" className="text-[#0A192F]">Total Transactions</Label>
                  <Input
                    id="stats_transactions_count"
                    type="number"
                    value={config.stats_transactions_count || 0}
                    onChange={(e) => updateField('stats_transactions_count', parseInt(e.target.value) || 0)}
                    placeholder="1000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stats_years_active" className="text-[#0A192F]">Years Active</Label>
                  <Input
                    id="stats_years_active"
                    type="number"
                    value={config.stats_years_active || 0}
                    onChange={(e) => updateField('stats_years_active', parseInt(e.target.value) || 0)}
                    placeholder="5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stats_satisfaction_rate" className="text-[#0A192F]">Satisfaction Rate (%)</Label>
                  <Input
                    id="stats_satisfaction_rate"
                    type="number"
                    value={config.stats_satisfaction_rate || 0}
                    onChange={(e) => updateField('stats_satisfaction_rate', parseInt(e.target.value) || 0)}
                    placeholder="98"
                    min="0"
                    max="100"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Award className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Preview</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Trust badge: <span className="font-semibold">{config.trust_badge_en || 'Trusted by 10,000+ businesses'}</span>
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    These statistics can be used in your marketing sections and testimonials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A192F]">Maintenance Mode</CardTitle>
              <CardDescription className="text-[#0A192F]">Temporarily disable public access to your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-[#0A192F]">Enable Maintenance Mode</Label>
                  <p className="text-sm text-[#0A192F]">
                    When enabled, visitors will see a maintenance message
                  </p>
                </div>
                <Switch
                  checked={config.maintenance_mode || false}
                  onCheckedChange={(checked) => updateField('maintenance_mode', checked)}
                />
              </div>

              {config.maintenance_mode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_message_en" className="text-[#0A192F]">Maintenance Message (English)</Label>
                    <Textarea
                      id="maintenance_message_en"
                      value={config.maintenance_message_en || ''}
                      onChange={(e) => updateField('maintenance_message_en', e.target.value)}
                      placeholder="We're currently performing maintenance. Please check back soon."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maintenance_message_tr" className="text-[#0A192F]">Bakım Mesajı (Türkçe)</Label>
                    <Textarea
                      id="maintenance_message_tr"
                      value={config.maintenance_message_tr || ''}
                      onChange={(e) => updateField('maintenance_message_tr', e.target.value)}
                      placeholder="Şu anda bakım yapıyoruz. Lütfen daha sonra tekrar kontrol edin."
                      rows={3}
                    />
                  </div>
                </>
              )}

              {config.maintenance_mode && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Warning</p>
                      <p className="text-sm text-yellow-800">
                        Your site is currently in maintenance mode. Public visitors cannot access it.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0A192F]">Custom CSS</CardTitle>
              <CardDescription className="text-[#0A192F]">Add your own custom CSS styles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="custom_css" className="text-[#0A192F]">CSS Code</Label>
                <Textarea
                  id="custom_css"
                  value={config.custom_css || ''}
                  onChange={(e) => updateField('custom_css', e.target.value)}
                  placeholder=".custom-class { color: red; }"
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-[#0A192F]">
                  Add custom CSS to override default styles. Use with caution.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
