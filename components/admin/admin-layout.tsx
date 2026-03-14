'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAdmin } from '@/contexts/admin-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Shield,
  Settings,
  FileText,
  Image,
  MessageSquare,
  Users,
  LayoutDashboard,
  HelpCircle,
  Package,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Palette,
  CreditCard,
  Megaphone,
  Ticket,
  Tag,
  BookOpen,
  Activity,
  Languages,
  HeartPulse,
  FolderOpen,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavigationConfig = [
  {
    sectionKey: 'dashboard' as const,
    items: [
      { key: 'overview' as const, href: '/admin/site-commander', icon: LayoutDashboard },
      { key: 'activityLog' as const, href: '/admin/activity-log', icon: Activity },
      { key: 'systemHealth' as const, href: '/admin/healthcheck', icon: HeartPulse },
    ],
  },
  {
    sectionKey: 'contentManagement' as const,
    items: [
      { key: 'siteCommander' as const, href: '/admin/site-commander', icon: Settings, descKey: 'siteCommander' as const },
      { key: 'contentSections' as const, href: '/admin/site-commander?tab=content', icon: FileText, descKey: 'contentSections' as const },
      { key: 'bannerStudio' as const, href: '/admin/banner-studio', icon: Image, descKey: 'bannerStudio' as const },
      { key: 'blog' as const, href: '/admin/blog', icon: BookOpen, descKey: 'blog' as const },
      { key: 'helpCenter' as const, href: '/admin/help-center', icon: HelpCircle, descKey: 'helpCenter' as const },
      { key: 'testimonials' as const, href: '/admin/testimonials', icon: MessageSquare, descKey: 'testimonials' as const },
      { key: 'translations' as const, href: '/admin/translations', icon: Languages, descKey: 'translations' as const },
      { key: 'mediaLibrary' as const, href: '/admin/site-commander?tab=assets', icon: FolderOpen, descKey: 'mediaLibrary' as const },
    ],
  },
  {
    sectionKey: 'marketing' as const,
    items: [
      { key: 'campaigns' as const, href: '/admin/campaigns', icon: Megaphone },
      { key: 'coupons' as const, href: '/admin/coupons', icon: Tag },
      { key: 'pricingPlans' as const, href: '/admin/pricing', icon: CreditCard },
    ],
  },
  {
    sectionKey: 'customerSupport' as const,
    items: [
      { key: 'liveChat' as const, href: '/admin/live-support', icon: MessageSquare },
      { key: 'helpDesk' as const, href: '/admin/helpdesk', icon: Ticket },
      { key: 'demoRequests' as const, href: '/admin/demo-requests', icon: Users },
    ],
  },
  {
    sectionKey: 'userManagement' as const,
    items: [
      { key: 'users' as const, href: '/admin/users', icon: Users },
    ],
  },
];

function getTabFromHref(href: string): string | null {
  try {
    return new URL(href, 'https://a').searchParams.get('tab');
  } catch {
    return null;
  }
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile, signOut, isSuperAdmin, isLoading } = useAdmin();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  console.log('🔵 [AdminLayout] Render state:', { isLoading, hasProfile: !!profile, isSuperAdmin });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 animate-pulse" style={{ color: '#00D4AA' }} />
          <p className="text-muted-foreground">{t.adminNav.loading}</p>
        </div>
      </div>
    );
  }

  if (!isLoading && !profile) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t.adminNav.redirecting}</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6" style={{ color: '#00D4AA' }} />
                <span className="font-bold text-lg" style={{ color: '#0A2540' }}>{t.adminNav.adminPanel}</span>
              </div>
            )}
            {sidebarCollapsed && (
              <Shield className="h-6 w-6 mx-auto" style={{ color: '#00D4AA' }} />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronLeft
                className={cn(
                  'h-4 w-4 transition-transform',
                  sidebarCollapsed && 'rotate-180'
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-6">
              {adminNavigationConfig.map((section) => (
                <div key={section.sectionKey}>
                  {!sidebarCollapsed && (
                    <h3 className="mb-2 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t.adminNav.sections[section.sectionKey]}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const itemTab = getTabFromHref(item.href);
                      const currentTab = searchParams.get('tab');
                      const isActive = pathname === '/admin/site-commander'
                        ? (itemTab == null ? !currentTab : currentTab === itemTab)
                        : pathname === item.href;
                      const title = 'descKey' in item && item.descKey && t.adminNav.descriptions[item.descKey]
                        ? t.adminNav.descriptions[item.descKey]
                        : t.adminNav.items[item.key];
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={title}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            isActive
                              ? 'text-white'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                            sidebarCollapsed && 'justify-center'
                          )}
                          style={isActive ? { background: 'linear-gradient(135deg, #0A2540 0%, #0D3158 100%)' } : {}}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!sidebarCollapsed && <span>{t.adminNav.items[item.key]}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs text-white" style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0D3158 100%)' }}>
                      {profile ? getInitials(profile.full_name, profile.email) : 'A'}
                    </AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <div className="flex flex-col items-start text-left overflow-hidden">
                      <span className="text-sm font-medium truncate w-full">
                        {profile?.full_name || profile?.email}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {profile?.role}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t.adminNav.adminAccount}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.adminNav.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <div className={cn('lg:pl-64 transition-all duration-300', sidebarCollapsed && 'lg:pl-16')}>
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <div className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded text-xs font-medium">
                  {t.sidebar.superAdmin}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
