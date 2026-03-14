'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/admin-context';
import { supabase } from '@/lib/supabase';
import { UserListTable } from '@/components/admin/user-list-table';
import { UserDetailSheet } from '@/components/admin/user-detail-sheet';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Users,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Shield,
  UserPlus,
  Database,
  Trash2,
  Key,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  membership_plan?: string | null;
  created_at: string;
  updated_at: string;
}

interface UsageStats {
  [tenantId: string]: {
    invoices: number;
    customers: number;
    products: number;
    expenses: number;
  };
}

export default function AdminUsersPage() {
  const { user } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [initialAction, setInitialAction] = useState<
    'view' | 'edit' | 'resetPassword' | 'toggleActive' | null
  >(null);
  const [deleteDemoTarget, setDeleteDemoTarget] = useState<UserProfile | null>(null);
  const [deleteDemoLoading, setDeleteDemoLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkDeleteTargets, setBulkDeleteTargets] = useState<UserProfile[] | null>(null);
  const [bulkPasswordOpen, setBulkPasswordOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users || []);
      setUsageStats(data.usageStats || {});
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.is_active) ||
      (statusFilter === 'inactive' && !u.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
    admins: users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length,
  };

  const openUserWithAction = (
    u: UserProfile,
    action: 'view' | 'edit' | 'resetPassword' | 'toggleActive' | null
  ) => {
    setSelectedUser(u);
    setInitialAction(action);
    setSheetOpen(true);
  };

  const handleUserUpdated = () => {
    fetchUsers();
  };

  const handleSeedDemoData = useCallback(async (u: UserProfile) => {
    if (!u.tenant_id) {
      toast.error('Bu kullanicinin tenant_id bilgisi yok');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Oturum bulunamadi. Lutfen giris yapin.');
        return;
      }
      const response = await fetch('/api/admin/seed-demo-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tenant_id: u.tenant_id }),
      });
      const rawText = await response.text();
      let result: Record<string, unknown> = {};
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        result = { error: rawText || `HTTP ${response.status}` };
      }
      if (!response.ok) {
        const msg = (result.message as string) || (result.error as string);
        const errMsg = msg || 'Demo veri yukleme basarisiz';
        const detail = result.detail ? ` — ${result.detail}` : '';
        const steps = (result.steps as string[] | undefined);
        const stepsStr = steps?.length ? ` [Son adimlar: ${steps.slice(-4).join(' → ')}]` : '';
        throw new Error(errMsg + detail + stepsStr + (response.status ? ` (HTTP ${response.status})` : ''));
      }
      toast.success(`Demo verileri yuklendi: ${Object.entries(result.results || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
      fetchUsers();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Demo veri yukleme basarisiz');
    }
  }, []);

  const handleDeleteDemoDataConfirm = useCallback(async () => {
    if (!deleteDemoTarget?.tenant_id) return;
    try {
      setDeleteDemoLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Oturum bulunamadi. Lutfen giris yapin.');
        return;
      }
      const response = await fetch('/api/admin/delete-demo-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tenant_id: deleteDemoTarget.tenant_id }),
      });
      const rawText = await response.text();
      let result: Record<string, unknown> = {};
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        result = { error: rawText || `HTTP ${response.status}` };
      }
      if (!response.ok) {
        const msg = (result.message as string) || (result.error as string);
        throw new Error(msg || 'Demo veri silme basarisiz');
      }
      toast.success('Demo verileri silindi');
      setDeleteDemoTarget(null);
      fetchUsers();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Demo veri silme basarisiz');
    } finally {
      setDeleteDemoLoading(false);
    }
  }, [deleteDemoTarget]);

  const selectedUsers = filteredUsers.filter((u) => selectedUserIds.includes(u.id));
  const selectedWithTenant = selectedUsers.filter((u) => u.tenant_id);
  const selectedCanLoadDemo = selectedWithTenant.filter((u) => {
    const stats = usageStats[u.tenant_id!];
    return !stats || (stats.invoices + stats.customers + stats.products + stats.expenses) === 0;
  });

  const handleBulkSeedDemo = useCallback(async () => {
    if (selectedCanLoadDemo.length === 0) {
      toast.error('Secili kullanicilardan tenant_id olan ve demo verisi olmayan kullanici yok');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error('Oturum bulunamadi. Lutfen giris yapin.');
      return;
    }
    setBulkActionLoading('seed');
    let ok = 0;
    let err = 0;
    for (const u of selectedCanLoadDemo) {
      try {
        const res = await fetch('/api/admin/seed-demo-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ tenant_id: u.tenant_id }),
        });
        if (res.ok) ok++; else err++;
      } catch {
        err++;
      }
    }
    setBulkActionLoading(null);
    setSelectedUserIds([]);
    fetchUsers();
    if (ok) toast.success(`${ok} kullanici icin demo veri yuklendi`);
    if (err) toast.error(`${err} kullanici icin yukleme basarisiz`);
  }, [selectedCanLoadDemo, fetchUsers]);

  const handleBulkDeleteDemo = useCallback(() => {
    setBulkDeleteTargets(selectedWithTenant);
  }, [selectedWithTenant]);

  const handleBulkDeleteDemoConfirm = useCallback(async () => {
    if (!bulkDeleteTargets?.length) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error('Oturum bulunamadi.');
      return;
    }
    setBulkActionLoading('delete');
    let ok = 0;
    let err = 0;
    for (const u of bulkDeleteTargets) {
      if (!u.tenant_id) continue;
      try {
        const res = await fetch('/api/admin/delete-demo-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ tenant_id: u.tenant_id }),
        });
        if (res.ok) ok++; else err++;
      } catch {
        err++;
      }
    }
    setBulkActionLoading(null);
    setBulkDeleteTargets(null);
    setSelectedUserIds([]);
    fetchUsers();
    if (ok) toast.success(`${ok} kullanici icin demo verileri silindi`);
    if (err) toast.error(`${err} kullanici icin silme basarisiz`);
  }, [bulkDeleteTargets, fetchUsers]);

  const handleBulkPasswordSubmit = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error('Oturum bulunamadi.');
      return;
    }
    setBulkActionLoading('password');
    let ok = 0;
    let err = 0;
    for (const u of selectedUsers) {
      try {
        const res = await fetch('/api/admin/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: u.id }),
        });
        if (res.ok) ok++; else err++;
      } catch {
        err++;
      }
    }
    setBulkActionLoading(null);
    setBulkPasswordOpen(false);
    setSelectedUserIds([]);
    if (ok) toast.success(`${ok} kullaniciya gecici kod e-posta ile gonderildi`);
    if (err) toast.error(`${err} kullanici icin gonderim basarisiz`);
  }, [selectedUsers]);

  const handleBulkInactive = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error('Oturum bulunamadi.');
      return;
    }
    setBulkActionLoading('inactive');
    let ok = 0;
    let err = 0;
    for (const u of selectedUsers) {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ userId: u.id, updates: { is_active: false } }),
        });
        if (res.ok) ok++; else err++;
      } catch {
        err++;
      }
    }
    setBulkActionLoading(null);
    setSelectedUserIds([]);
    fetchUsers();
    if (ok) toast.success(`${ok} kullanici inaktif yapildi`);
    if (err) toast.error(`${err} kullanici guncellenemedi`);
  }, [selectedUsers, fetchUsers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Kullanici Yonetimi
          </h1>
          <p className="text-muted-foreground mt-1">
            Uygulamaya kayitli tum kullanicilari yonetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddUserOpen(true)} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Yeni Kullanici
          </Button>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Toplam Kullanici</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
                <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-sm text-muted-foreground">Inaktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-sm text-muted-foreground">Admin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Isim, e-posta veya sirket ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tum Roller</SelectItem>
                <SelectItem value="user">Kullanici</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tum Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Inaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedUserIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-3 mb-4 rounded-lg bg-muted/60 border text-sm">
              <span className="font-medium text-muted-foreground">
                <strong className="text-foreground">{selectedUserIds.length}</strong> kullanici secildi
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!bulkActionLoading || selectedCanLoadDemo.length === 0}
                  onClick={handleBulkSeedDemo}
                  className="gap-1.5"
                >
                  <Database className="h-3.5 w-3.5" />
                  Demo veri yukle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!bulkActionLoading || selectedWithTenant.length === 0}
                  onClick={handleBulkDeleteDemo}
                  className="gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Demo veri sil
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!bulkActionLoading}
                  onClick={() => setBulkPasswordOpen(true)}
                  className="gap-1.5"
                >
                  <Key className="h-3.5 w-3.5" />
                  Sifre sifirla
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!bulkActionLoading}
                  onClick={handleBulkInactive}
                  className="gap-1.5"
                >
                  <UserX className="h-3.5 w-3.5" />
                  Inaktif yap
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!!bulkActionLoading}
                  onClick={() => setSelectedUserIds([])}
                >
                  Secimi temizle
                </Button>
              </div>
            </div>
          )}

          <UserListTable
            users={filteredUsers}
            usageStats={usageStats}
            loading={loading}
            selectedUserIds={selectedUserIds}
            onSelectionChange={setSelectedUserIds}
            onViewUser={(u) => openUserWithAction(u, 'view')}
            onEditUser={(u) => openUserWithAction(u, 'edit')}
            onToggleActive={(u) => openUserWithAction(u, 'toggleActive')}
            onResetPassword={(u) => openUserWithAction(u, 'resetPassword')}
            onSeedDemoData={handleSeedDemoData}
            onDeleteDemoData={(u) => setDeleteDemoTarget(u)}
          />
        </CardContent>
      </Card>

      <UserDetailSheet
        user={selectedUser}
        usageStats={selectedUser?.tenant_id ? usageStats[selectedUser.tenant_id] : undefined}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setInitialAction(null);
        }}
        initialAction={initialAction}
        onUserUpdated={handleUserUpdated}
      />

      <AddUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onUserCreated={handleUserUpdated}
      />

      <AlertDialog open={!!deleteDemoTarget} onOpenChange={(open) => !open && setDeleteDemoTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Demo Verilerini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDemoTarget?.full_name || deleteDemoTarget?.email} kullanicisina ait tum demo verileri (musteriler, urunler, faturalar, giderler, teklifler, kampanyalar, stok hareketleri, destek talepleri, hesaplar, islemler) kalici olarak silinecek. Bu islem geri alinamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDemoLoading}>Iptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDemoDataConfirm}
              disabled={deleteDemoLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteDemoLoading ? 'Siliniyor...' : 'Evet, Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteTargets !== null && bulkDeleteTargets.length > 0} onOpenChange={(open) => !open && setBulkDeleteTargets(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Toplu Demo Veri Sil</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{bulkDeleteTargets?.length ?? 0}</strong> kullanici icin demo verileri kalici olarak silinecek. Bu islem geri alinamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!bulkActionLoading}>Iptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteDemoConfirm}
              disabled={!!bulkActionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkActionLoading === 'delete' ? 'Siliniyor...' : 'Evet, Toplu Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={bulkPasswordOpen} onOpenChange={setBulkPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Toplu Sifre Sifirla</DialogTitle>
            <DialogDescription>
              Secili {selectedUsers.length} kullanici icin sistem 8 haneli gecici kod olusturacak ve her birine e-posta ile gonderecek. Ilk giriste sifre degistirmeleri istenecek. Devam edilsin mi?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkPasswordOpen(false)}>Iptal</Button>
            <Button onClick={handleBulkPasswordSubmit} disabled={!!bulkActionLoading}>
              {bulkActionLoading === 'password' ? 'Gonderiliyor...' : 'Evet, Gecici Kod Gonder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
