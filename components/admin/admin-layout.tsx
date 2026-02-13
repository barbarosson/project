'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/admin-context';
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
  BarChart,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavigation = [
  {
    title: 'Dashboard',
    items: [
      { name: 'Overview', href: '/admin/site-commander', icon: LayoutDashboard },
      { name: 'Analytics', href: '/admin/diagnostics', icon: BarChart },
      { name: 'Activity Log', href: '/admin/activity-log', icon: Activity },
      { name: 'System Health', href: '/admin/healthcheck', icon: HeartPulse },
    ],
  },
  {
    title: 'Content Management',
    items: [
      { name: 'Site Commander', href: '/admin/site-commander', icon: Settings },
      { name: 'Banner Studio', href: '/admin/banner-studio', icon: Image },
      { name: 'Blog Manager', href: '/admin/blog', icon: FileText },
      { name: 'Help Center', href: '/admin/help-center', icon: HelpCircle },
      { name: 'Testimonials', href: '/admin/testimonials', icon: MessageSquare },
      { name: 'Translation Agent', href: '/admin/translations', icon: Languages },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { name: 'Campaigns', href: '/admin/campaigns', icon: Megaphone },
      { name: 'Coupons', href: '/admin/coupons', icon: Tag },
      { name: 'Pricing Plans', href: '/admin/pricing', icon: CreditCard },
    ],
  },
  {
    title: 'Customer Support',
    items: [
      { name: 'Live Chat', href: '/admin/live-support', icon: MessageSquare },
      { name: 'Help Desk', href: '/admin/helpdesk', icon: Ticket },
      { name: 'Demo Requests', href: '/admin/demo-requests', icon: Users },
    ],
  },
  {
    title: 'User Management',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users },
    ],
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut, isSuperAdmin, isLoading } = useAdmin();
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
          <p className="text-muted-foreground">Loading admin panel...</p>
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
          <p className="text-muted-foreground">Redirecting to login...</p>
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
                <span className="font-bold text-lg" style={{ color: '#0A2540' }}>Admin Panel</span>
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
              {adminNavigation.map((section) => (
                <div key={section.title}>
                  {!sidebarCollapsed && (
                    <h3 className="mb-2 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {section.title}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
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
                          {!sidebarCollapsed && <span>{item.name}</span>}
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
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
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
                  Super Admin
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
