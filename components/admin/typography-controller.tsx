'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Type, Save, RotateCcw, Eye } from 'lucide-react';

interface TypographyStyle {
  id: string;
  element_name: string;
  font_family: string;
  font_size_text: string;
  font_weight: string;
  font_color: string;
  line_height_value: string;
  letter_spacing_value: string;
  text_transform?: string;
  text_decoration?: string;
}

const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { name: 'Roboto', value: 'Roboto, system-ui, sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", system-ui, sans-serif' },
  { name: 'Lato', value: 'Lato, system-ui, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, system-ui, sans-serif' },
  { name: 'Poppins', value: 'Poppins, system-ui, sans-serif' },
  { name: 'Raleway', value: 'Raleway, system-ui, sans-serif' },
  { name: 'Playfair Display', value: '"Playfair Display", serif' },
  { name: 'Merriweather', value: 'Merriweather, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Monaco', value: 'Monaco, Courier, monospace' },
  { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { name: 'System UI', value: 'system-ui, sans-serif' },
];

const FONT_WEIGHTS = [
  { name: 'Thin', value: '100' },
  { name: 'Extra Light', value: '200' },
  { name: 'Light', value: '300' },
  { name: 'Normal', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi Bold', value: '600' },
  { name: 'Bold', value: '700' },
  { name: 'Extra Bold', value: '800' },
  { name: 'Black', value: '900' },
];

const ELEMENT_LABELS = {
  body: 'Body Text',
  h1: 'Heading 1 (H1)',
  h2: 'Heading 2 (H2)',
  h3: 'Heading 3 (H3)',
  h4: 'Heading 4 (H4)',
  h5: 'Heading 5 (H5)',
  h6: 'Heading 6 (H6)',
  button: 'Button Text',
  input: 'Input Fields',
  label: 'Form Labels',
  caption: 'Captions',
  small: 'Small Text',
  code: 'Code / Monospace',
  link: 'Links',
};

export default function TypographyController() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [styles, setStyles] = useState<Record<string, TypographyStyle>>({});
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchTypographyStyles();
  }, []);

  const fetchTypographyStyles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ui_styles')
        .select('*')
        .eq('category', 'typography');

      if (error) throw error;

      const stylesMap: Record<string, TypographyStyle> = {};
      data?.forEach((style: any) => {
        stylesMap[style.element_name] = style;
      });

      setStyles(stylesMap);
    } catch (error: any) {
      console.error('Error fetching typography:', error);
      toast.error(error.message || 'Failed to load typography settings');
    } finally {
      setLoading(false);
    }
  };

  const updateStyle = (elementName: string, field: string, value: string) => {
    setStyles((prev) => ({
      ...prev,
      [elementName]: {
        ...prev[elementName],
        [field]: value,
      },
    }));
  };

  const saveStyle = async (elementName: string) => {
    const style = styles[elementName];
    if (!style) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('ui_styles')
        .update({
          font_family: style.font_family,
          font_size_text: style.font_size_text,
          font_weight: style.font_weight,
          font_color: style.font_color,
          line_height_value: style.line_height_value,
          letter_spacing_value: style.letter_spacing_value,
          text_transform: style.text_transform,
          text_decoration: style.text_decoration,
          updated_at: new Date().toISOString(),
        })
        .eq('id', style.id);

      if (error) throw error;

      toast.success(`${ELEMENT_LABELS[elementName as keyof typeof ELEMENT_LABELS]} updated!`);

      // Reload to apply changes
      window.dispatchEvent(new Event('typography-updated'));
    } catch (error: any) {
      console.error('Error saving typography:', error);
      toast.error(error.message || 'Failed to save typography');
    } finally {
      setSaving(false);
    }
  };

  const saveAllStyles = async () => {
    try {
      setSaving(true);
      const updates = Object.values(styles).map((style) => ({
        id: style.id,
        font_family: style.font_family,
        font_size_text: style.font_size_text,
        font_weight: style.font_weight,
        font_color: style.font_color,
        line_height_value: style.line_height_value,
        letter_spacing_value: style.letter_spacing_value,
        text_transform: style.text_transform,
        text_decoration: style.text_decoration,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('ui_styles')
          .update(update)
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('All typography styles saved!');
      window.dispatchEvent(new Event('typography-updated'));
    } catch (error: any) {
      console.error('Error saving all typography:', error);
      toast.error(error.message || 'Failed to save typography');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Reset all typography to default values?')) return;

    try {
      setSaving(true);
      await fetchTypographyStyles();
      toast.success('Typography reset to defaults');
    } catch (error: any) {
      console.error('Error resetting typography:', error);
      toast.error('Failed to reset typography');
    } finally {
      setSaving(false);
    }
  };

  const renderStyleEditor = (elementName: string) => {
    const style = styles[elementName];
    if (!style) return null;

    return (
      <Card key={elementName} className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>{ELEMENT_LABELS[elementName as keyof typeof ELEMENT_LABELS]}</span>
            <Button
              size="sm"
              onClick={() => saveStyle(elementName)}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select
                value={style.font_family}
                onValueChange={(value) => updateStyle(elementName, 'font_family', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={style.font_weight}
                onValueChange={(value) => updateStyle(elementName, 'font_weight', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHTS.map((weight) => (
                    <SelectItem key={weight.value} value={weight.value}>
                      {weight.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Font Size</Label>
              <Input
                value={style.font_size_text}
                onChange={(e) => updateStyle(elementName, 'font_size_text', e.target.value)}
                placeholder="16px, 1rem, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Font Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={style.font_color}
                  onChange={(e) => updateStyle(elementName, 'font_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={style.font_color}
                  onChange={(e) => updateStyle(elementName, 'font_color', e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Line Height</Label>
              <Input
                value={style.line_height_value}
                onChange={(e) => updateStyle(elementName, 'line_height_value', e.target.value)}
                placeholder="1.5, 24px, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Letter Spacing</Label>
              <Input
                value={style.letter_spacing_value}
                onChange={(e) => updateStyle(elementName, 'letter_spacing_value', e.target.value)}
                placeholder="0px, 0.05em, etc."
              />
            </div>
          </div>

          {/* Preview */}
          <div className="pt-4 border-t">
            <Label className="mb-2 block">Preview</Label>
            <div
              className="p-4 border rounded-lg bg-muted/30"
              style={{
                fontFamily: style.font_family,
                fontSize: style.font_size_text,
                fontWeight: style.font_weight,
                color: style.font_color,
                lineHeight: style.line_height_value,
                letterSpacing: style.letter_spacing_value,
              }}
            >
              {elementName.startsWith('h')
                ? `This is a ${elementName.toUpperCase()} heading`
                : elementName === 'button'
                ? 'Button Text'
                : elementName === 'code'
                ? 'const example = "code";'
                : 'The quick brown fox jumps over the lazy dog'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Typography Controller
            </CardTitle>
            <CardDescription>
              Customize fonts, sizes, colors, and spacing for all text elements
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefaults} disabled={saving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={saveAllStyles} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="headings" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="headings">Headings</TabsTrigger>
            <TabsTrigger value="body">Body & Text</TabsTrigger>
            <TabsTrigger value="ui">UI Elements</TabsTrigger>
            <TabsTrigger value="special">Special</TabsTrigger>
          </TabsList>

          <TabsContent value="headings" className="mt-6 space-y-4">
            {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(renderStyleEditor)}
          </TabsContent>

          <TabsContent value="body" className="mt-6 space-y-4">
            {['body', 'caption', 'small'].map(renderStyleEditor)}
          </TabsContent>

          <TabsContent value="ui" className="mt-6 space-y-4">
            {['button', 'input', 'label'].map(renderStyleEditor)}
          </TabsContent>

          <TabsContent value="special" className="mt-6 space-y-4">
            {['code', 'link'].map(renderStyleEditor)}
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        {/* Global Preview Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Full Preview</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>

          {previewMode && (
            <div className="p-6 border rounded-lg space-y-4 bg-background">
              {Object.entries(styles).map(([elementName, style]) => (
                <div key={elementName} className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {ELEMENT_LABELS[elementName as keyof typeof ELEMENT_LABELS]}
                  </div>
                  <div
                    style={{
                      fontFamily: style.font_family,
                      fontSize: style.font_size_text,
                      fontWeight: style.font_weight,
                      color: style.font_color,
                      lineHeight: style.line_height_value,
                      letterSpacing: style.letter_spacing_value,
                    }}
                  >
                    {elementName.startsWith('h')
                      ? `${elementName.toUpperCase()}: The quick brown fox jumps over the lazy dog`
                      : elementName === 'button'
                      ? 'Click Here'
                      : elementName === 'code'
                      ? 'const example = "Hello World";'
                      : elementName === 'link'
                      ? 'This is a clickable link'
                      : 'The quick brown fox jumps over the lazy dog'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
