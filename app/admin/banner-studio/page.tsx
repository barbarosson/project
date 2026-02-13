'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  Save,
  Trash2,
  Plus,
  Edit,
  LayoutDashboard
} from 'lucide-react';

interface Banner {
  id?: string;
  title_en: string;
  title_tr: string;
  description_en?: string;
  description_tr?: string;
  cta_text_en?: string;
  cta_text_tr?: string;
  cta_link?: string;
  image_url?: string;
  background_color: string;
  background_pattern?: string;
  text_color: string;
  position: string;
  page_slug: string;
  order_index: number;
  is_active: boolean;
  language: 'tr' | 'en' | 'all';
  width?: number;
  height?: number;
  layout_type?: 'compact' | 'full-width' | 'hero' | 'custom';
  content_alignment?: 'left' | 'center' | 'right';
  image_position?: 'left' | 'right' | 'background' | 'none';
  overlay_opacity?: number;
  full_width_image?: boolean;
  created_at?: string;
}

export default function BannerStudioPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [filterPage, setFilterPage] = useState<string>('all');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [isNewBanner, setIsNewBanner] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchBanners();
  }, [user, router]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cms_banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const createNewBanner = () => {
    const newBanner: Banner = {
      title_en: 'New Banner',
      title_tr: 'Yeni Banner',
      description_en: '',
      description_tr: '',
      cta_text_en: '',
      cta_text_tr: '',
      cta_link: '',
      image_url: '',
      background_color: '#3b82f6',
      background_pattern: 'none',
      text_color: '#ffffff',
      position: 'hero',
      page_slug: 'landing',
      order_index: banners.length,
      is_active: true,
      language: 'all',
      width: 100,
      height: 300,
      layout_type: 'hero',
      content_alignment: 'center',
      image_position: 'left',
      overlay_opacity: 50,
      full_width_image: false,
    };
    setSelectedBanner(newBanner);
    setIsNewBanner(true);
  };

  const editBanner = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsNewBanner(false);
  };

  const clearSelection = () => {
    setSelectedBanner(null);
    setIsNewBanner(false);
  };

  const handleSaveBanner = async () => {
    if (!selectedBanner) return;

    try {
      setSaving(true);

      if (selectedBanner.id) {
        const { error } = await supabase
          .from('cms_banners')
          .update(selectedBanner)
          .eq('id', selectedBanner.id);

        if (error) throw error;
        toast.success('Banner updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('cms_banners')
          .insert([selectedBanner])
          .select()
          .single();

        if (error) throw error;
        setSelectedBanner({ ...selectedBanner, id: data.id });
        setIsNewBanner(false);
        toast.success('Banner created successfully!');
      }

      await fetchBanners();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      toast.error('Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const { error } = await supabase
        .from('cms_banners')
        .delete()
        .eq('id', bannerId);

      if (error) throw error;

      toast.success('Banner deleted successfully!');
      if (selectedBanner?.id === bannerId) {
        clearSelection();
      }
      await fetchBanners();
    } catch (error: any) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const updateBannerField = (field: keyof Banner, value: any) => {
    if (!selectedBanner) return;
    setSelectedBanner({ ...selectedBanner, [field]: value });
  };

  const filteredBanners = banners.filter((banner) => {
    const pageMatch = filterPage === 'all' || banner.page_slug === filterPage;
    const positionMatch = filterPosition === 'all' || banner.position === filterPosition;
    return pageMatch && positionMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Banner Studio</h1>
            <p className="text-muted-foreground">
              Manage banners across your site
            </p>
          </div>
          <Button onClick={createNewBanner} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Banner
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Banners List */}
          <div className="lg:col-span-5">
            <Card>
              <CardHeader className="space-y-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5" />
                    Existing Banners
                  </CardTitle>
                  <CardDescription>
                    {filteredBanners.length} banner(s)
                  </CardDescription>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Select value={filterPage} onValueChange={setFilterPage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pages</SelectItem>
                      <SelectItem value="landing">Landing</SelectItem>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="pricing">Pricing</SelectItem>
                      <SelectItem value="contact">Contact</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterPosition} onValueChange={setFilterPosition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      <SelectItem value="hero">Hero</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="middle">Middle</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ScrollArea className="h-[calc(100vh-360px)]">
                  <div className="space-y-3 pr-4">
                    {filteredBanners.map((banner) => (
                      <Card
                        key={banner.id}
                        className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
                          selectedBanner?.id === banner.id ? 'ring-2 ring-primary shadow-md' : ''
                        }`}
                        onClick={() => editBanner(banner)}
                      >
                        <CardContent className="p-4">
                          <div className="mb-3">
                            <h4 className="font-semibold mb-2 line-clamp-1">{banner.title_en}</h4>
                            <div className="flex gap-1.5 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                {banner.page_slug}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {banner.position}
                              </Badge>
                              {banner.is_active ? (
                                <Badge variant="default" className="text-xs">Active</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">Inactive</Badge>
                              )}
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  banner.language === 'tr' ? 'bg-red-100 text-red-700' :
                                  banner.language === 'en' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {banner.language === 'tr' ? 'TR' : banner.language === 'en' ? 'EN' : 'ALL'}
                              </Badge>
                            </div>
                          </div>
                          {banner.image_url && (
                            <img
                              src={banner.image_url}
                              alt={banner.title_en}
                              className="w-full h-24 object-cover rounded mb-3"
                            />
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                editBanner(banner);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1.5" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (banner.id) handleDeleteBanner(banner.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredBanners.length === 0 && (
                      <div className="text-center py-12">
                        <LayoutDashboard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No banners found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Create a new banner to get started
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Banner Editor */}
          <div className="lg:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle>Banner Editor</CardTitle>
                <CardDescription>
                  {selectedBanner ? (isNewBanner ? 'Create a new banner' : 'Edit banner properties') : 'Select a banner to edit'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedBanner ? (
                  <ScrollArea className="h-[calc(100vh-280px)]">
                    <div className="space-y-6 pr-4">
                      <Tabs defaultValue="content" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                          <TabsTrigger value="content">Content</TabsTrigger>
                          <TabsTrigger value="style">Style</TabsTrigger>
                          <TabsTrigger value="layout">Layout</TabsTrigger>
                        </TabsList>

                        <TabsContent value="content" className="space-y-5 mt-0">
                          <div className="space-y-2">
                            <Label>Title (EN)</Label>
                            <Input
                              value={selectedBanner.title_en}
                              onChange={(e) => updateBannerField('title_en', e.target.value)}
                              placeholder="Banner title"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Title (TR)</Label>
                            <Input
                              value={selectedBanner.title_tr}
                              onChange={(e) => updateBannerField('title_tr', e.target.value)}
                              placeholder="Banner başlığı"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Description (EN)</Label>
                            <Textarea
                              value={selectedBanner.description_en || ''}
                              onChange={(e) => updateBannerField('description_en', e.target.value)}
                              placeholder="Description"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Description (TR)</Label>
                            <Textarea
                              value={selectedBanner.description_tr || ''}
                              onChange={(e) => updateBannerField('description_tr', e.target.value)}
                              placeholder="Açıklama"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                              value={selectedBanner.image_url || ''}
                              onChange={(e) => updateBannerField('image_url', e.target.value)}
                              placeholder="https://example.com/image.jpg"
                            />
                            {selectedBanner.image_url && (
                              <div className="mt-3 border rounded-lg overflow-hidden">
                                <img
                                  src={selectedBanner.image_url}
                                  alt="Preview"
                                  className="w-full h-40 object-cover"
                                />
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>CTA Text (EN)</Label>
                            <Input
                              value={selectedBanner.cta_text_en || ''}
                              onChange={(e) => updateBannerField('cta_text_en', e.target.value)}
                              placeholder="Learn More"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>CTA Text (TR)</Label>
                            <Input
                              value={selectedBanner.cta_text_tr || ''}
                              onChange={(e) => updateBannerField('cta_text_tr', e.target.value)}
                              placeholder="Daha Fazla"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>CTA Link</Label>
                            <Input
                              value={selectedBanner.cta_link || ''}
                              onChange={(e) => updateBannerField('cta_link', e.target.value)}
                              placeholder="/contact"
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="style" className="space-y-5 mt-0">
                          <div className="space-y-2">
                            <Label>Background Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={selectedBanner.background_color}
                                onChange={(e) => updateBannerField('background_color', e.target.value)}
                                className="w-16 h-10"
                              />
                              <Input
                                value={selectedBanner.background_color}
                                onChange={(e) => updateBannerField('background_color', e.target.value)}
                                placeholder="#3b82f6"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Text Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={selectedBanner.text_color}
                                onChange={(e) => updateBannerField('text_color', e.target.value)}
                                className="w-16 h-10"
                              />
                              <Input
                                value={selectedBanner.text_color}
                                onChange={(e) => updateBannerField('text_color', e.target.value)}
                                placeholder="#ffffff"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Pattern</Label>
                            <Select
                              value={selectedBanner.background_pattern || 'none'}
                              onValueChange={(value) => updateBannerField('background_pattern', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="dots">Dots</SelectItem>
                                <SelectItem value="grid">Grid</SelectItem>
                                <SelectItem value="waves">Waves</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TabsContent>

                        <TabsContent value="layout" className="space-y-5 mt-0">
                          <div className="space-y-2">
                            <Label>Layout Type</Label>
                            <Select
                              value={selectedBanner.layout_type || 'compact'}
                              onValueChange={(value: any) => updateBannerField('layout_type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="compact">Compact (Normal)</SelectItem>
                                <SelectItem value="full-width">Full Width (Orta Boy)</SelectItem>
                                <SelectItem value="hero">Hero (Tam Ekran)</SelectItem>
                                <SelectItem value="custom">Custom Height</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Hero: Tam ekran, Full Width: Orta boy, Compact: Normal
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Image Position</Label>
                            <Select
                              value={selectedBanner.image_position || 'left'}
                              onValueChange={(value: any) => updateBannerField('image_position', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left (Sol)</SelectItem>
                                <SelectItem value="right">Right (Sağ)</SelectItem>
                                <SelectItem value="background">Background (Arka Plan)</SelectItem>
                                <SelectItem value="none">None (Yok)</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Background: Resim arka planda, içerik üstte
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Content Alignment</Label>
                            <Select
                              value={selectedBanner.content_alignment || 'center'}
                              onValueChange={(value: any) => updateBannerField('content_alignment', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left (Sol)</SelectItem>
                                <SelectItem value="center">Center (Ortala)</SelectItem>
                                <SelectItem value="right">Right (Sağ)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2 pt-2 pb-2 border-t border-b my-4">
                            <Switch
                              checked={selectedBanner.full_width_image || false}
                              onCheckedChange={(checked) => updateBannerField('full_width_image', checked)}
                            />
                            <div className="space-y-1">
                              <Label className="cursor-pointer font-semibold">Resmi Tam Genişlikte Göster</Label>
                              <p className="text-xs text-muted-foreground">
                                Aktif edildiğinde, resim banner'ın tüm alanını kaplar (uçtan uca) ve içerik üzerine yerleşir.
                              </p>
                            </div>
                          </div>

                          {(selectedBanner.image_position === 'background' || selectedBanner.full_width_image) && (
                            <div className="space-y-2">
                              <Label>Overlay Opacity ({selectedBanner.overlay_opacity || 50}%)</Label>
                              <Input
                                type="range"
                                min="0"
                                max="100"
                                value={selectedBanner.overlay_opacity || 50}
                                onChange={(e) => updateBannerField('overlay_opacity', parseInt(e.target.value))}
                                className="w-full"
                              />
                              <p className="text-xs text-muted-foreground">
                                Resim üzerindeki karartma oranı (yazıların okunabilmesi için)
                              </p>
                            </div>
                          )}

                          {selectedBanner.layout_type === 'custom' && (
                            <div className="space-y-2">
                              <Label>Height (px)</Label>
                              <Input
                                type="number"
                                value={selectedBanner.height || 300}
                                onChange={(e) => updateBannerField('height', parseInt(e.target.value))}
                                min="100"
                                max="800"
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>Position</Label>
                            <Select
                              value={selectedBanner.position}
                              onValueChange={(value) => updateBannerField('position', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hero">Hero</SelectItem>
                                <SelectItem value="top">Top</SelectItem>
                                <SelectItem value="middle">Middle</SelectItem>
                                <SelectItem value="bottom">Bottom</SelectItem>
                                <SelectItem value="sidebar">Sidebar</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Page</Label>
                            <Select
                              value={selectedBanner.page_slug}
                              onValueChange={(value) => updateBannerField('page_slug', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="landing">Landing</SelectItem>
                                <SelectItem value="dashboard">Dashboard</SelectItem>
                                <SelectItem value="pricing">Pricing</SelectItem>
                                <SelectItem value="contact">Contact</SelectItem>
                                <SelectItem value="all">All Pages</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Language (Dil)</Label>
                            <Select
                              value={selectedBanner.language}
                              onValueChange={(value: 'tr' | 'en' | 'all') => updateBannerField('language', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Languages</SelectItem>
                                <SelectItem value="tr">Turkish Only</SelectItem>
                                <SelectItem value="en">English Only</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Aynı position'a farklı diller için ayrı bannerlar ekleyebilirsiniz
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={selectedBanner.is_active}
                              onCheckedChange={(checked) => updateBannerField('is_active', checked)}
                            />
                            <Label>Active</Label>
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="pt-6 space-y-3 border-t mt-6">
                        <div className="flex gap-3">
                          <Button
                            onClick={handleSaveBanner}
                            disabled={saving}
                            className="flex-1"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                {isNewBanner ? 'Create Banner' : 'Update Banner'}
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={clearSelection}
                          >
                            Cancel
                          </Button>
                        </div>
                        {selectedBanner.id && (
                          <Button
                            variant="destructive"
                            onClick={() => selectedBanner.id && handleDeleteBanner(selectedBanner.id)}
                            className="w-full"
                            size="sm"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Banner
                          </Button>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[calc(100vh-280px)] flex items-center justify-center text-center">
                    <div className="max-w-sm">
                      <Edit className="h-20 w-20 mx-auto mb-4 text-muted-foreground opacity-20" />
                      <h3 className="text-xl font-semibold mb-2">No Banner Selected</h3>
                      <p className="text-muted-foreground mb-6">
                        Select a banner from the list to edit or create a new one to get started
                      </p>
                      <Button onClick={createNewBanner} size="lg" className="w-full">
                        <Plus className="mr-2 h-5 w-5" />
                        Create New Banner
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
