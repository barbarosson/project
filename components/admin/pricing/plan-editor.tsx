'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Save, X, Star, Zap, Crown, Rocket, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { SubscriptionPlan } from '@/app/admin/pricing/page';

interface PlanEditorProps {
  plans: SubscriptionPlan[];
  onRefresh: () => Promise<void>;
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  FREE: Zap,
  KUCUK: Star,
  ORTA: Rocket,
  BUYUK: Crown,
  ENTERPRISE: Building2,
};

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 dark:bg-gray-800 border-gray-200',
  KUCUK: 'bg-sky-50 dark:bg-sky-950 border-sky-200',
  ORTA: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200',
  BUYUK: 'bg-amber-50 dark:bg-amber-950 border-amber-200',
  ENTERPRISE: 'bg-slate-100 dark:bg-slate-800 border-slate-300',
};

interface PlanFormData {
  name: string;
  plan_code: string;
  description: string;
  price_tl: number;
  monthly_price: number;
  annual_price_tl: number;
  price_usd: number;
  annual_price_usd: number;
  discount_annual: number;
  trial_days: number;
  max_installments: number;
  setup_fee: number;
  currency: string;
  is_active: boolean;
  highlight: boolean;
  badge_text: string;
  badge_color: string;
  iyzico_plan_ref: string;
  iyzico_product_ref: string;
  iyzico_monthly_plan_ref: string;
  iyzico_annual_plan_ref: string;
}

function getDefaultFormData(plan?: SubscriptionPlan): PlanFormData {
  return {
    name: plan?.name || '',
    plan_code: plan?.plan_code || '',
    description: plan?.description || '',
    price_tl: plan?.price_tl || 0,
    monthly_price: plan?.monthly_price || 0,
    annual_price_tl: plan?.annual_price_tl || 0,
    price_usd: plan?.price_usd || 0,
    annual_price_usd: plan?.annual_price_usd || 0,
    discount_annual: plan?.discount_annual || 0,
    trial_days: plan?.trial_days || 14,
    max_installments: plan?.max_installments || 1,
    setup_fee: plan?.setup_fee || 0,
    currency: plan?.currency || 'TRY',
    is_active: plan?.is_active ?? true,
    highlight: plan?.highlight ?? false,
    badge_text: plan?.badge_text || '',
    badge_color: plan?.badge_color || '',
    iyzico_plan_ref: plan?.iyzico_plan_ref || '',
    iyzico_product_ref: plan?.iyzico_product_ref || '',
    iyzico_monthly_plan_ref: plan?.iyzico_monthly_plan_ref || '',
    iyzico_annual_plan_ref: plan?.iyzico_annual_plan_ref || '',
  };
}

