'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Wallet, Building2, CreditCard, MoreVertical, Trash2, Edit, TrendingUp, TrendingDown } from 'lucide-react'
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
  notes?: string
  created_at: string
  updated_at: string
}

export default function AccountsPage() {
  const { tenantId } = useTenant()
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()
  const [accounts, setAccounts] = useState<Account[]>([])

  const currencies = Object.keys(currencySymbols).map(code => ({
    code: code as Currency,
    symbol: currencySymbols[code as Currency],
    name: currencyNames[code as Currency]
  }))
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
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
  }, [tenantId])

  async function fetchAccounts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAccounts(data || [])
    } catch (error: any) {
      console.error('Error fetching accounts:', error)
      toast.error('Failed to load accounts')
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

  async function handleDeleteAccount() {
    if (!selectedAccount) return

    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('id', selectedAccount.id)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast.success('Account deleted successfully')
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

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0)

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.finance.accounts.title}</h1>
            <p className="text-gray-500 mt-1">Manage your cash and bank accounts</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t.finance.accounts.addAccount}
          </Button>
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
            title={t.finance.accounts.noAccounts}
            description={t.finance.accounts.noAccountsDesc}
            action={{
              label: t.finance.accounts.addAccount,
              onClick: () => setAddDialogOpen(true)
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white/90 text-sm font-medium">
                    {t.finance.transactions.cashOnHand}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatCurrency(totalBalance)}
                  </div>
                  <p className="text-white/80 text-sm mt-2">
                    {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account) => {
                const balanceChange = Number(account.current_balance) - Number(account.opening_balance)
                const isPositive = balanceChange >= 0

                return (
                  <Card key={account.id} className="hover:shadow-lg transition-shadow">
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
                          <p className="text-xs text-gray-500">
                            {account.type === 'cash' ? t.finance.accounts.cash : account.type === 'credit_card' ? 'Credit Card' : t.finance.accounts.bank}
                          </p>
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
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(account)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t.common.delete}
                          </DropdownMenuItem>
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
                            <span className="text-gray-500">Change</span>
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
            </div>
          </>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
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
        <DialogContent className="sm:max-w-[500px]">
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.common.confirmDelete}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
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
    </DashboardLayout>
  )
}
