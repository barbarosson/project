'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Link2, Loader2, Plus, Trash2, ExternalLink, Upload, FolderOpen } from 'lucide-react';

interface Asset {
  id: string;
  title: string;
  url: string;
  type: 'banner' | 'storage' | 'logo';
  alt_text?: string;
  created_at: string;
  storage_path?: string;
}

export default function AssetsManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    title: '',
    url: '',
    type: 'storage',
    alt_text: '',
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);

      // Fetch CMS banners
      const { data: bannerData, error: bannerError } = await supabase
        .from('cms_banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (bannerError) {
        console.error('Fetch banners error:', bannerError);
        throw bannerError;
      }

      // Fetch storage files
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('assets')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (storageError) {
        console.error('Fetch storage error:', storageError);
      }

      // Transform banners
      const transformedBanners: Asset[] = (bannerData || []).map((banner: any) => ({
        id: banner.id,
        title: banner.title_en || banner.title,
        url: banner.image_url,
        type: 'banner' as const,
        alt_text: banner.alt_text,
        created_at: banner.created_at,
      }));

      // Transform storage files
      const transformedStorage: Asset[] = (storageData || []).map((file: any) => {
        const { data: publicUrl } = supabase.storage
          .from('assets')
          .getPublicUrl(file.name);

        return {
          id: file.id || file.name,
          title: file.name,
          url: publicUrl.publicUrl,
          type: 'storage' as const,
          alt_text: file.name,
          created_at: file.created_at,
          storage_path: file.name,
        };
      });

      // Combine and sort by date
      const allAssets = [...transformedBanners, ...transformedStorage].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAssets(allAssets);
    } catch (error: any) {
      console.error('Error fetching assets:', error);
      const errorMessage = error?.message || 'Failed to load assets';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_log').insert({
          user_id: user.id,
          action: 'create',
          table_name: 'storage_assets',
          changes: { file_name: fileName },
        });
      }

      toast.success('File uploaded successfully!');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchAssets();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      const errorMessage = error?.message || 'Failed to upload file';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleAddAsset = async () => {
    if (!newAsset.title || !newAsset.url) {
      toast.error('Title and URL are required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('cms_banners').insert([{
        title: newAsset.title,
        title_en: newAsset.title,
        title_tr: newAsset.title,
        image_url: newAsset.url,
        alt_text: newAsset.alt_text || newAsset.title,
        button_text: '',
        button_url: '',
        is_active: true,
        order_index: assets.length,
      }]);

      if (error) {
        console.error('Add asset error:', error);
        throw error;
      }

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_log').insert({
          user_id: user.id,
          action: 'create',
          table_name: 'cms_banners',
          changes: { asset: newAsset },
        });
      }

      toast.success('Asset added successfully!');
      setDialogOpen(false);
      setNewAsset({ title: '', url: '', type: 'storage', alt_text: '' });
      fetchAssets();
    } catch (error: any) {
      console.error('Error adding asset:', error);
      const errorMessage = error?.message || 'Failed to add asset';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsset = async (asset: Asset) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      if (asset.type === 'storage' && asset.storage_path) {
        // Delete from storage
        const { error } = await supabase.storage
          .from('assets')
          .remove([asset.storage_path]);

        if (error) {
          console.error('Delete storage error:', error);
          throw error;
        }
      } else {
        // Delete from cms_banners
        const { error } = await supabase
          .from('cms_banners')
          .delete()
          .eq('id', asset.id);

        if (error) {
          console.error('Delete asset error:', error);
          throw error;
        }
      }

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_log').insert({
          user_id: user.id,
          action: 'delete',
          table_name: asset.type === 'storage' ? 'storage_assets' : 'cms_banners',
          record_id: asset.id,
        });
      }

      toast.success('Asset deleted successfully!');
      fetchAssets();
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      const errorMessage = error?.message || 'Failed to delete asset';
      toast.error(errorMessage);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const AssetCard = ({ asset }: { asset: Asset }) => (
    <Card key={asset.id}>
      <CardContent className="p-4">
        <div className="aspect-video relative rounded-lg overflow-hidden bg-muted mb-3">
          <img
            src={asset.url}
            alt={asset.alt_text || asset.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <span className={`text-xs px-2 py-1 rounded ${
              asset.type === 'storage' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
            }`}>
              {asset.type === 'storage' ? 'Storage' : 'CMS'}
            </span>
          </div>
        </div>
        <h3 className="font-semibold text-sm mb-1 truncate" title={asset.title}>
          {asset.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {new Date(asset.created_at).toLocaleDateString()}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => copyToClipboard(asset.url)}
          >
            <Link2 className="h-3 w-3 mr-1" />
            Copy URL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(asset.url, '_blank')}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteAsset(asset)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Assets Manager
            </CardTitle>
            <CardDescription>
              Manage banners, images, and logos from Supabase Storage and CMS
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setUploadDialogOpen(true)} variant="default">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add URL
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Assets ({assets.length})</TabsTrigger>
            <TabsTrigger value="storage">
              Storage Files ({assets.filter(a => a.type === 'storage').length})
            </TabsTrigger>
            <TabsTrigger value="banner">
              CMS Banners ({assets.filter(a => a.type === 'banner').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}

              {assets.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No assets found</p>
                  <p className="text-sm">Upload files or add URLs to get started!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="storage" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets
                .filter((a) => a.type === 'storage')
                .map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              {assets.filter((a) => a.type === 'storage').length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No storage files yet</p>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First File
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="banner" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets
                .filter((a) => a.type === 'banner')
                .map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              {assets.filter((a) => a.type === 'banner').length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No CMS banners yet</p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Banner
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File to Storage</DialogTitle>
            <DialogDescription>
              Upload images to Supabase Storage. Files will be automatically available in assets.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select Image File</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: JPEG, PNG, GIF, WebP, SVG (Max 10MB)
              </p>
            </div>

            {previewUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="aspect-video relative rounded-lg overflow-hidden bg-muted border-2 border-dashed">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUploadDialogOpen(false);
              setSelectedFile(null);
              setPreviewUrl('');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}>
              Cancel
            </Button>
            <Button onClick={handleUploadFile} disabled={uploading || !selectedFile}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add URL Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Asset by URL</DialogTitle>
            <DialogDescription>
              Add an external image URL to your asset library
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newAsset.title}
                onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })}
                placeholder="e.g., Blue Banner"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Image URL</Label>
              <Input
                id="url"
                value={newAsset.url}
                onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alt_text">Alt Text (Optional)</Label>
              <Input
                id="alt_text"
                value={newAsset.alt_text}
                onChange={(e) => setNewAsset({ ...newAsset, alt_text: e.target.value })}
                placeholder="Description for accessibility"
              />
            </div>

            {newAsset.url && (
              <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={newAsset.url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAsset} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Asset'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
