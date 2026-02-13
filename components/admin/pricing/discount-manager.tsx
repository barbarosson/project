'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Save, X, Percent, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import type { SubscriptionPlan } from '@/app/admin/pricing/page';

interface DiscountManagerProps {
  plans: SubscriptionPlan[];
  onRefresh: () => Promise<void>;
}

interface Discount {
  id: string;
  plan_id: string | null;
  name: string;
  discount_type: string;
  discount_value: number;
  coupon_code: string | null;
  valid_from: string;
  valid_until: string | null;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  applies_to_billing: string;
  description: string | null;
  created_at: string;
}

interface DiscountForm {
  plan_id: string;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  coupon_code: string;
  valid_from: string;
  valid_until: string;
  max_uses: number;
  is_active: boolean;
  applies_to_billing: string;
}

const defaultForm: DiscountForm = {
  plan_id: '',
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 10,
  coupon_code: '',
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: '',
  max_uses: 0,
  is_active: true,
  applies_to_billing: 'both',
};

const t = {
  tr: {
    title: 'Indirim ve Kupon Yonetimi',
    subtitle: 'Paketlere ozel veya genel indirimler tanimlayabilirsiniz.',
    newDiscount: 'Yeni Indirim',
    noDiscounts: 'Henuz indirim tanimlanmamis.',
    discountName: 'Indirim Adi',
    package: 'Paket',
    typeValue: 'Tip / Deger',
    couponCode: 'Kupon Kodu',
    period: 'Donem',
    usage: 'Kullanim',
    validity: 'Gecerlilik',
    status: 'Durum',
    allPackages: 'Tum Paketler',
    monthly: 'Aylik',
    annual: 'Yillik',
    all: 'Tumu',
    unlimited: 'Sinirsiz',
    editDiscount: 'Indirimi Duzenle',
    createDiscount: 'Yeni Indirim Olustur',
    description: 'Aciklama',
    descPlaceholder: 'Indirim aciklamasi...',
    namePlaceholder: 'Ornek: Yaz Kampanyasi',
    billingPeriod: 'Fatura Donemi',
    onlyMonthly: 'Sadece Aylik',
    onlyAnnual: 'Sadece Yillik',
    discountType: 'Indirim Tipi',
    percentage: 'Yuzdesel (%)',
    fixedAmount: 'Sabit Tutar (TL)',
    discountRate: 'Indirim Orani (%)',
    discountAmount: 'Indirim Tutari (TL)',
    couponCodeLabel: 'Kupon Kodu',
    generate: 'Olustur',
    emptyOptional: 'Bos birakilabilir',
    startDate: 'Baslangic Tarihi',
    endDate: 'Bitis Tarihi',
    maxUses: 'Maks. Kullanim (0 = Sinirsiz)',
    active: 'Aktif',
    cancel: 'Iptal',
    saving: 'Kaydediliyor...',
    update: 'Guncelle',
    create: 'Olustur',
    loadError: 'Indirimler yuklenemedi',
    nameRequired: 'Indirim adi gerekli',
    updated: 'Indirim guncellendi',
    created: 'Indirim olusturuldu',
    saveError: 'Kaydetme hatasi',
    deleted: 'Indirim silindi',
  },
  en: {
    title: 'Discount & Coupon Management',
    subtitle: 'Define plan-specific or general discounts.',
    newDiscount: 'New Discount',
    noDiscounts: 'No discounts defined yet.',
    discountName: 'Discount Name',
    package: 'Package',
    typeValue: 'Type / Value',
    couponCode: 'Coupon Code',
    period: 'Period',
    usage: 'Usage',
    validity: 'Validity',
    status: 'Status',
    allPackages: 'All Plans',
    monthly: 'Monthly',
    annual: 'Annual',
    all: 'All',
    unlimited: 'Unlimited',
    editDiscount: 'Edit Discount',
    createDiscount: 'Create New Discount',
    description: 'Description',
    descPlaceholder: 'Discount description...',
    namePlaceholder: 'e.g. Summer Campaign',
    billingPeriod: 'Billing Period',
    onlyMonthly: 'Monthly Only',
    onlyAnnual: 'Annual Only',
    discountType: 'Discount Type',
    percentage: 'Percentage (%)',
    fixedAmount: 'Fixed Amount (TL)',
    discountRate: 'Discount Rate (%)',
    discountAmount: 'Discount Amount (TL)',
    couponCodeLabel: 'Coupon Code',
    generate: 'Generate',
    emptyOptional: 'Optional',
    startDate: 'Start Date',
    endDate: 'End Date',
    maxUses: 'Max Uses (0 = Unlimited)',
    active: 'Active',
    cancel: 'Cancel',
    saving: 'Saving...',
    update: 'Update',
    create: 'Create',
    loadError: 'Failed to load discounts',
    nameRequired: 'Discount name is required',
    updated: 'Discount updated',
    created: 'Discount created',
    saveError: 'Save failed',
    deleted: 'Discount deleted',
  },
};

