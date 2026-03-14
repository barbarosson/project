'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/admin-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Megaphone, Plus, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  target_segment?: string;
  subject?: string;
  start_date: string;
  end_date: string | null;
  budget?: number;
  created_at: string;
  tenant_id: string;
}

const TYPE_LABELS: Record<string, string> = {
  email: 'E-posta',
  discount: 'İndirim',
  announcement: 'Duyuru',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  active: 'Aktif',
  paused: 'Duraklatıldı',
  completed: 'Tamamlandı',
};

export default function AdminCampaignsPage() {
  const { profile } = useAdmin();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, [profile?.tenant_id]);

  async function fetchCampaigns() {
    try {
      setLoading(true);
      const query = supabase
        .from('campaigns')
        .select('id, name, type, status, target_segment, subject, start_date, end_date, budget, created_at, tenant_id')
        .order('created_at', { ascending: false });

      if (profile?.tenant_id) {
        query.eq('tenant_id', profile.tenant_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCampaigns((data as Campaign[]) || []);
    } catch (err: unknown) {
      console.error('Error fetching campaigns:', err);
      toast.error(err instanceof Error ? err.message : 'Kampanyalar yüklenemedi');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

  const hasTenant = !!profile?.tenant_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kampanya Yönetimi</h1>
          <p className="text-muted-foreground mt-1">
            Pazarlama kampanyalarını görüntüleyin ve yönetin
          </p>
        </div>
        {hasTenant && (
          <Button asChild>
            <Link href="/campaigns">
              <Plus className="h-4 w-4 mr-2" />
              Kampanya Oluştur
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Kampanyalar
          </CardTitle>
          <CardDescription>
            {hasTenant
              ? 'Bu tenant’a ait kampanyalar listelenir.'
              : 'Kampanya listesi için admin hesabının bir tenant’a bağlı olması gerekir.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasTenant && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 mb-4">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">
                Kampanyalar tenant bazlıdır. Bu hesapta tenant atanmamış; liste boş görünebilir.
                Kampanya oluşturmak için kullanıcı panelinden <strong>/campaigns</strong> sayfasını kullanın.
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Henüz kampanya yok</p>
              <p className="text-sm mt-1">
                {hasTenant
                  ? 'Kampanya oluşturmak için "Kampanya Oluştur" ile kullanıcı kampanya sayfasına gidin.'
                  : 'Tenant atandığında burada kampanyalar listelenecektir.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Ad</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Başlangıç</TableHead>
                    <TableHead>Bitiş</TableHead>
                    <TableHead>Bütçe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{TYPE_LABELS[c.type] ?? c.type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={c.status === 'active' ? 'default' : 'secondary'}
                          className={
                            c.status === 'completed'
                              ? 'bg-slate-500'
                              : c.status === 'draft'
                                ? 'bg-amber-500'
                                : ''
                          }
                        >
                          {STATUS_LABELS[c.status] ?? c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.start_date ? format(new Date(c.start_date), 'dd.MM.yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.end_date ? format(new Date(c.end_date), 'dd.MM.yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {c.budget != null ? `${Number(c.budget).toLocaleString('tr-TR')} ₺` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
