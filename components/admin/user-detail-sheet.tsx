'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Shield,
  Key,
  UserCheck,
  UserX,
  FileText,
  Users as UsersIcon,
  Package,
  Receipt,
  Loader2,
  Database,
  Pencil,
} from 'lucide-react';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  tenant_id: string | null;
  is_active: boolean;
  last_sign_in_at: string | null;
  phone: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

interface UsageStatsData {
  invoices: number;
  customers: number;
  products: number;
  expenses: number;
}

interface UserDetailSheetProps {
  user: UserProfile | null;
  usageStats?: UsageStatsData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export function UserDetailSheet({
  user,
  usageStats,
  open,
  onOpenChange,
  onUserUpdated,
}: UserDetailSheetProps) {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!user) return null;

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const handleToggleActive = async () => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          updates: { is_active: !user.is_active },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update user');
      }

      toast.success(
        user.is_active
          ? 'Kullanici inaktif yapildi'
          : 'Kullanici aktif yapildi'
      );
      setStatusDialogOpen(false);
      onUserUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Islem basarisiz');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Sifre en az 6 karakter olmalidir');
      return;
    }

    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/admin-reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            Apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({
            userId: user.id,
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        let errorMsg = 'Sifre sifirlama basarisiz';
        try {
          const err = await response.json();
          errorMsg = err.error || errorMsg;
        } catch {
          errorMsg = `Hata (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      toast.success('Sifre basariyla sifirlandi');
      setPasswordDialogOpen(false);
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Sifre sifirlama basarisiz');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDemoData = async () => {
    if (!user.tenant_id) {
      toast.error('Bu kullanicinin tenant_id bilgisi yok');
      return;
    }

    try {
      setSeeding(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/seed-demo-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            Apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({ tenant_id: user.tenant_id }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        const detail = result.detail ? ` (${result.detail})` : '';
        const stepsInfo = result.steps?.length ? ` [Son adim: ${result.steps[result.steps.length - 1]}]` : '';
        console.error('Demo seed error:', result);
        throw new Error((result.error || 'Demo veri yukleme basarisiz') + detail + stepsInfo);
      }

      toast.success(`Demo verileri yuklendi: ${Object.entries(result.results || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
      setSeedDialogOpen(false);
      onUserUpdated();
    } catch (error: any) {
      console.error('Demo seed full error:', error);
      toast.error(error.message || 'Demo veri yukleme basarisiz');
    } finally {
      setSeeding(false);
    }
  };

  const usageItems = [
    { label: 'Faturalar', value: usageStats?.invoices || 0, icon: FileText, color: 'text-blue-600' },
    { label: 'Musteriler', value: usageStats?.customers || 0, icon: UsersIcon, color: 'text-emerald-600' },
    { label: 'Urunler', value: usageStats?.products || 0, icon: Package, color: 'text-orange-600' },
    { label: 'Giderler', value: usageStats?.expenses || 0, icon: Receipt, color: 'text-red-600' },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-lg font-semibold">
                  {getInitials(user.full_name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <SheetTitle className="text-xl truncate">
                  {user.full_name || user.email}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  {user.role === 'super_admin' && (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-100">
                      Super Admin
                    </Badge>
                  )}
                  {user.role === 'admin' && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100">
                      Admin
                    </Badge>
                  )}
                  {user.role === 'user' && (
                    <Badge variant="secondary">Kullanici</Badge>
                  )}
                  {user.is_active ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 hover:bg-emerald-100">
                      Aktif
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100">
                      Inaktif
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Iletisim Bilgileri
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                {user.company_name && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{user.company_name}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Uyelik Bilgileri
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm">Rol</span>
                    <span className="text-sm font-medium capitalize">{user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Kullanici'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm">Kayit Tarihi</span>
                    <span className="text-sm font-medium">
                      {format(new Date(user.created_at), 'dd.MM.yyyy HH:mm')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm">Son Giris</span>
                    <span className="text-sm font-medium">
                      {user.last_sign_in_at
                        ? format(new Date(user.last_sign_in_at), 'dd.MM.yyyy HH:mm')
                        : 'Henuz giris yapilmadi'}
                    </span>
                  </div>
                </div>
                {user.tenant_id && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex items-center justify-between flex-1">
                      <span className="text-sm">Tenant ID</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {user.tenant_id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Kullanim Detaylari
              </h3>
              {usageStats ? (
                <div className="grid grid-cols-2 gap-3">
                  {usageItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <item.icon className={`h-5 w-5 ${item.color} shrink-0`} />
                      <div>
                        <p className="text-lg font-bold leading-none">{item.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Bu kullanici icin kullanim verisi bulunmuyor
                </p>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Islemler
              </h3>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Bilgileri Duzenle
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Sifre Sifirla
                </Button>
                <Button
                  variant={user.is_active ? 'destructive' : 'default'}
                  className="justify-start"
                  onClick={() => setStatusDialogOpen(true)}
                >
                  {user.is_active ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Inaktif Yap
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Aktif Yap
                    </>
                  )}
                </Button>
                {user.tenant_id && (
                  <Button
                    variant="outline"
                    className="justify-start border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950"
                    onClick={() => setSeedDialogOpen(true)}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Demo Veri Yukle
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={passwordDialogOpen} onOpenChange={(open) => {
        if (!open) setNewPassword('');
        setPasswordDialogOpen(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sifre Sifirla</AlertDialogTitle>
            <AlertDialogDescription>
              {user.full_name || user.email} icin yeni sifre belirleyin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="new-password" className="text-sm font-medium">
              Yeni Sifre
            </Label>
            <Input
              id="new-password"
              type="text"
              placeholder="En az 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Iptal
            </AlertDialogCancel>
            <Button
              onClick={handleResetPassword}
              disabled={saving || newPassword.length < 6}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sifreyi Sifirla
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.is_active ? 'Kullaniciyi Inaktif Yap' : 'Kullaniciyi Aktif Yap'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.is_active
                ? `${user.full_name || user.email} hesabini inaktif yapmak istediginizden emin misiniz? Kullanici sisteme giris yapamayacaktir.`
                : `${user.full_name || user.email} hesabini tekrar aktif yapmak istediginizden emin misiniz?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              disabled={saving}
              className={user.is_active ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {user.is_active ? 'Inaktif Yap' : 'Aktif Yap'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Demo Veri Yukle</AlertDialogTitle>
            <AlertDialogDescription>
              {user.full_name || user.email} kullanicisinin hesabina ornek veriler yuklenecektir.
              Bu islem tum ana tablolara (musteriler, urunler, faturalar, giderler, teklifler, kampanyalar, stok hareketleri, destek talepleri, hesaplar, islemler) 10&apos;ar adet ornek kayit ekler.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSeedDemoData}
              disabled={seeding}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {seeding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {seeding ? 'Yukleniyor...' : 'Verileri Yukle'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditUserDialog
        user={user}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUserUpdated={() => {
          onUserUpdated();
          onOpenChange(false);
        }}
      />
    </>
  );
}