export function PlanEditor({ plans, onRefresh }: PlanEditorProps) {
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(getDefaultFormData());
  const [saving, setSaving] = useState(false);

  const openEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData(getDefaultFormData(plan));
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          name: formData.name,
          plan_code: formData.plan_code,
          description: formData.description,
          price_tl: formData.price_tl,
          monthly_price: formData.monthly_price,
          annual_price_tl: formData.annual_price_tl,
          price_usd: formData.price_usd,
          annual_price_usd: formData.annual_price_usd,
          discount_annual: formData.discount_annual,
          trial_days: formData.trial_days,
          max_installments: formData.max_installments,
          setup_fee: formData.setup_fee,
          currency: formData.currency,
          is_active: formData.is_active,
          highlight: formData.highlight,
          badge_text: formData.badge_text || null,
          badge_color: formData.badge_color || null,
          iyzico_plan_ref: formData.iyzico_plan_ref || null,
          iyzico_product_ref: formData.iyzico_product_ref || null,
          iyzico_monthly_plan_ref: formData.iyzico_monthly_plan_ref || null,
          iyzico_annual_plan_ref: formData.iyzico_annual_plan_ref || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPlan.id);

      if (error) throw error;
      toast.success('Paket guncellendi');
      setEditingPlan(null);
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Kaydetme hatasi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.name] || Zap;
          const colorClass = PLAN_COLORS[plan.name] || PLAN_COLORS.FREE;

          return (
            <Card key={plan.id} className={`relative border-2 ${colorClass} transition-shadow hover:shadow-md`}>
              {plan.badge_text && (
                <div className="absolute -top-3 left-4">
                  <Badge
                    style={{ backgroundColor: plan.badge_color || '#10b981' }}
                    className="text-white text-xs"
                  >
                    {plan.badge_text}
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {!plan.is_active && (
                      <Badge variant="secondary" className="text-xs">Pasif</Badge>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block">Aylik (TL)</span>
                    <span className="font-bold text-lg">{plan.monthly_price} TL</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Yillik (TL)</span>
                    <span className="font-bold text-lg">{plan.annual_price_tl || '-'} TL</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Aylik (USD)</span>
                    <span className="font-medium">${plan.price_usd || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Yillik (USD)</span>
                    <span className="font-medium">${plan.annual_price_usd || 0}</span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Yillik Indirim</span>
                    <span className="font-medium text-foreground">%{plan.discount_annual}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deneme Suresi</span>
                    <span className="font-medium text-foreground">{plan.trial_days} gun</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maks. Taksit</span>
                    <span className="font-medium text-foreground">{plan.max_installments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>iyzico Ref</span>
                    <span className="font-medium text-foreground truncate max-w-[120px]">
                      {plan.iyzico_plan_ref || '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Paket Duzenle: {editingPlan?.name}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Paket Adi</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Paket Kodu</Label>
              <Input
                value={formData.plan_code}
                onChange={(e) => setFormData({ ...formData, plan_code: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Aciklama</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                Fiyatlandirma
              </h3>
            </div>

            <div className="space-y-2">
              <Label>Aylik Fiyat (TL)</Label>
              <Input
                type="number"
                value={formData.monthly_price}
                onChange={(e) => setFormData({ ...formData, monthly_price: +e.target.value, price_tl: +e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Yillik Fiyat (TL)</Label>
              <Input
                type="number"
                value={formData.annual_price_tl}
                onChange={(e) => setFormData({ ...formData, annual_price_tl: +e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Aylik Fiyat (USD)</Label>
              <Input
                type="number"
                value={formData.price_usd}
                onChange={(e) => setFormData({ ...formData, price_usd: +e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Yillik Fiyat (USD)</Label>
              <Input
                type="number"
                value={formData.annual_price_usd}
                onChange={(e) => setFormData({ ...formData, annual_price_usd: +e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Yillik Indirim (%)</Label>
              <Input
                type="number"
                value={formData.discount_annual}
                onChange={(e) => setFormData({ ...formData, discount_annual: +e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Kurulum Ucreti</Label>
              <Input
                type="number"
                value={formData.setup_fee}
                onChange={(e) => setFormData({ ...formData, setup_fee: +e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                Genel Ayarlar
              </h3>
            </div>

            <div className="space-y-2">
              <Label>Deneme Suresi (gun)</Label>
              <Input
                type="number"
                value={formData.trial_days}
                onChange={(e) => setFormData({ ...formData, trial_days: +e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Maks. Taksit Sayisi</Label>
              <Select
                value={String(formData.max_installments)}
                onValueChange={(v) => setFormData({ ...formData, max_installments: +v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 6, 9, 12].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n === 1 ? 'Tek Cekim' : `${n} Taksit`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Para Birimi</Label>
              <Select
                value={formData.currency}
                onValueChange={(v) => setFormData({ ...formData, currency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                Gorsel Ayarlar
              </h3>
            </div>

            <div className="space-y-2">
              <Label>Badge Metni</Label>
              <Input
                value={formData.badge_text}
                onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                placeholder="Ornek: En Populer"
              />
            </div>
            <div className="space-y-2">
              <Label>Badge Rengi</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.badge_color}
                  onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                  placeholder="#10b981"
                />
                {formData.badge_color && (
                  <div
                    className="w-10 h-10 rounded border shrink-0"
                    style={{ backgroundColor: formData.badge_color }}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label>Aktif</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.highlight}
                  onCheckedChange={(v) => setFormData({ ...formData, highlight: v })}
                />
                <Label>One Cikar</Label>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                iyzico Entegrasyonu
              </h3>
            </div>

            <div className="space-y-2">
              <Label>iyzico Product Ref</Label>
              <Input
                value={formData.iyzico_product_ref}
                onChange={(e) => setFormData({ ...formData, iyzico_product_ref: e.target.value })}
                placeholder="iyzico urun referansi"
              />
            </div>
            <div className="space-y-2">
              <Label>iyzico Plan Ref (Eski)</Label>
              <Input
                value={formData.iyzico_plan_ref}
                onChange={(e) => setFormData({ ...formData, iyzico_plan_ref: e.target.value })}
                placeholder="iyzico plan referansi"
              />
            </div>
            <div className="space-y-2">
              <Label>iyzico Aylik Plan Ref</Label>
              <Input
                value={formData.iyzico_monthly_plan_ref}
                onChange={(e) => setFormData({ ...formData, iyzico_monthly_plan_ref: e.target.value })}
                placeholder="Aylik abonelik referansi"
              />
            </div>
            <div className="space-y-2">
              <Label>iyzico Yillik Plan Ref</Label>
              <Input
                value={formData.iyzico_annual_plan_ref}
                onChange={(e) => setFormData({ ...formData, iyzico_annual_plan_ref: e.target.value })}
                placeholder="Yillik abonelik referansi"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlan(null)}>
              <X className="h-4 w-4 mr-2" />
              Iptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
