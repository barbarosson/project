'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, Eye, MoveUp, MoveDown, FolderOpen } from 'lucide-react';

interface Banner {
  id: string;
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
  start_date?: string;
  end_date?: string;
  layout_type?: 'compact' | 'full-width' | 'hero' | 'custom';
  height?: string;
  content_alignment?: 'left' | 'center' | 'right';
  image_position?: 'left' | 'right' | 'background' | 'none';
  overlay_opacity?: number;
  full_width_image?: boolean;
}

const emptyBanner: Partial<Banner> = {
  title_en: '',
  title_tr: '',
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
  order_index: 0,
  is_active: true,
  language: 'all',
  layout_type: 'compact',
  height: '400px',
  content_alignment: 'center',
  image_position: 'left',
  overlay_opacity: 50,
  full_width_image: false,
};

export function BannerManager() {
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [storageAssets, setStorageAssets] = useState<Array<{ name: string; url: string }>>([]);

  useEffect(() => {
    fetchBanners();
    fetchStorageAssets();
  }, []);

  const fetchStorageAssets = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('assets')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        console.error('Fetch storage assets error:', error);
        return;
      }

      const assets = (data || []).map((file: any) => {
        const { data: publicUrl } = supabase.storage
          .from('assets')
          .getPublicUrl(file.name);

        return {
          name: file.name,
          url: publicUrl.publicUrl,
        };
      });

      setStorageAssets(assets);
    } catch (error: any) {
      console.error('Error fetching storage assets:', error);
    }
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cms_banners')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Fetch banners error:', error);
        throw error;
      }

      setBanners(data || []);
    } catch (error: any) {
      console.error('Error fetching banners:', error);
      const errorMessage = error?.message || 'Failed to load banners';
      toast.error(`Load failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingBanner) return;

    try {
      setSaving(true);

      if (editingBanner.id) {
        const { error } = await supabase
          .from('cms_banners')
          .update(editingBanner)
          .eq('id', editingBanner.id);

        if (error) {
          console.error('Banner update error:', error);
          throw error;
        }
        toast.success('Banner updated successfully!');
      } else {
        const { error } = await supabase
          .from('cms_banners')
          .insert([editingBanner]);

        if (error) {
          console.error('Banner insert error:', error);
          throw error;
        }
        toast.success('Banner created successfully!');
      }

      setDialogOpen(false);
      setEditingBanner(null);
      fetchBanners();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      const errorMessage = error?.message || 'Failed to save banner';
      toast.error(`Save failed: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const { error } = await supabase
        .from('cms_banners')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete banner error:', error);
        throw error;
      }

      toast.success('Banner deleted successfully!');
      fetchBanners();
    } catch (error: any) {
      console.error('Error deleting banner:', error);
      const errorMessage = error?.message || 'Failed to delete banner';
      toast.error(`Delete failed: ${errorMessage}`);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from('cms_banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);

      if (error) {
        console.error('Toggle banner error:', error);
        throw error;
      }

      toast.success(`Banner ${!banner.is_active ? 'activated' : 'deactivated'}`);
      fetchBanners();
    } catch (error: any) {
      console.error('Error toggling banner:', error);
      const errorMessage = error?.message || 'Failed to update banner status';
      toast.error(`Update failed: ${errorMessage}`);
    }
  };

  const handleReorder = async (banner: Banner, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b.id === banner.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const otherBanner = banners[newIndex];

    try {
      const { error: error1 } = await supabase
        .from('cms_banners')
        .update({ order_index: otherBanner.order_index })
        .eq('id', banner.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('cms_banners')
        .update({ order_index: banner.order_index })
        .eq('id', otherBanner.id);

      if (error2) throw error2;

      fetchBanners();
    } catch (error: any) {
      console.error('Error reordering banners:', error);
      const errorMessage = error?.message || 'Failed to reorder banners';
      toast.error(`Reorder failed: ${errorMessage}`);
    }
  };

  const openCreateDialog = () => {
    setEditingBanner({ ...emptyBanner });
    setDialogOpen(true);
  };

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setDialogOpen(true);
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
          <h2 className="text-2xl font-bold">Banner Management</h2>
          <p className="text-muted-foreground">Create and manage promotional banners</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBanner?.id ? 'Edit Banner' : 'Create New Banner'}</DialogTitle>
              <DialogDescription>
                Configure your banner content and display settings
              </DialogDescription>
            </DialogHeader>

            {editingBanner && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title (English)</Label>
                    <Input
                      value={editingBanner.title_en || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, title_en: e.target.value })}
                      placeholder="Enter title in English"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Title (Turkish)</Label>
                    <Input
                      value={editingBanner.title_tr || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, title_tr: e.target.value })}
                      placeholder="Başlığı Türkçe girin"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Description (English)</Label>
                    <Textarea
                      value={editingBanner.description_en || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, description_en: e.target.value })}
                      placeholder="Enter description"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Turkish)</Label>
                    <Textarea
                      value={editingBanner.description_tr || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, description_tr: e.target.value })}
                      placeholder="Açıklama girin"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CTA Text (English)</Label>
                    <Input
                      value={editingBanner.cta_text_en || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, cta_text_en: e.target.value })}
                      placeholder="Learn More"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CTA Text (Turkish)</Label>
                    <Input
                      value={editingBanner.cta_text_tr || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, cta_text_tr: e.target.value })}
                      placeholder="Daha Fazla Bilgi"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>CTA Link</Label>
                  <Input
                    value={editingBanner.cta_link || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, cta_link: e.target.value })}
                    placeholder="/contact"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={editingBanner.image_url || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, image_url: e.target.value })}
                      placeholder="https://example.com/banner.jpg"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAssetPickerOpen(true)}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Browse
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter a URL or browse files from Storage
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select
                      value={editingBanner.position || 'hero'}
                      onValueChange={(value) => setEditingBanner({ ...editingBanner, position: value })}
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
                        <SelectItem value="popup">Popup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Page</Label>
                    <Select
                      value={editingBanner.page_slug || 'landing'}
                      onValueChange={(value) => setEditingBanner({ ...editingBanner, page_slug: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landing">Landing</SelectItem>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="features">Features</SelectItem>
                        <SelectItem value="pricing">Pricing</SelectItem>
                        <SelectItem value="contact">Contact</SelectItem>
                        <SelectItem value="all">All Pages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={editingBanner.language || 'all'}
                      onValueChange={(value: 'tr' | 'en' | 'all') => setEditingBanner({ ...editingBanner, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Languages (Tüm Diller)</SelectItem>
                        <SelectItem value="tr">Turkish Only (Sadece Türkçe)</SelectItem>
                        <SelectItem value="en">English Only (Sadece İngilizce)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Hangi dilde gösterilecek? "All" seçerseniz her iki dilde gösterilir.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Order Index (Carousel Sırası)</Label>
                    <Input
                      type="number"
                      value={editingBanner.order_index || 0}
                      onChange={(e) => setEditingBanner({ ...editingBanner, order_index: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Aynı position'daki bannerlar carousel olarak gösterilir
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={editingBanner.background_color || '#3b82f6'}
                          onChange={(e) => setEditingBanner({ ...editingBanner, background_color: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          value={editingBanner.background_color || '#3b82f6'}
                          onChange={(e) => setEditingBanner({ ...editingBanner, background_color: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={editingBanner.text_color || '#ffffff'}
                          onChange={(e) => setEditingBanner({ ...editingBanner, text_color: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          value={editingBanner.text_color || '#ffffff'}
                          onChange={(e) => setEditingBanner({ ...editingBanner, text_color: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Background Pattern</Label>
                    <Select
                      value={editingBanner.background_pattern || 'none'}
                      onValueChange={(value) => setEditingBanner({ ...editingBanner, background_pattern: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Solid Color)</SelectItem>
                        <SelectItem value="dots">Micro Dots</SelectItem>
                        <SelectItem value="grid">Circuit Grid</SelectItem>
                        <SelectItem value="waves">Soft Waves</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Patterns will be overlaid on the background color
                    </p>
                  </div>

                  {/* Pattern Preview */}
                  {editingBanner.background_pattern && editingBanner.background_pattern !== 'none' && (
                    <div className="space-y-2">
                      <Label>Pattern Preview</Label>
                      <div
                        className="h-24 rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden"
                        style={{
                          backgroundColor: editingBanner.background_color || '#3b82f6',
                        }}
                      >
                        {editingBanner.background_pattern === 'dots' && (
                          <div
                            className="absolute inset-0 opacity-10"
                            style={{
                              backgroundImage: 'url(/patterns/micro-dots.svg)',
                              backgroundSize: '20px 20px',
                              backgroundRepeat: 'repeat',
                            }}
                          />
                        )}
                        {editingBanner.background_pattern === 'grid' && (
                          <div
                            className="absolute inset-0 opacity-10"
                            style={{
                              backgroundImage: 'url(/patterns/circuit-grid.svg)',
                              backgroundSize: '60px 60px',
                              backgroundRepeat: 'repeat',
                            }}
                          />
                        )}
                        {editingBanner.background_pattern === 'waves' && (
                          <div
                            className="absolute inset-0 opacity-10"
                            style={{
                              backgroundImage: 'url(/patterns/soft-waves.svg)',
                              backgroundSize: 'cover',
                              backgroundRepeat: 'no-repeat',
                            }}
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-medium" style={{ color: editingBanner.text_color || '#ffffff' }}>
                            Pattern Preview
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Layout Settings */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-lg">Layout Settings</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Layout Type</Label>
                      <Select
                        value={editingBanner.layout_type || 'compact'}
                        onValueChange={(value: any) => setEditingBanner({ ...editingBanner, layout_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compact (Normal)</SelectItem>
                          <SelectItem value="full-width">Full Width (Medium)</SelectItem>
                          <SelectItem value="hero">Hero (Full Screen)</SelectItem>
                          <SelectItem value="custom">Custom Height</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Hero: Tam ekran boyutunda, Full Width: Orta boy, Compact: Normal
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Image Position</Label>
                      <Select
                        value={editingBanner.image_position || 'left'}
                        onValueChange={(value: any) => setEditingBanner({ ...editingBanner, image_position: value })}
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
                        Background: Resim arka planda olur, içerik üstte
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Content Alignment</Label>
                      <Select
                        value={editingBanner.content_alignment || 'center'}
                        onValueChange={(value: any) => setEditingBanner({ ...editingBanner, content_alignment: value })}
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

                    {editingBanner.layout_type === 'custom' && (
                      <div className="space-y-2">
                        <Label>Custom Height</Label>
                        <Input
                          value={editingBanner.height || '400px'}
                          onChange={(e) => setEditingBanner({ ...editingBanner, height: e.target.value })}
                          placeholder="400px, 80vh, etc."
                        />
                        <p className="text-xs text-muted-foreground">
                          Örnek: 500px, 80vh, 50rem
                        </p>
                      </div>
                    )}

                    {(editingBanner.image_position === 'background' || editingBanner.full_width_image) && (
                      <div className="space-y-2">
                        <Label>Overlay Opacity ({editingBanner.overlay_opacity || 50}%)</Label>
                        <Input
                          type="range"
                          min="0"
                          max="100"
                          value={editingBanner.overlay_opacity || 50}
                          onChange={(e) => setEditingBanner({ ...editingBanner, overlay_opacity: parseInt(e.target.value) })}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Arka plan resmi üzerindeki karartma oranı
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-4 pb-2 border-t">
                    <Switch
                      checked={editingBanner.full_width_image || false}
                      onCheckedChange={(checked) => setEditingBanner({ ...editingBanner, full_width_image: checked })}
                    />
                    <div className="space-y-1">
                      <Label className="cursor-pointer">Resmi Tam Genişlikte Göster (Full Width Image)</Label>
                      <p className="text-xs text-muted-foreground">
                        Aktif edildiğinde, resim banner'ın tüm alanını kaplar ve içerik üzerine yerleşir. Hero ve Full-Width layout'lar için idealdir.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={editingBanner.start_date || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, start_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={editingBanner.end_date || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingBanner.is_active || false}
                    onCheckedChange={(checked) => setEditingBanner({ ...editingBanner, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Banner'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {banners.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No banners yet</p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          banners.map((banner, index) => (
            <Card key={banner.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{banner.title_en}</h3>
                      {banner.is_active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      <Badge variant="outline">{banner.position}</Badge>
                      <Badge variant="outline">{banner.page_slug}</Badge>
                      <Badge
                        variant="secondary"
                        className={
                          banner.language === 'tr' ? 'bg-red-100 text-red-700' :
                          banner.language === 'en' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }
                      >
                        {banner.language === 'tr' ? 'TR' : banner.language === 'en' ? 'EN' : 'ALL'}
                      </Badge>
                    </div>
                    {banner.description_en && (
                      <p className="text-sm text-muted-foreground mb-2">{banner.description_en}</p>
                    )}
                    {banner.image_url && (
                      <div className="mt-2">
                        <img src={banner.image_url} alt={banner.title_en} className="h-20 object-cover rounded" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder(banner, 'up')}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                    )}
                    {index < banners.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder(banner, 'down')}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(banner)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(banner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Asset Picker Dialog */}
      <Dialog open={assetPickerOpen} onOpenChange={setAssetPickerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Image from Storage</DialogTitle>
            <DialogDescription>
              Choose an image from your uploaded assets
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            {storageAssets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No storage files found</p>
                <p className="text-sm">Upload files in the Assets Manager first</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {storageAssets.map((asset) => (
                  <button
                    key={asset.name}
                    type="button"
                    onClick={() => {
                      if (editingBanner) {
                        setEditingBanner({ ...editingBanner, image_url: asset.url });
                      }
                      setAssetPickerOpen(false);
                      toast.success('Image selected!');
                    }}
                    className="relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors group"
                  >
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                        Select
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                      {asset.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
