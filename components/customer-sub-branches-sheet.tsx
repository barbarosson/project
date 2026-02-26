'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'
import { useTenant } from '@/contexts/tenant-context'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Warehouse, Users, MapPin, Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface SubBranch {
  id: string
  company_title: string
  name: string
  branch_type: string
  branch_code: string
  city?: string
  phone?: string
  email?: string
  balance: number
  status: string
  address?: string
  district?: string
  postal_code?: string
  country?: string
  bank_name?: string
  bank_account_holder?: string
  bank_account_number?: string
  bank_iban?: string
  bank_branch?: string
  bank_swift?: string
}

interface CustomerSubBranchesSheetProps {
  customerId: string | null
  isOpen: boolean
  onClose: () => void
  /** Bu carinin alt şubesini eklemek için Cari Ekle dialog'unu açar; parentData ile ana cari bilgileri iletilir */
  onAddSubCustomer?: (parentCustomerId: string, parentData: Record<string, unknown>) => void
}

export function CustomerSubBranchesSheet({
  customerId,
  isOpen,
  onClose,
  onAddSubCustomer,
}: CustomerSubBranchesSheetProps) {
  const { t } = useLanguage()
  const { tenantId } = useTenant()
  const [loading, setLoading] = useState(false)
  const [subBranches, setSubBranches] = useState<SubBranch[]>([])
  const [parentCustomer, setParentCustomer] = useState<any>(null)
  const [editingBranch, setEditingBranch] = useState<SubBranch | null>(null)
  const [editTabValue, setEditTabValue] = useState<'genel' | 'adres' | 'banka'>('genel')
  const [editForm, setEditForm] = useState({
    company_title: '',
    name: '',
    branch_type: 'branch',
    branch_code: '',
    address: '',
    city: '',
    district: '',
    postal_code: '',
    country: 'Türkiye',
    bank_name: '',
    bank_account_holder: '',
    bank_account_number: '',
    bank_iban: '',
    bank_branch: '',
    bank_swift: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && customerId) {
      fetchSubBranches()
      fetchParentCustomer()
    }
  }, [isOpen, customerId])

  const fetchParentCustomer = async () => {
    if (!customerId) return

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

      if (error) throw error
      setParentCustomer(data)
    } catch (error) {
      console.error('Error fetching parent customer:', error)
    }
  }

  const fetchSubBranches = async () => {
    if (!customerId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('parent_customer_id', customerId)
        .eq('tenant_id', tenantId)
        .order('company_title')
        .limit(500)

      if (error) throw error
      setSubBranches(data || [])
    } catch (error) {
      console.error('Error fetching sub-branches:', error)
      toast.error('Alt cariler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const getBranchIcon = (branchType: string) => {
    switch (branchType) {
      case 'branch':
        return <Building2 className="h-4 w-4" />
      case 'warehouse':
        return <Warehouse className="h-4 w-4" />
      case 'department':
        return <Users className="h-4 w-4" />
      case 'center':
        return <MapPin className="h-4 w-4" />
      default:
        return <Building2 className="h-4 w-4" />
    }
  }

  const getBranchTypeLabel = (branchType: string) => {
    const labels: Record<string, string> = {
      main: 'Ana Cari',
      branch: 'Şube',
      warehouse: 'Depo',
      department: 'Departman',
      center: 'Merkez'
    }
    return labels[branchType] || branchType
  }

  const openEditBranch = (branch: SubBranch) => {
    setEditingBranch(branch)
    setEditTabValue('genel')
    setEditForm({
      company_title: branch.company_title || '',
      name: branch.name || '',
      branch_type: branch.branch_type || 'branch',
      branch_code: branch.branch_code || '',
      address: branch.address || '',
      city: branch.city || '',
      district: branch.district || '',
      postal_code: branch.postal_code || '',
      country: branch.country || 'Türkiye',
      bank_name: branch.bank_name || '',
      bank_account_holder: branch.bank_account_holder || '',
      bank_account_number: branch.bank_account_number || '',
      bank_iban: branch.bank_iban || '',
      bank_branch: branch.bank_branch || '',
      bank_swift: branch.bank_swift || '',
    })
  }

  const handleSaveBranch = async () => {
    if (!editingBranch || !tenantId) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          company_title: editForm.company_title || null,
          name: editForm.name || null,
          branch_type: editForm.branch_type,
          branch_code: editForm.branch_code || null,
          address: editForm.address || null,
          city: editForm.city || null,
          district: editForm.district || null,
          postal_code: editForm.postal_code || null,
          country: editForm.country || null,
          bank_name: editForm.bank_name || null,
          bank_account_holder: editForm.bank_account_holder || null,
          bank_account_number: editForm.bank_account_number || null,
          bank_iban: editForm.bank_iban || null,
          bank_branch: editForm.bank_branch || null,
          bank_swift: editForm.bank_swift || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBranch.id)
        .eq('tenant_id', tenantId)
      if (error) throw error
      toast.success('Alt şube güncellendi')
      setEditingBranch(null)
      fetchSubBranches()
    } catch (e: any) {
      toast.error(e.message || 'Güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Şube ve Alt Cariler</SheetTitle>
          <SheetDescription>
            {parentCustomer?.company_title} carisi için alt şubeler ve birimler
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Parent Customer Info */}
          {parentCustomer && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">
                    {parentCustomer.company_title}
                  </h3>
                  <p className="text-sm text-blue-700">{parentCustomer.name}</p>
                  {parentCustomer.branch_code && (
                    <p className="text-xs text-blue-600 mt-1">
                      Kod: {parentCustomer.branch_code}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-900">
                  {getBranchTypeLabel(parentCustomer.branch_type)}
                </Badge>
              </div>
            </div>
          )}

          {/* Sub Branches List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-700">
                Alt Şubeler ({subBranches.length})
              </h4>
              {onAddSubCustomer && customerId && parentCustomer && (
                <Button
                  type="button"
                  size="sm"
                  className="gap-2 bg-[#00D4AA] hover:bg-[#00B894] text-[var(--color-text)]"
                  onClick={() => {
                    onAddSubCustomer(customerId, parentCustomer)
                    onClose()
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Şube / Alt cari ekle
                </Button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Yükleniyor...
              </div>
            ) : subBranches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Henüz alt şube tanımlanmamış</p>
                <p className="text-xs mt-1">
                  Yeni cari eklerken bu cariyi üst cari olarak seçebilirsiniz
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {subBranches.map((branch) => (
                  <div
                    key={branch.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-gray-100 rounded">
                          {getBranchIcon(branch.branch_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-medium">{branch.company_title}</h5>
                            {branch.branch_code && (
                              <Badge variant="secondary" className="text-xs">
                                {branch.branch_code}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                              {getBranchTypeLabel(branch.branch_type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{branch.name}</p>

                          <div className="mt-2 text-xs text-gray-500 space-y-1">
                            {branch.city && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {branch.city}
                              </div>
                            )}
                            {branch.phone && (
                              <div>{branch.phone}</div>
                            )}
                            {branch.email && (
                              <div>{branch.email}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => openEditBranch(branch)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Düzenle
                        </Button>
                        <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                          {getBranchTypeLabel(branch.branch_type)}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {new Intl.NumberFormat('tr-TR', {
                              style: 'currency',
                              currency: 'TRY'
                            }).format(branch.balance || 0)}
                          </p>
                          <p className="text-xs text-gray-500">Bakiye</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hierarchy Info */}
          <div className="p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
            <p className="font-medium mb-2">Şube Yapısı Hakkında:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Her alt şube bağımsız cari olarak işlem görebilir</li>
              <li>Üst carinin bakiyesi alt şubeleri içermez</li>
              <li>Şube / Alt cari ekle ile eklenen cariler otomatik bu ana cariye bağlanır</li>
              <li>Alt şubeler kendi faturaları, siparişleri ve ödemeleriyle yönetilir</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <Dialog open={!!editingBranch} onOpenChange={(open) => !open && setEditingBranch(null)}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Alt şube düzenle</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-md bg-muted shrink-0 mb-2">
            <button
              type="button"
              onClick={() => setEditTabValue('genel')}
              className={cn(
                'rounded-sm px-3 py-2 text-sm font-medium transition-colors',
                editTabValue === 'genel' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Genel
            </button>
            <button
              type="button"
              onClick={() => setEditTabValue('adres')}
              className={cn(
                'rounded-sm px-3 py-2 text-sm font-medium transition-colors',
                editTabValue === 'adres' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Adres
            </button>
            <button
              type="button"
              onClick={() => setEditTabValue('banka')}
              className={cn(
                'rounded-sm px-3 py-2 text-sm font-medium transition-colors',
                editTabValue === 'banka' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Banka
            </button>
          </div>
          <div className="overflow-y-auto py-4 min-h-0 flex-1">
            {editTabValue === 'genel' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Unvan</Label>
                <Input
                  value={editForm.company_title}
                  onChange={(e) => setEditForm((f) => ({ ...f, company_title: e.target.value }))}
                  placeholder="Şube unvanı"
                />
              </div>
              <div className="space-y-2">
                <Label>Yetkili / İletişim adı</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="space-y-2">
                <Label>Cari tipi</Label>
                <Select
                  value={editForm.branch_type}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, branch_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch">Şube</SelectItem>
                    <SelectItem value="warehouse">Depo</SelectItem>
                    <SelectItem value="department">Departman</SelectItem>
                    <SelectItem value="center">Merkez</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Şube/Birim kodu</Label>
                <Input
                  value={editForm.branch_code}
                  onChange={(e) => setEditForm((f) => ({ ...f, branch_code: e.target.value }))}
                  placeholder="ŞB-01, DEP-MAR vb."
                />
              </div>
            </div>
            )}
            {editTabValue === 'adres' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Opsiyonel. Şubeye özel adres bilgileri.</p>
              <div className="space-y-2">
                <Label>Adres</Label>
                <Textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Sokak, bina no"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>İl</Label>
                  <Input
                    value={editForm.city}
                    onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="İl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>İlçe</Label>
                  <Input
                    value={editForm.district}
                    onChange={(e) => setEditForm((f) => ({ ...f, district: e.target.value }))}
                    placeholder="İlçe"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Posta kodu</Label>
                  <Input
                    value={editForm.postal_code}
                    onChange={(e) => setEditForm((f) => ({ ...f, postal_code: e.target.value }))}
                    placeholder="34000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ülke</Label>
                  <Input
                    value={editForm.country}
                    onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value }))}
                    placeholder="Türkiye"
                  />
                </div>
              </div>
            </div>
            )}
            {editTabValue === 'banka' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Opsiyonel. Şubeye özel banka bilgileri.</p>
              <div className="space-y-2">
                <Label>Banka adı</Label>
                <Input
                  value={editForm.bank_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, bank_name: e.target.value }))}
                  placeholder="Banka adı"
                />
              </div>
              <div className="space-y-2">
                <Label>Hesap sahibi</Label>
                <Input
                  value={editForm.bank_account_holder}
                  onChange={(e) => setEditForm((f) => ({ ...f, bank_account_holder: e.target.value }))}
                  placeholder="Hesap sahibi adı"
                />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input
                  value={editForm.bank_iban}
                  onChange={(e) => setEditForm((f) => ({ ...f, bank_iban: e.target.value.toUpperCase() }))}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                />
              </div>
              <div className="space-y-2">
                <Label>Banka şubesi</Label>
                <Input
                  value={editForm.bank_branch}
                  onChange={(e) => setEditForm((f) => ({ ...f, bank_branch: e.target.value }))}
                  placeholder="Şube adı"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hesap no</Label>
                  <Input
                    value={editForm.bank_account_number}
                    onChange={(e) => setEditForm((f) => ({ ...f, bank_account_number: e.target.value }))}
                    placeholder="Hesap numarası"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SWIFT/BIC</Label>
                  <Input
                    value={editForm.bank_swift}
                    onChange={(e) => setEditForm((f) => ({ ...f, bank_swift: e.target.value }))}
                    placeholder="SWIFT kodu"
                  />
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setEditingBranch(null)}>
            İptal
          </Button>
          <Button type="button" onClick={handleSaveBranch} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
