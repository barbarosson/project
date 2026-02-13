'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Save, X, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/language-context';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  applies_to_plans: string[];
  is_active: boolean;
  created_at: string;
}

const SUBSCRIPTION_PLANS = ['FREE', 'KUCUK', 'ORTA', 'BUYUK', 'ENTERPRISE'];

const texts = {
  tr: {
    title: 'Kupon Yonetimi',
    subtitle: 'Indirim kuponlari olusturun ve yonetin',
    editCoupon: 'Kuponu Duzenle',
    createCoupon: 'Yeni Kupon Olustur',
    couponCode: 'Kupon Kodu',
    generate: 'Olustur',
    description: 'Aciklama',
    descPlaceholder: 'Tum paketlerde %20 indirim',
    discountType: 'Indirim Tipi',
    percentage: 'Yuzdesel',
    fixedAmount: 'Sabit Tutar',
    discountValue: 'Indirim Degeri',
    maxUses: 'Maks. Kullanim',
    maxUsesPlaceholder: 'Sinirsiz',
    validFrom: 'Gecerlilik Baslangici',
    validUntil: 'Gecerlilik Bitisi',
    appliesToPlans: 'Gecerli Paketler',
    active: 'Aktif',
    save: 'Kaydet',
    update: 'Guncelle',
    create: 'Olustur',
    cancel: 'Iptal',
    allCoupons: 'Tum Kuponlar',
    code: 'Kod',
    discount: 'Indirim',
    usage: 'Kullanim',
    validUntilCol: 'Gecerlilik',
    status: 'Durum',
    actions: 'Islemler',
    loading: 'Yukleniyor...',
    noCoupons: 'Henuz kupon yok. Ilk kuponunuzu olusturun!',
    inactive: 'Inaktif',
    expired: 'Suresi Dolmus',
    maxedOut: 'Limit Doldu',
    noExpiry: 'Suresi yok',
    copied: 'Kupon kodu panoya kopyalandi',
    deleteTitle: 'Kuponu Sil',
    deleteDesc: 'Bu kuponu silmek istediginizden emin misiniz? Bu islem geri alinamaz.',
    codeRequired: 'Kupon kodu giriniz',
    updateSuccess: 'Kupon guncellendi',
    createSuccess: 'Kupon olusturuldu',
    saveFail: 'Kupon kaydedilemedi',
    deleteSuccess: 'Kupon silindi',
    deleteFail: 'Kupon silinemedi',
    loadFail: 'Kuponlar yuklenemedi',
    coupon: 'Kupon',
  },
  en: {
    title: 'Coupon Manager',
    subtitle: 'Create and manage discount coupons',
    editCoupon: 'Edit Coupon',
    createCoupon: 'Create New Coupon',
    couponCode: 'Coupon Code',
    generate: 'Generate',
    description: 'Description',
    descPlaceholder: '20% off all plans',
    discountType: 'Discount Type',
    percentage: 'Percentage',
    fixedAmount: 'Fixed Amount',
    discountValue: 'Discount Value',
    maxUses: 'Max Uses (optional)',
    maxUsesPlaceholder: 'Unlimited',
    validFrom: 'Valid From',
    validUntil: 'Valid Until (optional)',
    appliesToPlans: 'Applies to Plans',
    active: 'Active',
    save: 'Save',
    update: 'Update',
    create: 'Create',
    cancel: 'Cancel',
    allCoupons: 'All Coupons',
    code: 'Code',
    discount: 'Discount',
    usage: 'Usage',
    validUntilCol: 'Valid Until',
    status: 'Status',
    actions: 'Actions',
    loading: 'Loading...',
    noCoupons: 'No coupons yet. Create your first one above!',
    inactive: 'Inactive',
    expired: 'Expired',
    maxedOut: 'Maxed Out',
    noExpiry: 'No expiry',
    copied: 'Coupon code copied to clipboard',
    deleteTitle: 'Delete Coupon',
    deleteDesc: 'Are you sure you want to delete this coupon? This action cannot be undone.',
    codeRequired: 'Please enter a coupon code',
    updateSuccess: 'Coupon updated successfully',
    createSuccess: 'Coupon created successfully',
    saveFail: 'Failed to save coupon',
    deleteSuccess: 'Coupon deleted successfully',
    deleteFail: 'Failed to delete coupon',
    loadFail: 'Failed to load coupons',
    coupon: 'Coupon',
  },
};

