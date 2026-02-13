'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Plug, Unplug, Settings2, Trash2, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'

interface Marketplace {
  id: number
  name: string
  code: string
  api_type: string
}

interface MarketplaceAccount {
  id: string
  tenant_id: string
  marketplace_id: number
  store_name: string
  api_key: string
  api_secret: string
  seller_code: string
  is_active: boolean
  last_sync_at: string | null
  sync_status: string
  created_at: string
  marketplaces?: Marketplace
}

interface MarketplaceAccountsProps {
  accounts: MarketplaceAccount[]
  marketplaces: Marketplace[]
  tenantId: string
  userId: string
  onRefresh: () => void
}

const MARKETPLACE_COLORS: Record<string, string> = {
  trendyol: 'bg-orange-500',
  hepsiburada: 'bg-orange-600',
  amazon: 'bg-yellow-500',
  n11: 'bg-green-600',
  pazarama: 'bg-blue-500',
  ciceksepeti: 'bg-pink-500',
  akakce: 'bg-red-500',
  cimri: 'bg-cyan-600',
  idefix: 'bg-purple-500',
  teknosa: 'bg-red-600',
}

export function MarketplaceAccounts({ accounts, marketplaces, tenantId, userId, onRefresh }: MarketplaceAccountsProps) {
  const { language } = useLanguage()
  const isTR = language === 'tr'
  const locale = isTR ? tr : enUS

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    marketplace_id: '',
    store_name: '',
    api_key: '',
    api_secret: '',
    seller_code: '',
    is_active: true,
  })

  const connectedIds = accounts.map(a => a.marketplace_id)
  const availableMarketplaces = marketplaces.filter(m => !connectedIds.includes(m.id) || editingId)

  const openCreate = () => {
    setEditingId(null)
    setForm({ marketplace_id: '', store_name: '', api_key: '', api_secret: '', seller_code: '', is_active: true })
    setDialogOpen(true)
  }

  const openEdit = (acc: MarketplaceAccount) => {
    setEditingId(acc.id)
    setForm({
      marketplace_id: acc.marketplace_id.toString(),
      store_name: acc.store_name || '',
      api_key: acc.api_key || '',
      api_secret: acc.api_secret || '',
      seller_code: acc.seller_code || '',
      is_active: acc.is_active,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.marketplace_id || !form.api_key) return
    setSaving(true)
    try {
      const payload = {
        tenant_id: tenantId,
        user_id: userId,
        marketplace_id: parseInt(form.marketplace_id),
        store_name: form.store_name,
        api_key: form.api_key,
        api_secret: form.api_secret,
        seller_code: form.seller_code,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      }
      if (editingId) {
        await supabase.from('marketplace_accounts').update(payload).eq('id', editingId)
      } else {
        await supabase.from('marketplace_accounts').insert(payload)
      }
      setDialogOpen(false)
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(isTR ? 'Bu pazaryeri bağlantısını kaldırmak istediğinize emin misiniz?' : 'Are you sure you want to remove this marketplace connection?')) return
    await supabase.from('marketplace_accounts').delete().eq('id', id)
    onRefresh()
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('marketplace_accounts').update({ is_active: !current, updated_at: new Date().toISOString() }).eq('id', id)
    onRefresh()
  }

  const syncStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'syncing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold text-[#0A192F]">
            {isTR ? 'Pazaryeri Hesapları' : 'Marketplace Accounts'}
          </CardTitle>
          <Button onClick={openCreate} size="sm" className="bg-[#00D4AA] hover:bg-[#00B894] text-white">
            <Plus className="h-4 w-4 mr-1" />
            {isTR ? 'Pazaryeri Ekle' : 'Add Marketplace'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-muted/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plug className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="font-medium text-[#0A192F] mb-1">
              {isTR ? 'Henüz pazaryeri bağlantısı yok' : 'No marketplace connections yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isTR ? 'Pazaryerlerinizi bağlayarak siparişlerinizi ve ürünlerinizi merkezi olarak yönetin' : 'Connect your marketplaces to manage orders and products centrally'}
            </p>
            <Button onClick={openCreate} variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              {isTR ? 'İlk Pazaryerinizi Bağlayın' : 'Connect Your First Marketplace'}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((acc) => {
              const mp = marketplaces.find(m => m.id === acc.marketplace_id)
              const color = MARKETPLACE_COLORS[mp?.code || ''] || 'bg-gray-500'
              return (
                <div
                  key={acc.id}
                  className={`relative rounded-xl border p-5 transition-all hover:shadow-md ${
                    acc.is_active ? 'border-border bg-card' : 'border-dashed border-muted bg-muted/20 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm`}>
                        {(mp?.name || '?').charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#0A192F]">{mp?.name || 'Unknown'}</h4>
                        <p className="text-xs text-muted-foreground">
                          {acc.store_name || mp?.code}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={acc.is_active}
                      onCheckedChange={() => toggleActive(acc.id, acc.is_active)}
                    />
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{isTR ? 'API Tipi' : 'API Type'}</span>
                      <Badge variant="outline" className="text-[10px]">{mp?.api_type || 'REST'}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{isTR ? 'Senkron Durumu' : 'Sync Status'}</span>
                      <div className="flex items-center gap-1.5">
                        {syncStatusIcon(acc.sync_status)}
                        <span className="text-xs capitalize">{acc.sync_status}</span>
                      </div>
                    </div>
                    {acc.last_sync_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{isTR ? 'Son Senkron' : 'Last Sync'}</span>
                        <span className="text-xs">{format(new Date(acc.last_sync_at), 'dd MMM HH:mm', { locale })}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => openEdit(acc)}>
                      <Settings2 className="h-3.5 w-3.5 mr-1" />
                      {isTR ? 'Ayarlar' : 'Settings'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(acc.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? (isTR ? 'Pazaryeri Ayarları' : 'Marketplace Settings')
                : (isTR ? 'Pazaryeri Bağla' : 'Connect Marketplace')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isTR ? 'Pazaryeri' : 'Marketplace'} *</Label>
              <Select value={form.marketplace_id} onValueChange={(v) => setForm({ ...form, marketplace_id: v })} disabled={!!editingId}>
                <SelectTrigger><SelectValue placeholder={isTR ? 'Pazaryeri seçin...' : 'Select marketplace...'} /></SelectTrigger>
                <SelectContent>
                  {(editingId ? marketplaces : availableMarketplaces).map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isTR ? 'Mağaza Adı' : 'Store Name'}</Label>
              <Input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} placeholder={isTR ? 'Örn: Mağazam' : 'Ex: My Store'} />
            </div>
            <div>
              <Label>API Key *</Label>
              <Input value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} type="password" />
            </div>
            <div>
              <Label>API Secret</Label>
              <Input value={form.api_secret} onChange={(e) => setForm({ ...form, api_secret: e.target.value })} type="password" />
            </div>
            <div>
              <Label>{isTR ? 'Satıcı Kodu' : 'Seller Code'}</Label>
              <Input value={form.seller_code} onChange={(e) => setForm({ ...form, seller_code: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{isTR ? 'Aktif' : 'Active'}</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isTR ? 'İptal' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.marketplace_id || !form.api_key} className="bg-[#00D4AA] hover:bg-[#00B894] text-white">
              {saving ? (isTR ? 'Kaydediliyor...' : 'Saving...') : (isTR ? 'Kaydet' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
