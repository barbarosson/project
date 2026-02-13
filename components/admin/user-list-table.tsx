'use client';

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Users as UsersIcon,
  Package,
  Receipt,
} from 'lucide-react';

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

interface UsageStats {
  [tenantId: string]: {
    invoices: number;
    customers: number;
    products: number;
    expenses: number;
  };
}

interface UserListTableProps {
  users: UserProfile[];
  usageStats: UsageStats;
  loading: boolean;
  onUserSelect: (user: UserProfile) => void;
}

function getInitials(name: string | null, email: string) {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'super_admin':
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-100">Super Admin</Badge>;
    case 'admin':
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100">Admin</Badge>;
    default:
      return <Badge variant="secondary">Kullanici</Badge>;
  }
}

function getStatusBadge(isActive: boolean) {
  if (isActive) {
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 hover:bg-emerald-100">Aktif</Badge>;
  }
  return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100">Inaktif</Badge>;
}

export function UserListTable({
  users,
  usageStats,
  loading,
  onUserSelect,
}: UserListTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="py-12 text-center">
        <UsersIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground">Kullanici bulunamadi</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[280px]">Kullanici</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Kullanim</TableHead>
            <TableHead>Kayit Tarihi</TableHead>
            <TableHead>Son Giris</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const stats = u.tenant_id ? usageStats[u.tenant_id] : null;
            const totalUsage = stats
              ? stats.invoices + stats.customers + stats.products + stats.expenses
              : 0;

            return (
              <TableRow
                key={u.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onUserSelect(u)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-xs font-medium">
                        {getInitials(u.full_name, u.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {u.full_name || '-'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(u.role)}</TableCell>
                <TableCell>{getStatusBadge(u.is_active)}</TableCell>
                <TableCell>
                  {stats ? (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1" title="Faturalar">
                        <FileText className="h-3 w-3" />
                        {stats.invoices}
                      </span>
                      <span className="flex items-center gap-1" title="Musteriler">
                        <UsersIcon className="h-3 w-3" />
                        {stats.customers}
                      </span>
                      <span className="flex items-center gap-1" title="Urunler">
                        <Package className="h-3 w-3" />
                        {stats.products}
                      </span>
                      <span className="flex items-center gap-1" title="Giderler">
                        <Receipt className="h-3 w-3" />
                        {stats.expenses}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {format(new Date(u.created_at), 'dd.MM.yyyy')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {u.last_sign_in_at
                      ? format(new Date(u.last_sign_in_at), 'dd.MM.yyyy HH:mm')
                      : '-'}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
