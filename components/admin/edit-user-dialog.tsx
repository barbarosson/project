'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2,
  Pencil,
  Mail,
  User,
  Phone,
  Building2,
  Shield,
  CreditCard,
  CalendarDays,
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

interface SubscriptionData {
  plan_name: string;
  status: string;
  expires_at: string | null;
  payment_method: string | null;
  auto_renew: boolean;
}

interface EditUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

const roleLabels: Record<string, string> = {
  user: 'Kullanici',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const planLabels: Record<string, string> = {
  FREE: 'Temel / Free',
  KUCUK: 'Kucuk / Small',
  ORTA: 'Orta / Medium',
  BUYUK: 'Buyuk / Large',
  ENTERPRISE: 'Kurumsal / Enterprise',
};

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onUserUpdated,
}: EditUserDialogProps) {
  const [saving, setSaving] = useState(false);
  const [loadingSub, setLoadingSub] = useState(false);
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    phone: '',
    company_name: '',
    role: 'user',
    plan_name: 'FREE',
    plan_status: 'active',
    plan_expires_at: '',
    payment_method: '',
    auto_renew: true,
  });

  useEffect(() => {
    if (user && open) {
      setForm({
        email: user.email || '',
        full_name: user.full_name || '',
        phone: user.phone || '',
        company_name: user.company_name || '',
        role: user.role || 'user',
        plan_name: 'FREE',
        plan_status: 'active',
        plan_expires_at: '',
        payment_method: '',
        auto_renew: true,
      });
      fetchSubscription(user.id);
    }
  }, [user, open]);

  const fetchSubscription = async (userId: string) => {
    try {
      setLoadingSub(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const authedClient = supabase;
      const { data } = await authedClient
        .from('user_subscriptions')
        .select('plan_name, status, expires_at, payment_method, auto_renew')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setForm((prev) => ({
          ...prev,
          plan_name: data.plan_name || 'FREE',
          plan_status: data.status || 'active',
          plan_expires_at: data.expires_at ? data.expires_at.split('T')[0] : '',
          payment_method: data.payment_method || '',
          auto_renew: data.auto_renew !== false,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    } finally {
      setLoadingSub(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.email) {
      toast.error('E-posta zorunludur');
      return;
    }

    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Oturum bulunamadi');
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/admin-update-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            Apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({
            userId: user.id,
            email: form.email !== user.email ? form.email : undefined,
            full_name: form.full_name,
            phone: form.phone,
            company_name: form.company_name,
            role: form.role !== user.role ? form.role : undefined,
            plan_name: form.plan_name,
            plan_status: form.plan_status,
            plan_expires_at: form.plan_expires_at || null,
            payment_method: form.payment_method || null,
            auto_renew: form.auto_renew,
          }),
        }
      );

      if (!response.ok) {
        let errorMsg = 'Guncelleme basarisiz';
        try {
          const err = await response.json();
          errorMsg = err.error || errorMsg;
        } catch {
          errorMsg = `Hata (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      toast.success('Kullanici bilgileri guncellendi');
      onUserUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Bir hata olustu');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <Pencil className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Kullanici Duzenle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Hesap Bilgileri
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  E-posta
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Kisisel Bilgiler
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-full_name" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Ad Soyad
                </Label>
                <Input
                  id="edit-full_name"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, full_name: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-phone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Telefon
                  </Label>
                  <Input
                    id="edit-phone"
                    placeholder="+90 5XX XXX XX XX"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-company" className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Sirket
                  </Label>
                  <Input
                    id="edit-company"
                    value={form.company_name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, company_name: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Rol ve Yetki
            </h3>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Kullanici Rolu
              </Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Uyelik Bilgileri
            </h3>
            {loadingSub ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      Plan
                    </Label>
                    <Select
                      value={form.plan_name}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, plan_name: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(planLabels).map(([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Durum</Label>
                    <Select
                      value={form.plan_status}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, plan_status: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="cancelled">Iptal Edildi</SelectItem>
                        <SelectItem value="expired">Suresi Doldu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-expires" className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Bitis Tarihi
                    </Label>
                    <Input
                      id="edit-expires"
                      type="date"
                      value={form.plan_expires_at}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          plan_expires_at: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Odeme Yontemi</Label>
                    <Select
                      value={form.payment_method || 'none'}
                      onValueChange={(v) =>
                        setForm((p) => ({
                          ...p,
                          payment_method: v === 'none' ? '' : v,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seciniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Belirtilmemis</SelectItem>
                        <SelectItem value="credit_card">Kredi Karti</SelectItem>
                        <SelectItem value="bank_transfer">Banka Transferi</SelectItem>
                        <SelectItem value="cash">Nakit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label className="text-sm font-medium">Otomatik Yenileme</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Uyelik suresi dolunca otomatik yenilensin
                    </p>
                  </div>
                  <Switch
                    checked={form.auto_renew}
                    onCheckedChange={(v) =>
                      setForm((p) => ({ ...p, auto_renew: v }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Iptal
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={saving || !form.email}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Kaydet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
