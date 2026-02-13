'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import {
  Save,
  Search,
  Check,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { SubscriptionPlan, PlanFeature, FeatureAssignment } from '@/app/admin/pricing/page';

interface FeatureManagerProps {
  plans: SubscriptionPlan[];
  features: PlanFeature[];
  assignments: FeatureAssignment[];
  onRefresh: () => Promise<void>;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Temel Moduller': 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  'Temel Modüller': 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  'Limitler': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'Ileri Ozellikler': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'İleri Özellikler': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'AI ve Otomasyon': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  'Entegrasyonlar': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'Destek': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  'Ek Ozellikler': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  'Ek Özellikler': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const AVAILABLE_CATEGORIES = [
  'Temel Modüller',
  'Limitler',
  'İleri Özellikler',
  'AI ve Otomasyon',
  'Entegrasyonlar',
  'Destek',
  'Ek Özellikler',
];

interface LocalAssignment {
  featureId: string;
  planId: string;
  enabled: boolean;
  limitValue: string;
}

interface FeatureForm {
  feature_key: string;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  category: string;
  is_limit: boolean;
}

const defaultFeatureForm: FeatureForm = {
  feature_key: '',
  name_tr: '',
  name_en: '',
  description_tr: '',
  description_en: '',
  category: 'Temel Modüller',
  is_limit: false,
};

