'use client';

import { useState } from 'react';
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
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  Shield,
  CreditCard,
  CalendarDays,
  Copy,
  Check,
} from 'lucide-react';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

export function AddUserDialog({
  open,
  onOpenChange,
  onUserCreated,
}: AddUserDialogProps) {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const [form, setForm] = useState({
    email: '',
    password: '',
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

  const resetForm = () => {
    setForm({
      email: '',
      password: '',
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
    setCreatedCredentials(null);
    setCopied(false);
  };

  const generatePassword = () => {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let pw = '';
    for (let i = 0; i < 12; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, password: pw }));
  };

  const handleCopyCredentials = async () => {
    if (!createdCredentials) return;
    const text = `E-posta: ${createdCredentials.email}\nSifre: ${createdCredentials.password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      toast.error('E-posta ve sifre zorunludur');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Sifre en az 6 karakter olmalidir');
      return;
    }

    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Oturum bulunamadi');
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            Apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            full_name: form.full_name || null,
            phone: form.phone || null,
            company_name: form.company_name || null,
            role: form.role,
            plan_name: form.plan_name,
            plan_status: form.plan_status,
            plan_expires_at: form.plan_expires_at || null,
            payment_method: form.payment_method || null,
            auto_renew: form.auto_renew,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Kullanici olusturulamadi');
      }

      setCreatedCredentials({ email: form.email, password: form.password });
      toast.success('Kullanici basariyla olusturuldu');
      onUserCreated();
    } catch (error: any) {
      toast.error(error.message || 'Bir hata olustu');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

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

  if (createdCredentials) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              Kullanici Olusturuldu
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Kullanici basariyla olusturuldu. Asagidaki giris bilgilerini
              kaydedin.
            </p>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">E-posta:</span>
                <span className="text-sm font-medium font-mono">
                  {createdCredentials.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sifre:</span>
                <span className="text-sm font-medium font-mono">
                  {createdCredentials.password}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopyCredentials}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? 'Kopyalandi' : 'Bilgileri Kopyala'}
              </Button>
              <Button className="flex-1" onClick={() => handleClose(false)}>
                Kapat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Yeni Kullanici Ekle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Hesap Bilgileri
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  E-posta *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@sirket.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Sifre *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    placeholder="En az 6 karakter"
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                    className="shrink-0 text-xs"
                  >
                    Olustur
                  </Button>
                </div>
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
                <Label
                  htmlFor="full_name"
                  className="flex items-center gap-1.5"
                >
                  <User className="h-3.5 w-3.5" />
                  Ad Soyad
                </Label>
                <Input
                  id="full_name"
                  placeholder="Adi Soyadi"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, full_name: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Telefon
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+90 5XX XXX XX XX"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="company_name"
                    className="flex items-center gap-1.5"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Sirket
                  </Label>
                  <Input
                    id="company_name"
                    placeholder="Sirket adi"
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
                  <Label
                    htmlFor="plan_expires"
                    className="flex items-center gap-1.5"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Bitis Tarihi
                  </Label>
                  <Input
                    id="plan_expires"
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
                      <SelectItem value="bank_transfer">
                        Banka Transferi
                      </SelectItem>
                      <SelectItem value="cash">Nakit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">
                    Otomatik Yenileme
                  </Label>
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
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleClose(false)}
              disabled={saving}
            >
              Iptal
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={saving || !form.email || !form.password}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Kullanici Olustur
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
