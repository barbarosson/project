'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Save, Upload, Palette, Type, Layout } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ThemeConfig {
  logo_url?: string;
  logo_url_dark?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  success_color?: string;
  warning_color?: string;
  error_color?: string;
  info_color?: string;
  text_color?: string;
  text_color_secondary?: string;
  background_color?: string;
  card_background?: string;
  navbar_background?: string;
  footer_background?: string;
  heading_font?: string;
  body_font?: string;
  font_size_base?: string;
  border_radius?: string;
  button_radius?: string;
  custom_css?: string;
}

interface ThemeSettingsProps {
  onUpdate?: () => void;
}

export function ThemeSettings({ onUpdate }: ThemeSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ThemeConfig>({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data);
      }
    } catch (error: any) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load theme settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { data: existingConfig } = await supabase
        .from('site_config')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existingConfig) {
        const { error } = await supabase
          .from('site_config')
          .update(config)
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_config')
          .insert([{ ...config, key: 'default', value: 'default' }]);

        if (error) throw error;
      }

      toast.success('Theme settings saved successfully!');
      onUpdate?.();
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error('Failed to save theme settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ThemeConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Theme Settings</h2>
          <p className="text-muted-foreground">Customize your site's appearance and branding</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding">
            <Upload className="mr-2 h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="mr-2 h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="mr-2 h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Layout className="mr-2 h-4 w-4" />
            Layout
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo Settings</CardTitle>
              <CardDescription>Upload and manage your site logos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Light Mode Logo URL</Label>
                <Input
                  value={config.logo_url || ''}
                  onChange={(e) => updateField('logo_url', e.target.value)}
                  placeholder="/logo.svg"
                />
                {config.logo_url && (
                  <div className="mt-2 p-4 border rounded-lg bg-white">
                    <img src={config.logo_url} alt="Logo" className="h-12 object-contain" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Dark Mode Logo URL</Label>
                <Input
                  value={config.logo_url_dark || ''}
                  onChange={(e) => updateField('logo_url_dark', e.target.value)}
                  placeholder="/logo-dark.svg"
                />
                {config.logo_url_dark && (
                  <div className="mt-2 p-4 border rounded-lg bg-gray-900">
                    <img src={config.logo_url_dark} alt="Logo Dark" className="h-12 object-contain" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Primary Colors</CardTitle>
              <CardDescription>Main brand colors for your site</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.primary_color || '#3b82f6'}
                    onChange={(e) => updateField('primary_color', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.primary_color || '#3b82f6'}
                    onChange={(e) => updateField('primary_color', e.target.value)}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.secondary_color || '#6b7280'}
                    onChange={(e) => updateField('secondary_color', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.secondary_color || '#6b7280'}
                    onChange={(e) => updateField('secondary_color', e.target.value)}
                    placeholder="#6b7280"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.accent_color || '#8b5cf6'}
                    onChange={(e) => updateField('accent_color', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.accent_color || '#8b5cf6'}
                    onChange={(e) => updateField('accent_color', e.target.value)}
                    placeholder="#8b5cf6"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Semantic Colors</CardTitle>
              <CardDescription>Colors for success, warning, error, and info states</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Success Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.success_color || '#10b981'}
                    onChange={(e) => updateField('success_color', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.success_color || '#10b981'}
                    onChange={(e) => updateField('success_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Warning Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.warning_color || '#f59e0b'}
                    onChange={(e) => updateField('warning_color', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.warning_color || '#f59e0b'}
                    onChange={(e) => updateField('warning_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Error Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.error_color || '#ef4444'}
                    onChange={(e) => updateField('error_color', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.error_color || '#ef4444'}
                    onChange={(e) => updateField('error_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Info Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.info_color || '#3b82f6'}
                    onChange={(e) => updateField('info_color', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.info_color || '#3b82f6'}
                    onChange={(e) => updateField('info_color', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Background Colors</CardTitle>
              <CardDescription>Background colors for different sections</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Main Background</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.background_color || '#ffffff'}
                    onChange={(e) => updateField('background_color', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.background_color || '#ffffff'}
                    onChange={(e) => updateField('background_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Card Background</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.card_background || '#ffffff'}
                    onChange={(e) => updateField('card_background', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.card_background || '#ffffff'}
                    onChange={(e) => updateField('card_background', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Navbar Background</Label>
                <Input
                  value={config.navbar_background || ''}
                  onChange={(e) => updateField('navbar_background', e.target.value)}
                  placeholder="transparent or #ffffff"
                />
              </div>

              <div className="space-y-2">
                <Label>Footer Background</Label>
                <Input
                  value={config.footer_background || ''}
                  onChange={(e) => updateField('footer_background', e.target.value)}
                  placeholder="#1f2937"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Font Settings</CardTitle>
              <CardDescription>Choose fonts for headings and body text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Heading Font</Label>
                <Input
                  value={config.heading_font || 'Inter'}
                  onChange={(e) => updateField('heading_font', e.target.value)}
                  placeholder="Inter, sans-serif"
                />
                <p className="text-xs text-muted-foreground">
                  Popular options: Inter, Poppins, Roboto, Montserrat, Open Sans
                </p>
              </div>

              <div className="space-y-2">
                <Label>Body Font</Label>
                <Input
                  value={config.body_font || 'Inter'}
                  onChange={(e) => updateField('body_font', e.target.value)}
                  placeholder="Inter, sans-serif"
                />
              </div>

              <div className="space-y-2">
                <Label>Base Font Size</Label>
                <Input
                  value={config.font_size_base || '16px'}
                  onChange={(e) => updateField('font_size_base', e.target.value)}
                  placeholder="16px"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Text Colors</CardTitle>
              <CardDescription>Colors for text elements</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Text</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.text_color || '#1f2937'}
                    onChange={(e) => updateField('text_color', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.text_color || '#1f2937'}
                    onChange={(e) => updateField('text_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Secondary Text</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.text_color_secondary || '#6b7280'}
                    onChange={(e) => updateField('text_color_secondary', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.text_color_secondary || '#6b7280'}
                    onChange={(e) => updateField('text_color_secondary', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Layout Settings</CardTitle>
              <CardDescription>Border radius and spacing options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <Input
                  value={config.border_radius || '8px'}
                  onChange={(e) => updateField('border_radius', e.target.value)}
                  placeholder="8px"
                />
              </div>

              <div className="space-y-2">
                <Label>Button Border Radius</Label>
                <Input
                  value={config.button_radius || '6px'}
                  onChange={(e) => updateField('button_radius', e.target.value)}
                  placeholder="6px"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>Add custom CSS for advanced styling</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config.custom_css || ''}
                onChange={(e) => updateField('custom_css', e.target.value)}
                placeholder="/* Your custom CSS here */"
                rows={10}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
