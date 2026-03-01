'use client'

import { useState, useEffect, useMemo } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { convertAmount } from '@/lib/tcmb'
import type { TcmbRatesByCurrency } from '@/lib/tcmb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Upload, Wallet, Building2, CreditCard, MoreVertical, Trash2, Edit, TrendingUp, TrendingDown, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/hooks/use-currency'
import { currencySymbols, currencyNames, Currency } from '@/contexts/currency-context'
import { EmptyState } from '@/components/empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { TurkishBankSelect } from '@/components/turkish-bank-select'
import { AccountCsvImportDialog } from '@/components/account-csv-import-dialog'

interface Account {
  id: string
  name: string
  type: 'cash' | 'bank' | 'credit_card'
  currency: string
  opening_balance: number
  current_balance: number
  account_number?: string
  bank_name?: string
  card_last_four?: string
  card_holder_name?: string
  is_active: boolean
  closed_at?: string | null
  notes?: string
  created_at: string
  updated_at: string
}

export default function AccountsPage() {
  const { tenantId } = useTenant()
  const { t, language } = useLanguage()
  const { formatCurrency, currency: preferredCurrency, defaultRateType } = useCurrency()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [tcmbRates, setTcmbRates] = useState<TcmbRatesByCurrency | null>(null)

  const currencies = Object.keys(currencySymbols).map(code => ({
    code: code as Currency,
    symbol: currencySymbols[code as Currency],
    name: currencyNames[code as Currency]
  }))
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [closeDate, setCloseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [viewFilter, setViewFilter] = useState<'active' | 'closed' | 'all'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [csvImportOpen, setCsvImportOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'cash' as 'cash' | 'bank' | 'credit_card',
    currency: 'TRY',
    opening_balance: '0',
    account_number: '',
    bank_name: '',
    card_last_four: '',
    card_holder_name: '',
    notes: ''
  })

  useEffect(() => {
    if (tenantId) {
      fetchAccounts()
    }
  }, [tenantId, viewFilter])

  useEffect(() => {
    const dateStr = new Date().toISOString().slice(0, 10)
    fetch(`/api/tcmb?date=${dateStr}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => data && Object.keys(data).length > 0 ? setTcmbRates(data) : setTcmbRates(null))
      .catch(() => setTcmbRates(null))
  }, [])

  async function fetchAccounts() {
    try {
      setLoading(true)
      let query = supabase
        .from('accounts')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
      if (viewFilter === 'active') query = query.eq('is_active', true)
      else if (viewFilter === 'closed') query = query.eq('is_active', false)
      const { data, error } = await query
      if (error) throw error
      setAccounts(data || [])
    } catch (error: any) {
      console.error('Error fetching accounts:', error)
      toast.error(t.toast.failedToLoadAccounts)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddAccount() {
    try {
      const insertData: any = {
        tenant_id: tenantId,
        name: formData.name,
        type: formData.type,
        currency: formData.currency,
        opening_balance: parseFloat(formData.opening_balance),
        current_balance: parseFloat(formData.opening_balance),
        notes: formData.notes || null,
      }

      if (formData.type === 'bank') {
        insertData.account_number = formData.account_number || null
        insertData.bank_name = formData.bank_name || null
      } else if (formData.type === 'credit_card') {
        insertData.bank_name = formData.bank_name || null
        insertData.card_last_four = formData.card_last_four || null
        insertData.card_holder_name = formData.card_holder_name || null
      }

      const { data, error } = await supabase
        .from('accounts')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      toast.success(t.finance.accounts.addAccount + ' - Success!')
      setAddDialogOpen(false)
      resetForm()
      fetchAccounts()
    } catch (error: any) {
      console.error('Error adding account:', error)
      toast.error('Failed to add account')
    }
  }

  async function handleEditAccount() {
    if (!selectedAccount) return

    try {
      const updateData: any = {
        name: formData.name,
        type: formData.type,
        currency: formData.currency,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      }

      if (formData.type === 'bank') {
        updateData.account_number = formData.account_number || null
        updateData.bank_name = formData.bank_name || null
        updateData.card_last_four = null
        updateData.card_holder_name = null
      } else if (formData.type === 'credit_card') {
        updateData.bank_name = formData.bank_name || null
        updateData.card_last_four = formData.card_last_four || null
        updateData.card_holder_name = formData.card_holder_name || null
        updateData.account_number = null
      } else {
        updateData.account_number = null
        updateData.bank_name = null
        updateData.card_last_four = null
        updateData.card_holder_name = null
      }

      const { error } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', selectedAccount.id)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast.success(t.finance.accounts.editAccount + ' - Success!')
      setEditDialogOpen(false)
      setSelectedAccount(null)
      resetForm()
      fetchAccounts()
    } catch (error: any) {
      console.error('Error editing account:', error)
      toast.error('Failed to edit account')
    }
  }

  async function handleCloseAccount() {
    if (!selectedAccount) return
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          is_active: false,
          closed_at: closeDate ? new Date(closeDate).toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedAccount.id)
        .eq('tenant_id', tenantId)
      if (error) throw error
      toast.success(t.finance.accounts.accountClosedSuccess)
      setCloseDialogOpen(false)
      setSelectedAccount(null)
      setCloseDate(new Date().toISOString().slice(0, 10))
      fetchAccounts()
    } catch (error: any) {
      console.error('Error closing account:', error)
      toast.error(error.message || (language === 'tr' ? 'Hesap kapatılamadı' : 'Failed to close account'))
    }
  }

  async function handleReopenAccount(account: Account) {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          is_active: true,
          closed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id)
        .eq('tenant_id', tenantId)
      if (error) throw error
      toast.success(t.finance.accounts.accountReopenedSuccess)
      fetchAccounts()
    } catch (error: any) {
      console.error('Error reopening account:', error)
      toast.error(error.message || (language === 'tr' ? 'Hesap açılamadı' : 'Failed to reopen account'))
    }
  }

  async function handleDeleteAccount() {
    if (!selectedAccount) return
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', selectedAccount.id)
        .eq('tenant_id', tenantId)
      if (error) throw error
      toast.success(t.finance.accounts.accountClosedSuccess)
      setDeleteDialogOpen(false)
      setSelectedAccount(null)
      fetchAccounts()
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    }
  }

  function openEditDialog(account: Account) {
    setSelectedAccount(account)
    setFormData({
      name: account.name,
      type: account.type,
      currency: account.currency,
      opening_balance: account.opening_balance.toString(),
      account_number: account.account_number || '',
      bank_name: account.bank_name || '',
      card_last_four: account.card_last_four || '',
      card_holder_name: account.card_holder_name || '',
      notes: account.notes || ''
    })
    setEditDialogOpen(true)
  }

  function openDeleteDialog(account: Account) {
    setSelectedAccount(account)
    setDeleteDialogOpen(true)
  }

  function openCloseDialog(account: Account) {
    setSelectedAccount(account)
    setCloseDate(account.closed_at ? new Date(account.closed_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
    setCloseDialogOpen(true)
  }

  function resetForm() {
    setFormData({
      name: '',
      type: 'cash',
      currency: 'TRY',
      opening_balance: '0',
      account_number: '',
      bank_name: '',
      card_last_four: '',
      card_holder_name: '',
      notes: ''
    })
  }

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return accounts
    return accounts.filter((acc) => {
      const name = (acc.name || '').toLowerCase()
      const bankName = (acc.bank_name || '').toLowerCase()
      const currency = (acc.currency || '').toLowerCase()
      const accountNumber = (acc.account_number || '').replace(/\s/g, '').toLowerCase()
      const queryNorm = q.replace(/\s/g, '')
      return (
        name.includes(q) ||
        bankName.includes(q) ||
        currency.includes(q) ||
        accountNumber.includes(queryNorm) ||
        (queryNorm.length >= 4 && accountNumber.includes(queryNorm))
      )
    })
  }, [accounts, searchQuery])

  const activeAccounts = accounts.filter((a) => a.is_active)
  const activeFilteredAccounts = filteredAccounts.filter((a) => a.is_active)
  const totalBalanceInPreferred = useMemo(() => {
    const target = (preferredCurrency || 'TRY').toUpperCase()
    const sourceAccounts = searchQuery.trim() ? activeFilteredAccounts : activeAccounts
    return sourceAccounts.reduce((sum, acc) => {
      const amt = Number(acc.current_balance) || 0
      const cur = (acc.currency || 'TRY').toUpperCase()
      if (cur === target) return sum + amt
      if (tcmbRates) {
        const converted = convertAmount(amt, cur, target, tcmbRates, defaultRateType)
        if (converted != null) return sum + converted
      }
      return sum
    }, 0)
  }, [activeAccounts, activeFilteredAccounts, searchQuery, preferredCurrency, defaultRateType, tcmbRates])

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.finance.accounts.title}</h1>
            <p className="text-gray-500 mt-1">{t.finance.accounts.subtitle}</p>
          </div>
          <Button variant="outline" onClick={() => setCsvImportOpen(true)} className="shrink-0">
            <Upload className="mr-2 h-4 w-4" />
            {language === 'tr' ? 'Toplu aktarım' : 'Bulk import'}
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t.finance.accounts.addAccount}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={viewFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewFilter('active')}
            >
              {t.finance.accounts.filterActive}
            </Button>
            <Button
              variant={viewFilter === 'closed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewFilter('closed')}
            >
              {t.finance.accounts.filterClosed}
            </Button>
            <Button
              variant={viewFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewFilter('all')}
            >
              {t.finance.accounts.filterAll}
            </Button>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t.finance.accounts.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-gray-100" />
                <CardContent className="h-24 bg-gray-50" />
              </Card>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={viewFilter === 'active' ? t.finance.accounts.noAccounts : (language === 'tr' ? 'Kayıt yok' : 'No records')}
            description={viewFilter === 'closed' ? (language === 'tr' ? 'Kapalı hesap bulunmuyor.' : 'No closed accounts.') : viewFilter === 'all' ? (language === 'tr' ? 'Henüz hesap eklenmemiş.' : 'No accounts yet.') : t.finance.accounts.noAccountsDesc}
            action={viewFilter === 'active' ? { label: t.finance.accounts.addAccount, onClick: () => setAddDialogOpen(true) } : undefined}
          />
        ) : (
          <>
            {(viewFilter === 'active' || viewFilter === 'all') && activeAccounts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardHeader className="bg-[var(--color-success)]">
                    <CardTitle className="text-white/90 text-sm font-medium">
                      {t.finance.transactions.cashOnHand}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-[var(--color-success)]">
                    <div className="text-3xl font-bold">
                      {formatCurrency(totalBalanceInPreferred)}
                    </div>
                    <p className="text-white/80 text-sm mt-2">
                      {(searchQuery.trim() ? activeFilteredAccounts.length : activeAccounts.length)} {(searchQuery.trim() ? activeFilteredAccounts.length : activeAccounts.length) === 1 ? t.finance.accounts.account : t.finance.accounts.accounts}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccounts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  {language === 'tr' ? 'Arama kriterlerine uygun hesap bulunamadı.' : 'No accounts match your search.'}
                </div>
              ) : (
              <>
              {filteredAccounts.map((account) => {
                const balanceChange = Number(account.current_balance) - Number(account.opening_balance)
                const isPositive = balanceChange >= 0
                const isClosed = !account.is_active

                return (
                  <Card key={account.id} className={`hover:shadow-lg transition-shadow ${isClosed ? 'opacity-85 border-amber-200 bg-amber-50/30' : ''}`}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          account.type === 'cash'
                            ? 'bg-green-100 text-green-600'
                            : account.type === 'credit_card'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {account.type === 'cash' ? (
                            <Wallet className="h-5 w-5" />
                          ) : account.type === 'credit_card' ? (
                            <CreditCard className="h-5 w-5" />
                          ) : (
                            <Building2 className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">{account.name}</CardTitle>
                          {isClosed && (
                            <p className="text-xs text-amber-700 font-medium mt-0.5">
                              {t.finance.accounts.filterClosed}
                              {account.closed_at && (
                                <span className="text-amber-600 ml-1">
                                  · {t.finance.accounts.closedAt}: {new Date(account.closed_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-GB')}
                                </span>
                              )}
                            </p>
                          )}
                          {!isClosed && (
                          <p className="text-xs text-gray-500">
                            {account.type === 'cash' ? t.finance.accounts.cash : account.type === 'credit_card' ? 'Credit Card' : t.finance.accounts.bank}
                          </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(account)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t.common.edit}
                          </DropdownMenuItem>
                          {isClosed ? (
                            <DropdownMenuItem onClick={() => handleReopenAccount(account)}>
                              <TrendingUp className="mr-2 h-4 w-4" />
                              {t.finance.accounts.reopenAccount}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => openCloseDialog(account)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t.finance.accounts.closeAccount}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{t.finance.accounts.currentBalance}</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {account.currency} {Number(account.current_balance).toLocaleString()}
                          </p>
                        </div>

                        {account.type === 'bank' && account.bank_name && (
                          <div>
                            <p className="text-xs text-gray-500">{t.finance.accounts.bankName}</p>
                            <p className="text-sm font-medium">{account.bank_name}</p>
                          </div>
                        )}

                        {account.account_number && (
                          <div>
                            <p className="text-xs text-gray-500">{t.finance.accounts.accountNumber}</p>
                            <p className="text-sm font-mono">{account.account_number}</p>
                          </div>
                        )}

                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{t.finance.accounts.openingBalance}</span>
                            <span className="font-medium">
                              {account.currency} {Number(account.opening_balance).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-gray-500">{t.finance.accounts.balanceChange}</span>
                            <span className={`flex items-center gap-1 font-medium ${
                              isPositive ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isPositive ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {account.currency} {Math.abs(balanceChange).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              </>
              )}
            </div>
          </>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-cyan-50">
          <DialogHeader>
            <DialogTitle>{t.finance.accounts.addAccount}</DialogTitle>
            <DialogDescription>Create a new cash or bank account to track your finances.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t.finance.accounts.accountName}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Cash Box, Ziraat Bank"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">{t.finance.accounts.accountType}</Label>
                <Select value={formData.type} onValueChange={(value: 'cash' | 'bank' | 'credit_card') => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t.finance.accounts.cash}</SelectItem>
                    <SelectItem value="bank">{t.finance.accounts.bank}</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency">{t.finance.accounts.currency}</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.code} - {curr.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="opening_balance">{t.finance.accounts.openingBalance}</Label>
              <Input
                id="opening_balance"
                type="number"
                step="0.01"
                value={formData.opening_balance}
                onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
              />
            </div>

            {formData.type === 'bank' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="bank_name">{t.finance.accounts.bankName}</Label>
                  <TurkishBankSelect
                    value={formData.bank_name}
                    onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                    placeholder="Select bank"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="account_number">{t.finance.accounts.accountNumber}</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="IBAN or Account Number"
                  />
                </div>
              </>
            )}

            {formData.type === 'credit_card' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="bank_name">{t.finance.accounts.bankName}</Label>
                  <TurkishBankSelect
                    value={formData.bank_name}
                    onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                    placeholder="Select bank"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="card_holder_name">Card Holder Name</Label>
                  <Input
                    id="card_holder_name"
                    value={formData.card_holder_name}
                    onChange={(e) => setFormData({ ...formData, card_holder_name: e.target.value })}
                    placeholder="e.g., John Doe"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="card_last_four">Last 4 Digits</Label>
                  <Input
                    id="card_last_four"
                    value={formData.card_last_four}
                    onChange={(e) => setFormData({ ...formData, card_last_four: e.target.value })}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">{t.finance.accounts.notes}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm() }}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleAddAccount} disabled={!formData.name}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-cyan-50">
          <DialogHeader>
            <DialogTitle>{t.finance.accounts.editAccount}</DialogTitle>
            <DialogDescription>Update account information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{t.finance.accounts.accountName}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-type">{t.finance.accounts.accountType}</Label>
                <Select value={formData.type} onValueChange={(value: 'cash' | 'bank' | 'credit_card') => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t.finance.accounts.cash}</SelectItem>
                    <SelectItem value="bank">{t.finance.accounts.bank}</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-currency">{t.finance.accounts.currency}</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.code} - {curr.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'bank' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="edit-bank_name">{t.finance.accounts.bankName}</Label>
                  <TurkishBankSelect
                    value={formData.bank_name}
                    onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                    placeholder="Select bank"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-account_number">{t.finance.accounts.accountNumber}</Label>
                  <Input
                    id="edit-account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  />
                </div>
              </>
            )}

            {formData.type === 'credit_card' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="edit-bank_name">{t.finance.accounts.bankName}</Label>
                  <TurkishBankSelect
                    value={formData.bank_name}
                    onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                    placeholder="Select bank"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-card_holder_name">Card Holder Name</Label>
                  <Input
                    id="edit-card_holder_name"
                    value={formData.card_holder_name}
                    onChange={(e) => setFormData({ ...formData, card_holder_name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-card_last_four">Last 4 Digits</Label>
                  <Input
                    id="edit-card_last_four"
                    value={formData.card_last_four}
                    onChange={(e) => setFormData({ ...formData, card_last_four: e.target.value })}
                    maxLength={4}
                  />
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-notes">{t.finance.accounts.notes}</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedAccount(null); resetForm() }}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleEditAccount} disabled={!formData.name}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialogOpen} onOpenChange={(open) => { if (!open) { setCloseDialogOpen(false); setSelectedAccount(null) } }}>
        <DialogContent className="sm:max-w-lg bg-cyan-50">
          <DialogHeader>
            <DialogTitle>{t.finance.accounts.confirmCloseAccount}</DialogTitle>
            <DialogDescription>
              {t.finance.accounts.closeAccountDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="close-date">{t.finance.accounts.activeEndDate}</Label>
              <Input
                id="close-date"
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCloseDialogOpen(false); setSelectedAccount(null) }}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleCloseAccount}>
              {t.finance.accounts.closeAccount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.common.confirmDelete}</DialogTitle>
            <DialogDescription>
              {language === 'tr' ? 'Bu hesabı kapatmak istediğinize emin misiniz? Hesap listeden çıkarılır.' : 'Are you sure you want to close this account? It will be removed from the active list.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSelectedAccount(null) }}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AccountCsvImportDialog
        isOpen={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        onSuccess={fetchAccounts}
      />
    </DashboardLayout>
  )
}