export default function CouponsAdminPage() {
  const { language } = useLanguage();
  const l = texts[language];
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    max_uses: null as number | null,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    applies_to_plans: ['FREE', 'KUCUK', 'ORTA', 'BUYUK', 'ENTERPRISE'],
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error(l.loadFail);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const code = 'SAVE' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, code });
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_uses: coupon.max_uses,
      valid_from: coupon.valid_from.split('T')[0],
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      applies_to_plans: coupon.applies_to_plans,
      is_active: coupon.is_active,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      max_uses: null,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      applies_to_plans: ['FREE', 'KUCUK', 'ORTA', 'BUYUK', 'ENTERPRISE'],
      is_active: true,
    });
  };

  const handleSave = async () => {
    if (!formData.code) {
      toast.error(l.codeRequired);
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        max_uses: formData.max_uses || null,
        valid_until: formData.valid_until || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('coupons')
          .update(dataToSave)
          .eq('id', editingId);

        if (error) throw error;
        toast.success(l.updateSuccess);
      } else {
        const { error } = await supabase.from('coupons').insert(dataToSave);

        if (error) throw error;
        toast.success(l.createSuccess);
      }

      handleCancel();
      fetchCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error.message || l.saveFail);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from('coupons').delete().eq('id', deleteId);

      if (error) throw error;

      toast.success(l.deleteSuccess);
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error(l.deleteFail);
    } finally {
      setDeleteId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(l.copied);
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.valid_until) return false;
    return new Date(coupon.valid_until) < new Date();
  };

  const isMaxedOut = (coupon: Coupon) => {
    if (!coupon.max_uses) return false;
    return coupon.current_uses >= coupon.max_uses;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{l.title}</h1>
          <p className="text-muted-foreground">{l.subtitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? l.editCoupon : l.createCoupon}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{l.couponCode}</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="SAVE20"
                  className="font-mono"
                />
                <Button variant="outline" onClick={generateCode}>
                  {l.generate}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{l.description}</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={l.descPlaceholder}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{l.discountType}</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value: 'percentage' | 'fixed') =>
                  setFormData({ ...formData, discount_type: value })
                }
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
              <Label>{l.discountValue}</Label>
              <Input
                type="number"
                value={formData.discount_value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount_value: parseFloat(e.target.value),
                  })
                }
                min={0}
                max={formData.discount_type === 'percentage' ? 100 : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label>{l.maxUses}</Label>
              <Input
                type="number"
                value={formData.max_uses || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_uses: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder={l.maxUsesPlaceholder}
                min={1}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{l.validFrom}</Label>
              <Input
                type="date"
                value={formData.valid_from}
                onChange={(e) =>
                  setFormData({ ...formData, valid_from: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{l.validUntil}</Label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) =>
                  setFormData({ ...formData, valid_until: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{l.appliesToPlans}</Label>
            <div className="flex gap-4 flex-wrap">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <div key={plan} className="flex items-center space-x-2">
                  <Checkbox
                    id={plan}
                    checked={formData.applies_to_plans.includes(plan)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          applies_to_plans: [...formData.applies_to_plans, plan],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          applies_to_plans: formData.applies_to_plans.filter(
                            (p) => p !== plan
                          ),
                        });
                      }
                    }}
                  />
                  <label htmlFor={plan} className="text-sm font-medium">
                    {plan}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label>{l.active}</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {editingId ? l.update : l.create} {l.coupon}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                {l.cancel}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{l.allCoupons}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{l.loading}</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {l.noCoupons}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{l.code}</TableHead>
                  <TableHead>{l.discount}</TableHead>
                  <TableHead>{l.usage}</TableHead>
                  <TableHead>{l.validUntilCol}</TableHead>
                  <TableHead>{l.status}</TableHead>
                  <TableHead className="text-right">{l.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold">
                          {coupon.code}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyCode(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.discount_type === 'percentage'
                        ? `%${coupon.discount_value}`
                        : `${coupon.discount_value} TL`}
                    </TableCell>
                    <TableCell>
                      {coupon.current_uses}
                      {coupon.max_uses ? ` / ${coupon.max_uses}` : ' / --'}
                    </TableCell>
                    <TableCell>
                      {coupon.valid_until
                        ? format(new Date(coupon.valid_until), 'dd.MM.yyyy')
                        : l.noExpiry}
                    </TableCell>
                    <TableCell>
                      {!coupon.is_active ? (
                        <Badge variant="secondary">{l.inactive}</Badge>
                      ) : isExpired(coupon) ? (
                        <Badge variant="destructive">{l.expired}</Badge>
                      ) : isMaxedOut(coupon) ? (
                        <Badge variant="secondary">{l.maxedOut}</Badge>
                      ) : (
                        <Badge>{l.active}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(coupon.id)}
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

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title={l.deleteTitle}
        description={l.deleteDesc}
      />
    </div>
  );
}
