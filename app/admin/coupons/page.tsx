'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, Copy, Search, Tag, Loader2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModulusUcNoktaButton } from '@/components/ui/card-menu-button';
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
    title: 'Kupon Yönetimi',
    subtitle: 'İndirim kuponları oluşturun ve yönetin',
    newCoupon: 'Yeni Kupon',
    editCoupon: 'Kuponu Düzenle',
    createCoupon: 'Yeni Kupon Oluştur',
    couponCode: 'Kupon Kodu',
    generate: 'Rastgele Üret',
    description: 'Açıklama',
    descPlaceholder: 'Örn: Tüm paketlerde %20 indirim',
    discountType: 'İndirim Tipi',
    percentage: 'Yüzdesel',
    fixedAmount: 'Sabit Tutar (₺)',
    discountValue: 'İndirim Değeri',
    maxUses: 'Maks. Kullanım',
    maxUsesPlaceholder: 'Sınırsız',
    validFrom: 'Geçerlilik Başlangıcı',
    validUntil: 'Geçerlilik Bitişi',
    appliesToPlans: 'Geçerli Paketler',
    selectAll: 'Tümünü seç',
    selectNone: 'Hiçbiri',
    active: 'Aktif',
    save: 'Kaydet',
    update: 'Güncelle',
    create: 'Oluştur',
    cancel: 'İptal',
    allCoupons: 'Tüm Kuponlar',
    searchPlaceholder: 'Kupon kodu ile ara...',
    filterAll: 'Tümü',
    code: 'Kod',
    discount: 'İndirim',
    usage: 'Kullanım',
    validUntilCol: 'Geçerlilik',
    status: 'Durum',
    actions: 'İşlemler',
    loading: 'Yükleniyor...',
    noCoupons: 'Henüz kupon yok',
    noCouponsHint: 'İlk kuponunuzu oluşturarak başlayın.',
    inactive: 'İnaktif',
    expired: 'Süresi Dolmuş',
    maxedOut: 'Limit Doldu',
    noExpiry: 'Süresi yok',
    copied: 'Kupon kodu panoya kopyalandı',
    deleteTitle: 'Kuponu Sil',
    deleteDesc: 'Bu kuponu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
    codeRequired: 'Kupon kodu giriniz',
    updateSuccess: 'Kupon güncellendi',
    createSuccess: 'Kupon oluşturuldu',
    saveFail: 'Kupon kaydedilemedi',
    deleteSuccess: 'Kupon silindi',
    deleteFail: 'Kupon silinemedi',
    loadFail: 'Kuponlar yüklenemedi',
    total: 'Toplam',
    activeCount: 'Aktif',
    expiredCount: 'Süresi Dolmuş',
    maxedOutCount: 'Limit Doldu',
    edit: 'Düzenle',
    delete: 'Sil',
  },
  en: {
    title: 'Coupon Manager',
    subtitle: 'Create and manage discount coupons',
    newCoupon: 'New Coupon',
    editCoupon: 'Edit Coupon',
    createCoupon: 'Create New Coupon',
    couponCode: 'Coupon Code',
    generate: 'Generate',
    description: 'Description',
    descPlaceholder: 'e.g. 20% off all plans',
    discountType: 'Discount Type',
    percentage: 'Percentage',
    fixedAmount: 'Fixed Amount',
    discountValue: 'Discount Value',
    maxUses: 'Max Uses',
    maxUsesPlaceholder: 'Unlimited',
    validFrom: 'Valid From',
    validUntil: 'Valid Until',
    appliesToPlans: 'Applies to Plans',
    selectAll: 'Select all',
    selectNone: 'None',
    active: 'Active',
    save: 'Save',
    update: 'Update',
    create: 'Create',
    cancel: 'Cancel',
    allCoupons: 'All Coupons',
    searchPlaceholder: 'Search by code...',
    filterAll: 'All',
    code: 'Code',
    discount: 'Discount',
    usage: 'Usage',
    validUntilCol: 'Valid Until',
    status: 'Status',
    actions: 'Actions',
    loading: 'Loading...',
    noCoupons: 'No coupons yet',
    noCouponsHint: 'Create your first coupon to get started.',
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
    total: 'Total',
    activeCount: 'Active',
    expiredCount: 'Expired',
    maxedOutCount: 'Maxed Out',
    edit: 'Edit',
    delete: 'Delete',
  },
};

type StatusFilter = 'all' | 'active' | 'inactive' | 'expired' | 'maxed_out';