export function FeatureManager({ plans, features, assignments, onRefresh }: FeatureManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [localChanges, setLocalChanges] = useState<Map<string, LocalAssignment>>(new Map());
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<PlanFeature | null>(null);
  const [featureForm, setFeatureForm] = useState<FeatureForm>(defaultFeatureForm);
  const [featureSaving, setFeatureSaving] = useState(false);

  const categories = useMemo(() => {
    const cats = new Map<string, PlanFeature[]>();
    features.forEach((f) => {
      const cat = f.category || 'Diger';
      if (!cats.has(cat)) cats.set(cat, []);
      cats.get(cat)!.push(f);
    });
    return cats;
  }, [features]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    const filtered = new Map<string, PlanFeature[]>();
    categories.forEach((feats, cat) => {
      const matches = feats.filter(
        (f) =>
          f.name_tr.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.feature_key.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matches.length > 0) filtered.set(cat, matches);
    });
    return filtered;
  }, [categories, searchTerm]);

  const getKey = (planId: string, featureId: string) => `${planId}:${featureId}`;

  const isEnabled = (planId: string, featureId: string) => {
    const key = getKey(planId, featureId);
    if (localChanges.has(key)) return localChanges.get(key)!.enabled;
    const existing = assignments.find((a) => a.plan_id === planId && a.feature_id === featureId);
    return existing?.enabled ?? false;
  };

  const getLimitValue = (planId: string, featureId: string) => {
    const key = getKey(planId, featureId);
    if (localChanges.has(key)) return localChanges.get(key)!.limitValue;
    const existing = assignments.find((a) => a.plan_id === planId && a.feature_id === featureId);
    return existing?.limit_value || '';
  };

  const toggleFeature = (planId: string, featureId: string) => {
    const key = getKey(planId, featureId);
    const current = isEnabled(planId, featureId);
    setLocalChanges((prev) => {
      const next = new Map(prev);
      next.set(key, {
        featureId,
        planId,
        enabled: !current,
        limitValue: getLimitValue(planId, featureId),
      });
      return next;
    });
  };

  const setLimitInputValue = (planId: string, featureId: string, value: string) => {
    const key = getKey(planId, featureId);
    setLocalChanges((prev) => {
      const next = new Map(prev);
      next.set(key, {
        featureId,
        planId,
        enabled: isEnabled(planId, featureId),
        limitValue: value,
      });
      return next;
    });
  };

  const handleSaveAll = async () => {
    if (localChanges.size === 0) {
      toast.info('Degisiklik yok');
      return;
    }

    setSaving(true);
    try {
      const upserts = Array.from(localChanges.values()).map((change) => ({
        plan_id: change.planId,
        feature_id: change.featureId,
        enabled: change.enabled,
        limit_value: change.limitValue || null,
      }));

      for (const item of upserts) {
        const existing = assignments.find(
          (a) => a.plan_id === item.plan_id && a.feature_id === item.feature_id
        );

        if (existing) {
          const { error } = await supabase
            .from('plan_feature_assignments')
            .update({ enabled: item.enabled, limit_value: item.limit_value })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('plan_feature_assignments')
            .insert(item);
          if (error) throw error;
        }
      }

      toast.success(`${upserts.length} ozellik atamasi guncellendi`);
      setLocalChanges(new Map());
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Kaydetme hatasi');
    } finally {
      setSaving(false);
    }
  };

  const openNewFeature = () => {
    setEditingFeature(null);
    const maxOrder = features.reduce((max, f) => Math.max(max, f.display_order || 0), 0);
    setFeatureForm({ ...defaultFeatureForm, feature_key: '', });
    setFeatureDialogOpen(true);
  };

  const openEditFeature = (f: PlanFeature) => {
    setEditingFeature(f);
    setFeatureForm({
      feature_key: f.feature_key,
      name_tr: f.name_tr,
      name_en: f.name_en,
      description_tr: f.description_tr || '',
      description_en: f.description_en || '',
      category: f.category,
      is_limit: f.is_limit,
    });
    setFeatureDialogOpen(true);
  };

  const handleSaveFeature = async () => {
    if (!featureForm.feature_key || !featureForm.name_tr) {
      toast.error('Ozellik kodu ve Turkce adi gerekli');
      return;
    }

    setFeatureSaving(true);
    try {
      if (editingFeature) {
        const { error } = await supabase
          .from('plan_features')
          .update({
            name_tr: featureForm.name_tr,
            name_en: featureForm.name_en,
            description_tr: featureForm.description_tr,
            description_en: featureForm.description_en,
            category: featureForm.category,
            is_limit: featureForm.is_limit,
          })
          .eq('id', editingFeature.id);
        if (error) throw error;
        toast.success('Ozellik guncellendi');
      } else {
        const maxOrder = features.reduce((max, f) => Math.max(max, f.display_order || 0), 0);
        const { error } = await supabase.from('plan_features').insert({
          feature_key: featureForm.feature_key,
          name_tr: featureForm.name_tr,
          name_en: featureForm.name_en,
          description_tr: featureForm.description_tr,
          description_en: featureForm.description_en,
          category: featureForm.category,
          is_limit: featureForm.is_limit,
          display_order: maxOrder + 10,
        });
        if (error) throw error;
        toast.success('Yeni ozellik eklendi');
      }

      setFeatureDialogOpen(false);
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Kaydetme hatasi');
    } finally {
      setFeatureSaving(false);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    const { error: assErr } = await supabase
      .from('plan_feature_assignments')
      .delete()
      .eq('feature_id', featureId);
    if (assErr) {
      toast.error(assErr.message);
      return;
    }

    const { error } = await supabase.from('plan_features').delete().eq('id', featureId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Ozellik silindi');
    await onRefresh();
  };

  const handleMoveFeature = async (feature: PlanFeature, direction: 'up' | 'down') => {
    const catFeatures = features
      .filter((f) => f.category === feature.category)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    const idx = catFeatures.findIndex((f) => f.id === feature.id);
    if (idx < 0) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= catFeatures.length) return;

    const current = catFeatures[idx];
    const swap = catFeatures[swapIdx];

    await Promise.all([
      supabase
        .from('plan_features')
        .update({ display_order: swap.display_order })
        .eq('id', current.id),
      supabase
        .from('plan_features')
        .update({ display_order: current.display_order })
        .eq('id', swap.id),
    ]);

    await onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ozellik ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openNewFeature}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ozellik
          </Button>
          {localChanges.size > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              {localChanges.size} degisiklik
            </Badge>
          )}
          <Button onClick={handleSaveAll} disabled={saving || localChanges.size === 0}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Tumu Kaydet'}
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-auto max-h-[calc(100vh-260px)]">
          <div className="min-w-[900px]">
            <div className="sticky top-0 z-10 bg-card border-b">
              <div
                className="grid"
                style={{ gridTemplateColumns: `280px 48px repeat(${plans.length}, 1fr)` }}
              >
                <div className="p-3 font-semibold text-sm">Ozellik</div>
                <div className="p-3 text-center text-xs text-muted-foreground">Sira</div>
                {plans.map((plan) => (
                  <div key={plan.id} className="p-3 text-center font-semibold text-sm border-l">
                    {plan.name}
                  </div>
                ))}
              </div>
            </div>

            {Array.from(filteredCategories.entries()).map(([category, feats]) => (
              <div key={category}>
                <div className="border-b bg-muted/30 px-3 py-2">
                  <Badge className={CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-800'}>
                    {category}
                  </Badge>
                </div>

                {feats.map((feature, featIdx) => {
                  const catFeatures = features
                    .filter((f) => f.category === feature.category)
                    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                  const posInCat = catFeatures.findIndex((f) => f.id === feature.id);

                  return (
                    <div
                      key={feature.id}
                      className="grid border-b hover:bg-muted/20 transition-colors"
                      style={{ gridTemplateColumns: `280px 48px repeat(${plans.length}, 1fr)` }}
                    >
                      <div className="p-2 px-3 flex items-center gap-2 group">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block truncate">{feature.name_tr}</span>
                          <span className="text-xs text-muted-foreground">{feature.feature_key}</span>
                        </div>
                        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => openEditFeature(feature)}
                            className="p-1 rounded hover:bg-muted"
                          >
                            <Edit className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeleteFeature(feature.id)}
                            className="p-1 rounded hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
                        </div>
                      </div>

                      <div className="p-1 flex flex-col items-center justify-center gap-0.5">
                        <button
                          onClick={() => handleMoveFeature(feature, 'up')}
                          disabled={posInCat === 0}
                          className="p-0.5 rounded hover:bg-muted disabled:opacity-20"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleMoveFeature(feature, 'down')}
                          disabled={posInCat === catFeatures.length - 1}
                          className="p-0.5 rounded hover:bg-muted disabled:opacity-20"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>

                      {plans.map((plan) => {
                        const enabled = isEnabled(plan.id, feature.id);
                        const hasChange = localChanges.has(getKey(plan.id, feature.id));

                        return (
                          <div
                            key={plan.id}
                            className={`p-2 flex flex-col items-center justify-center gap-1 border-l ${
                              hasChange ? 'bg-amber-50 dark:bg-amber-950/30' : ''
                            }`}
                          >
                            <button
                              onClick={() => toggleFeature(plan.id, feature.id)}
                              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                                enabled
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                              }`}
                            >
                              {enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </button>

                            {feature.is_limit && enabled && (
                              <Input
                                value={getLimitValue(plan.id, feature.id)}
                                onChange={(e) =>
                                  setLimitInputValue(plan.id, feature.id, e.target.value)
                                }
                                className="h-6 w-20 text-xs text-center"
                                placeholder="Limit"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? 'Ozelligi Duzenle' : 'Yeni Ozellik Ekle'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ozellik Kodu (tekil)</Label>
              <Input
                value={featureForm.feature_key}
                onChange={(e) =>
                  setFeatureForm({
                    ...featureForm,
                    feature_key: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                  })
                }
                placeholder="ornek: custom_reports"
                disabled={!!editingFeature}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turkce Adi</Label>
                <Input
                  value={featureForm.name_tr}
                  onChange={(e) => setFeatureForm({ ...featureForm, name_tr: e.target.value })}
                  placeholder="Ozel Raporlar"
                />
              </div>
              <div className="space-y-2">
                <Label>Ingilizce Adi</Label>
                <Input
                  value={featureForm.name_en}
                  onChange={(e) => setFeatureForm({ ...featureForm, name_en: e.target.value })}
                  placeholder="Custom Reports"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turkce Aciklama</Label>
                <Input
                  value={featureForm.description_tr}
                  onChange={(e) =>
                    setFeatureForm({ ...featureForm, description_tr: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ingilizce Aciklama</Label>
                <Input
                  value={featureForm.description_en}
                  onChange={(e) =>
                    setFeatureForm({ ...featureForm, description_en: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={featureForm.category}
                  onValueChange={(v) => setFeatureForm({ ...featureForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={featureForm.is_limit}
                    onCheckedChange={(v) => setFeatureForm({ ...featureForm, is_limit: v })}
                  />
                  <Label>Limit Degeri Girilir</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFeatureDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Iptal
            </Button>
            <Button onClick={handleSaveFeature} disabled={featureSaving}>
              <Save className="h-4 w-4 mr-2" />
              {featureSaving ? 'Kaydediliyor...' : editingFeature ? 'Guncelle' : 'Ekle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
