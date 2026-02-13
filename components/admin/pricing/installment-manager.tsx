'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Save, Trash2, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { SubscriptionPlan } from '@/app/admin/pricing/page';

interface InstallmentManagerProps {
  plans: SubscriptionPlan[];
  onRefresh: () => Promise<void>;
}

interface InstallmentOption {
  id: string;
  plan_id: string;
  installment_count: number;
  interest_rate: number;
  total_price_tl: number | null;
  monthly_amount_tl: number | null;
  total_price_usd: number | null;
  monthly_amount_usd: number | null;
  is_active: boolean;
}

const INSTALLMENT_COUNTS = [1, 2, 3, 4, 6, 9, 12];

export function InstallmentManager({ plans, onRefresh }: InstallmentManagerProps) {
  const [options, setOptions] = useState<InstallmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plan_installment_options')
      .select('*')
      .order('installment_count');
    if (data) setOptions(data);
    if (error) toast.error('Taksit secenekleri yuklenemedi');
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      const paid = plans.find((p) => p.monthly_price > 0);
      if (paid) setSelectedPlan(paid.id);
    }
  }, [plans, selectedPlan]);

  const currentPlan = plans.find((p) => p.id === selectedPlan);
  const planOptions = options.filter((o) => o.plan_id === selectedPlan);

  const addInstallmentOption = async (count: number) => {
    if (!currentPlan) return;
    const interestRate = count === 1 ? 0 : (count - 1) * 1.5;
    const totalTL = currentPlan.monthly_price * 12 * (1 + interestRate / 100);
    const monthlyTL = totalTL / count;

    const { error } = await supabase.from('plan_installment_options').insert({
      plan_id: selectedPlan,
      installment_count: count,
      interest_rate: interestRate,
      total_price_tl: Math.round(totalTL * 100) / 100,
      monthly_amount_tl: Math.round(monthlyTL * 100) / 100,
      total_price_usd: currentPlan.annual_price_usd || null,
      monthly_amount_usd: currentPlan.annual_price_usd
        ? Math.round(((currentPlan.annual_price_usd * (1 + interestRate / 100)) / count) * 100) / 100
        : null,
      is_active: true,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${count} taksit secenegi eklendi`);
      await fetchOptions();
    }
  };

  const updateOption = async (id: string, updates: Partial<InstallmentOption>) => {
    const { error } = await supabase
      .from('plan_installment_options')
      .update(updates)
      .eq('id', id);
    if (error) toast.error(error.message);
    else {
      setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
    }
  };

  const deleteOption = async (id: string) => {
    const { error } = await supabase.from('plan_installment_options').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Taksit secenegi silindi');
      setOptions((prev) => prev.filter((o) => o.id !== id));
    }
  };

  const recalculate = (option: InstallmentOption) => {
    if (!currentPlan) return option;
    const totalTL = currentPlan.monthly_price * 12 * (1 + option.interest_rate / 100);
    const monthlyTL = totalTL / option.installment_count;
    return {
      ...option,
      total_price_tl: Math.round(totalTL * 100) / 100,
      monthly_amount_tl: Math.round(monthlyTL * 100) / 100,
    };
  };

  const handleBulkSave = async () => {
    setSaving(true);
    try {
      for (const opt of planOptions) {
        const recalced = recalculate(opt);
        await supabase
          .from('plan_installment_options')
          .update({
            interest_rate: opt.interest_rate,
            total_price_tl: recalced.total_price_tl,
            monthly_amount_tl: recalced.monthly_amount_tl,
            is_active: opt.is_active,
          })
          .eq('id', opt.id);
      }
      toast.success('Taksit secenekleri kaydedildi');
      await fetchOptions();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const existingCounts = planOptions.map((o) => o.installment_count);
  const availableCounts = INSTALLMENT_COUNTS.filter((c) => !existingCounts.includes(c));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Label className="whitespace-nowrap">Paket Sec:</Label>
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Paket secin" />
            </SelectTrigger>
            <SelectContent>
              {plans
                .filter((p) => p.monthly_price > 0)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - {p.monthly_price} TL/ay
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {availableCounts.length > 0 && (
            <Select onValueChange={(v) => addInstallmentOption(+v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Taksit Ekle..." />
              </SelectTrigger>
              <SelectContent>
                {availableCounts.map((c) => (
                  <SelectItem key={c} value={String(c)}>
                    <div className="flex items-center gap-2">
                      <Plus className="h-3 w-3" />
                      {c === 1 ? 'Tek Cekim' : `${c} Taksit`}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleBulkSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>

      {currentPlan && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {currentPlan.name} - Taksit Secenekleri
              </CardTitle>
              <Badge variant="outline">
                Baz Fiyat: {currentPlan.monthly_price} TL/ay | Yillik: {currentPlan.annual_price_tl || currentPlan.monthly_price * 12} TL
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {planOptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Bu paket icin taksit secenegi tanimlanmamis.</p>
                <p className="text-sm mt-1">Yukaridaki menuyu kullanarak taksit secenegi ekleyin.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Taksit</TableHead>
                    <TableHead>Faiz Orani (%)</TableHead>
                    <TableHead>Toplam (TL)</TableHead>
                    <TableHead>Aylik (TL)</TableHead>
                    <TableHead>Toplam (USD)</TableHead>
                    <TableHead>Aylik (USD)</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planOptions.map((opt) => {
                    const recalced = recalculate(opt);
                    return (
                      <TableRow key={opt.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {opt.installment_count === 1 ? 'Tek Cekim' : `${opt.installment_count}x`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.5"
                            value={opt.interest_rate}
                            onChange={(e) => updateOption(opt.id, { interest_rate: +e.target.value })}
                            className="w-20 h-8"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {recalced.total_price_tl?.toLocaleString('tr-TR')} TL
                        </TableCell>
                        <TableCell className="font-medium">
                          {recalced.monthly_amount_tl?.toLocaleString('tr-TR')} TL
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={opt.total_price_usd || ''}
                            onChange={(e) => updateOption(opt.id, { total_price_usd: +e.target.value || null })}
                            className="w-20 h-8"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={opt.monthly_amount_usd || ''}
                            onChange={(e) => updateOption(opt.id, { monthly_amount_usd: +e.target.value || null })}
                            className="w-20 h-8"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={opt.is_active}
                            onCheckedChange={(v) => updateOption(opt.id, { is_active: v })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteOption(opt.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