export default function CouponsAdminPage() {
  const { language } = useLanguage();
  const l = texts[language];
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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
      setLoading(true);
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

  const isExpired = (coupon: Coupon) => {
    if (!coupon.valid_until) return false;
    return new Date(coupon.valid_until) < new Date();
  };

  const isMaxedOut = (coupon: Coupon) => {
    if (!coupon.max_uses) return false;
    return coupon.current_uses >= coupon.max_uses;
  };

  const getCouponStatus = (coupon: Coupon): StatusFilter => {
    if (!coupon.is_active) return 'inactive';
    if (isExpired(coupon)) return 'expired';
    if (isMaxedOut(coupon)) return 'maxed_out';
    return 'active';
  };

  const stats = useMemo(() => {
    const active = coupons.filter((c) => getCouponStatus(c) === 'active').length;
    const expired = coupons.filter((c) => getCouponStatus(c) === 'expired').length;
    const maxedOut = coupons.filter((c) => getCouponStatus(c) === 'maxed_out').length;
    return { total: coupons.length, active, expired, maxedOut };
  }, [coupons]);

  const filteredCoupons = useMemo(() => {
    let list = coupons;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => c.code.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      list = list.filter((c) => getCouponStatus(c) === statusFilter);
    }
    return list;
  }, [coupons, search, statusFilter]);

  const generateCode = () => {
    const code = 'SAVE' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData((prev) => ({ ...prev, code }));
  };

  const openCreate = () => {
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
    setDialogOpen(true);
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
      applies_to_plans: coupon.applies_to_plans ?? [],
      is_active: coupon.is_active,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
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

      handleCloseDialog();
      fetchCoupons();
    } catch (error: unknown) {
      console.error('Error saving coupon:', error);
      toast.error(error instanceof Error ? error.message : l.saveFail);
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

  const setAllPlans = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      applies_to_plans: checked ? [...SUBSCRIPTION_PLANS] : [],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{l.title}</h1>
          <p className="text-muted-foreground mt-1">{l.subtitle}</p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          {l.newCoupon}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{l.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
            <p className="text-xs text-muted-foreground">{l.activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.expired}</p>
            <p className="text-xs text-muted-foreground">{l.expiredCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-slate-500">{stats.maxedOut}</p>
            <p className="text-xs text-muted-foreground">{l.maxedOutCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{l.allCoupons}</CardTitle>
          <CardDescription>
            Kuponları arayıp filtreleyebilir, düzenleyebilir veya silebilirsiniz.
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={l.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{l.filterAll}</SelectItem>
                <SelectItem value="active">{l.activeCount}</SelectItem>
                <SelectItem value="inactive">{l.inactive}</SelectItem>
                <SelectItem value="expired">{l.expiredCount}</SelectItem>
                <SelectItem value="maxed_out">{l.maxedOutCount}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">
                {coupons.length === 0 ? l.noCoupons : 'Arama/filtreye uygun kupon yok'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {coupons.length === 0 ? l.noCouponsHint : 'Farklı bir arama veya filtre deneyin.'}
              </p>
              {coupons.length === 0 && (
                <Button onClick={openCreate} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  {l.createCoupon}
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>{l.code}</TableHead>
                    <TableHead className="min-w-[140px]">Açıklama</TableHead>
                    <TableHead>{l.discount}</TableHead>
                    <TableHead>{l.usage}</TableHead>
                    <TableHead>{l.validUntilCol}</TableHead>
                    <TableHead>{l.status}</TableHead>
                    <TableHead className="w-[70px] text-right">{l.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm font-semibold bg-muted px-2 py-0.5 rounded">
                            {coupon.code}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"
                            onClick={() => copyCode(coupon.code)}
                            title={l.copied}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="text-sm text-muted-foreground truncate block" title={coupon.description || ''}>
                          {coupon.description || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {coupon.discount_type === 'percentage'
                            ? `%${coupon.discount_value}`
                            : `${Number(coupon.discount_value).toLocaleString('tr-TR')} ₺`}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {coupon.current_uses}
                        {coupon.max_uses != null ? ` / ${coupon.max_uses}` : ' / ∞'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
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
                          <Badge className="bg-slate-500">{l.maxedOut}</Badge>
                        ) : (
                          <Badge className="bg-emerald-600">{l.active}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <ModulusUcNoktaButton aria-label={l.actions} title={l.actions} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {l.edit}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(coupon.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {l.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? l.editCoupon : l.createCoupon}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Kupon bilgilerini güncelleyin.' : 'Yeni indirim kuponu oluşturun.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{l.couponCode}</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                    }
                    placeholder="SAVE20"
                    className="font-mono"
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    {l.generate}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{l.description}</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder={l.descPlaceholder}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{l.discountType}</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: 'percentage' | 'fixed') =>
                    setFormData((prev) => ({ ...prev, discount_type: value }))
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
                    setFormData((prev) => ({
                      ...prev,
                      discount_value: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                  step={formData.discount_type === 'percentage' ? 1 : 0.01}
                />
              </div>
              <div className="space-y-2">
                <Label>{l.maxUses}</Label>
                <Input
                  type="number"
                  value={formData.max_uses ?? ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      max_uses: e.target.value ? parseInt(e.target.value, 10) : null,
                    }))
                  }
                  placeholder={l.maxUsesPlaceholder}
                  min={1}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{l.validFrom}</Label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, valid_from: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{l.validUntil}</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, valid_until: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{l.appliesToPlans}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setAllPlans(true)}
                  >
                    {l.selectAll}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setAllPlans(false)}
                  >
                    {l.selectNone}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div key={plan} className="flex items-center space-x-2">
                    <Checkbox
                      id={`plan-${plan}`}
                      checked={formData.applies_to_plans.includes(plan)}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => ({
                          ...prev,
                          applies_to_plans: checked
                            ? [...prev.applies_to_plans, plan]
                            : prev.applies_to_plans.filter((p) => p !== plan),
                        }));
                      }}
                    />
                    <label htmlFor={`plan-${plan}`} className="text-sm font-medium cursor-pointer">
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
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label>{l.active}</Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              {l.cancel}
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {editingId ? l.update : l.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
