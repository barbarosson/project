'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/admin-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Image, Palette, Type, Settings, FolderOpen, FileText } from 'lucide-react';
import { ThemeSettings } from '@/components/admin/theme-settings';
import { BannerManager } from '@/components/admin/banner-manager';
import { DesignController } from '@/components/admin/design-controller';
import { AdvancedSiteSettings } from '@/components/admin/advanced-site-settings';
import TypographyController from '@/components/admin/typography-controller';
import AssetsManager from '@/components/admin/assets-manager';
import { ContentEditor } from '@/components/admin/content-editor';

export default function SiteCommanderPage() {
  const router = useRouter();
  const { profile, isSuperAdmin } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('banners');

  useEffect(() => {
    const savedTab = sessionStorage.getItem('siteCommander_activeTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/dashboard');
      return;
    }
    setLoading(false);
  }, [isSuperAdmin, router]);

  useEffect(() => {
    sessionStorage.setItem('siteCommander_activeTab', activeTab);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#2ECC71]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Site Commander</h1>
            <p className="text-gray-500 mt-1">
              Manage content, banners, themes, typography, and site design
            </p>
          </div>
          <Badge className="bg-[#2ECC71]">Admin Tools</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto">
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="banners" className="gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Banners</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Theme</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="gap-2">
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Typography</span>
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Design</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Assets</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <ContentEditor />
        </TabsContent>

        <TabsContent value="banners" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Banner Management</CardTitle>
              <CardDescription>
                Create and manage promotional banners across your site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BannerManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Customize your site's color scheme and branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography Controller</CardTitle>
              <CardDescription>
                Customize fonts, sizes, and text styles across your site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TypographyController />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Design Controller</CardTitle>
              <CardDescription>
                Fine-tune visual styles, spacing, and UI elements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DesignController />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assets Manager</CardTitle>
              <CardDescription>
                Upload and manage images, logos, and other media files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssetsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure SEO, meta tags, and other advanced options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedSiteSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