export function DiscountManager({ plans, onRefresh }: DiscountManagerProps) {
  const { language } = useLanguage();
  const l = t[language];
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DiscountForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plan_discounts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setDiscounts(data);
    if (error) toast.error(l.loadError);
    setLoading(false);
  }, [l.loadError]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const openNew = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (d: Discount) => {
    setEditingId(d.id);
    setForm({
      plan_id: d.plan_id || '',
      name: d.name,
      description: d.description || '',
      discount_type: d.discount_type,
      discount_value: d.discount_value,
      coupon_code: d.coupon_code || '',
      valid_from: d.valid_from?.split('T')[0] || '',
      valid_until: d.valid_until?.split('T')[0] || '',
      max_uses: d.max_uses,
      is_active: d.is_active,
      applies_to_billing: d.applies_to_billing || 'both',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error(l.nameRequired);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        plan_id: form.plan_id || null,
        name: form.name,
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        coupon_code: form.coupon_code || null,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
        max_uses: form.max_uses,
        is_active: form.is_active,
        applies_to_billing: form.applies_to_billing,
      };

      if (editingId) {
        const { error } = await supabase
          .from('plan_discounts')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success(l.updated);
      } else {
        const { error } = await supabase.from('plan_discounts').insert(payload);
        if (error) throw error;
        toast.success(l.created);
      }

      setDialogOpen(false);
      await fetchDiscounts();
    } catch (err: any) {
      toast.error(err.message || l.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('plan_discounts').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success(l.deleted);
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from('plan_discounts')
      .update({ is_active: active })
      .eq('id', id);
    if (error) toast.error(error.message);
    else {
      setDiscounts((prev) => prev.map((d) => (d.id === id ? { ...d, is_active: active } : d)));
    }
  };

  const getPlanName = (planId: string | null) => {
    if (!planId) return l.allPackages;
    return plans.find((p) => p.id === planId)?.name || '-';
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setForm({ ...form, coupon_code: code });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{l.title}</h3>
          <p className="text-sm text-muted-foreground">{l.subtitle}</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          {l.newDiscount}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {discounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Percent className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{l.noDiscounts}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{l.discountName}</TableHead>
                  <TableHead>{l.package}</TableHead>
                  <TableHead>{l.typeValue}</TableHead>
                  <TableHead>{l.couponCode}</TableHead>
                  <TableHead>{l.period}</TableHead>
                  <TableHead>{l.usage}</TableHead>
                  <TableHead>{l.validity}</TableHead>
                  <TableHead>{l.status}</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{d.name}</span>
                        {d.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {d.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getPlanName(d.plan_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">
                        {d.discount_type === 'percentage' ? `%${d.discount_value}` : `${d.discount_value} TL`}
                      </span>
                    </TableCell>
                    <TableCell>
                      {d.coupon_code ? (
                        <Badge variant="secondary" className="font-mono text-xs">
                          {d.coupon_code}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {d.applies_to_billing === 'monthly'
                          ? l.monthly
                          : d.applies_to_billing === 'annual'
                            ? l.annual
                            : l.all}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {d.current_uses}/{d.max_uses === 0 ? l.unlimited : d.max_uses}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {d.valid_from && <div>{format(new Date(d.valid_from), 'dd.MM.yyyy')}</div>}
                        {d.valid_until && (
                          <div className="text-muted-foreground">
                            - {format(new Date(d.valid_until), 'dd.MM.yyyy')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={d.is_active}
                        onCheckedChange={(v) => toggleActive(d.id, v)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(d.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? l.editDiscount : l.createDiscount}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{l.discountName}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={l.namePlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label>{l.description}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder={l.descPlaceholder}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{l.package}</Label>
                <Select
                  value={form.plan_id || 'all'}
                  onValueChange={(v) => setForm({ ...form, plan_id: v === 'all' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{l.allPackages}</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{l.billingPeriod}</Label>
                <Select
                  value={form.applies_to_billing}
                  onValueChange={(v) => setForm({ ...form, applies_to_billing: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">{l.all}</SelectItem>
                    <SelectItem value="monthly">{l.onlyMonthly}</SelectItem>
                    <SelectItem value="annual">{l.onlyAnnual}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{l.discountType}</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(v) => setForm({ ...form, discount_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{l.percentage}</SelectItem>
                    <SelectItem value="fixed">{l.fixedAmount}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {form.discount_type === 'percentage' ? l.discountRate : l.discountAmount}
                </Label>
                <Input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: +e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{l.couponCodeLabel}</Label>
              <div className="flex gap-2">
                <Input
                  value={form.coupon_code}
                  onChange={(e) => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })}
                  placeholder={l.emptyOptional}
                  className="font-mono"
                />
                <Button variant="outline" type="button" onClick={generateCouponCode}>
                  <Tag className="h-4 w-4 mr-1" />
                  {l.generate}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{l.startDate}</Label>
                <Input
                  type="date"
                  value={form.valid_from}
                  onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{l.endDate}</Label>
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{l.maxUses}</Label>
                <Input
                  type="number"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: +e.target.value })}
                />
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                  <Label>{l.active}</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              {l.cancel}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? l.saving : editingId ? l.update : l.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
