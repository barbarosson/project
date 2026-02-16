'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Loader2, TrendingUp, AlertTriangle, Sparkles, Users, Edit2, Trash2, Upload, GitMerge, Building2 } from 'lucide-react'
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { AddCustomerDialog } from '@/components/add-customer-dialog'
import { EditCustomerDialog } from '@/components/edit-customer-dialog'
import { CustomerDetailSheet } from '@/components/customer-detail-sheet'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { MergeCustomersDialog } from '@/components/merge-customers-dialog'
import { CustomerCsvImportDialog } from '@/components/customer-csv-import-dialog'
import { CustomerSubBranchesSheet } from '@/components/customer-sub-branches-sheet'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/language-context'
import { useTenant } from '@/contexts/tenant-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Customer {
  id: string
  company_title: string
  name: string
  account_type: string
  tax_office: string
  tax_number: string
  email: string
  phone: string
  address: string
  balance: number
  status: string
  e_invoice_enabled: boolean
  total_revenue: number
}

interface CustomerSegment {
  customer_id: string
  segment: string
  total_spent: number
  last_purchase_date: string | null
  days_since_last_purchase: number
  purchase_count: number
}

export default function CustomersPage() {
  const { t } = useLanguage()
  const { tenantId, loading: tenantLoading } = useTenant()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false)
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false)
  const [isSubBranchesSheetOpen, setIsSubBranchesSheetOpen] = useState(false)
  const [selectedCustomerForBranches, setSelectedCustomerForBranches] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchCustomers()
    }
  }, [tenantId, tenantLoading])

  useEffect(() => {
    filterCustomers()
  }, [searchQuery, segmentFilter, customers, customerSegments])

  async function fetchCustomers() {
    if (!tenantId) return

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCustomers(data || [])
      await calculateCustomerSegments(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  async function calculateCustomerSegments(customersData: Customer[]) {
    if (!tenantId) return

    try {
      const segments: CustomerSegment[] = []

      for (const customer of customersData) {
        const { data: invoices } = await supabase
          .from('invoices')
          .select('amount, created_at')
          .eq('customer_id', customer.id)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })

        const totalSpent = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0
        const purchaseCount = invoices?.length || 0
        const lastPurchase = invoices?.[0]?.created_at || null
        const daysSinceLastPurchase = lastPurchase
          ? Math.floor((Date.now() - new Date(lastPurchase).getTime()) / (1000 * 60 * 60 * 24))
          : 999

        let segment = 'new_lead'
        if (purchaseCount === 0) {
          segment = 'new_lead'
        } else if (totalSpent > 10000 && daysSinceLastPurchase < 60) {
          segment = 'champion'
        } else if (daysSinceLastPurchase > 90) {
          segment = 'at_risk'
        } else {
          segment = 'regular'
        }

        segments.push({
          customer_id: customer.id,
          segment,
          total_spent: totalSpent,
          last_purchase_date: lastPurchase,
          days_since_last_purchase: daysSinceLastPurchase,
          purchase_count: purchaseCount
        })
      }

      setCustomerSegments(segments)
      setFilteredCustomers(customersData)
    } catch (error) {
      console.error('Error calculating segments:', error)
    }
  }

  function filterCustomers() {
    let filtered = customers

    if (segmentFilter !== 'all') {
      const segmentCustomerIds = customerSegments
        .filter(seg => seg.segment === segmentFilter)
        .map(seg => seg.customer_id)
      filtered = filtered.filter(c => segmentCustomerIds.includes(c.id))
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (customer) =>
          customer.company_title?.toLowerCase().includes(query) ||
          customer.name?.toLowerCase().includes(query) ||
          customer.tax_number?.includes(query) ||
          customer.email?.toLowerCase().includes(query)
      )
    }

    setFilteredCustomers(filtered)
  }

  function getCustomerSegment(customerId: string): CustomerSegment | undefined {
    return customerSegments.find(seg => seg.customer_id === customerId)
  }

  function getSegmentBadge(segment: string) {
    switch (segment) {
      case 'champion':
        return <Badge className="bg-purple-500">{t.customers.champion}</Badge>
      case 'at_risk':
        return <Badge className="bg-amber-500">{t.customers.atRisk}</Badge>
      case 'new_lead':
        return <Badge className="bg-blue-500">{t.customers.newLead}</Badge>
      case 'regular':
        return <Badge className="bg-green-500">{t.customers.regular}</Badge>
      default:
        return null
    }
  }

  const segmentCounts = {
    champions: customerSegments.filter(s => s.segment === 'champion').length,
    atRisk: customerSegments.filter(s => s.segment === 'at_risk').length,
    newLeads: customerSegments.filter(s => s.segment === 'new_lead').length,
    regular: customerSegments.filter(s => s.segment === 'regular').length
  }

  function handleRowClick(customer: Customer, e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) {
      return
    }
    setSelectedCustomer(customer)
    setIsDetailSheetOpen(true)
  }

  function handleEdit(customer: Customer, e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedCustomer(customer)
    setIsEditDialogOpen(true)
  }

  function handleDeleteClick(customerId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setCustomerToDelete(customerId)
    setIsDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!customerToDelete || !tenantId) return

    try {
      const [invoicesResult, proposalsResult, transactionsResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('id')
          .eq('customer_id', customerToDelete)
          .eq('tenant_id', tenantId)
          .limit(1),
        supabase
          .from('proposals')
          .select('id')
          .eq('customer_id', customerToDelete)
          .eq('tenant_id', tenantId)
          .limit(1),
        supabase
          .from('transactions')
          .select('id')
          .eq('entity_id', customerToDelete)
          .eq('entity_type', 'customer')
          .eq('tenant_id', tenantId)
          .limit(1)
      ])

      const hasInvoices = invoicesResult.data && invoicesResult.data.length > 0
      const hasProposals = proposalsResult.data && proposalsResult.data.length > 0
      const hasTransactions = transactionsResult.data && transactionsResult.data.length > 0

      if (hasInvoices || hasProposals || hasTransactions) {
        const relations: string[] = []
        if (hasInvoices) relations.push('invoices')
        if (hasProposals) relations.push('proposals')
        if (hasTransactions) relations.push('payments')

        toast.error(
          `This customer has existing ${relations.join(', ')} and cannot be deleted. Please deactivate the customer instead.`,
          { duration: 6000 }
        )

        const { error: updateError } = await supabase
          .from('customers')
          .update({ status: 'inactive' })
          .eq('id', customerToDelete)
          .eq('tenant_id', tenantId)

        if (updateError) throw updateError

        toast.success('Customer has been deactivated instead')
        fetchCustomers()
      } else {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', customerToDelete)
          .eq('tenant_id', tenantId)

        if (error) throw error

        toast.success(t.toast.customerDeleted)
        fetchCustomers()
      }
    } catch (error: any) {
      console.error('Error deleting customer:', error)
      toast.error(error.message || t.customers.failedToDelete)
    } finally {
      setIsDeleteDialogOpen(false)
      setCustomerToDelete(null)
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return

    try {
      const customerIds = Array.from(selectedIds)
      const customersToDeactivate: string[] = []
      const customersToDelete: string[] = []

      for (const customerId of customerIds) {
        const [invoicesResult, proposalsResult, transactionsResult] = await Promise.all([
          supabase.from('invoices').select('id').eq('customer_id', customerId).eq('tenant_id', tenantId).limit(1),
          supabase.from('proposals').select('id').eq('customer_id', customerId).eq('tenant_id', tenantId).limit(1),
          supabase.from('transactions').select('id').eq('entity_id', customerId).eq('entity_type', 'customer').eq('tenant_id', tenantId).limit(1)
        ])

        const hasRelations =
          (invoicesResult.data?.length ?? 0) > 0 ||
          (proposalsResult.data?.length ?? 0) > 0 ||
          (transactionsResult.data?.length ?? 0) > 0

        if (hasRelations) {
          customersToDeactivate.push(customerId)
        } else {
          customersToDelete.push(customerId)
        }
      }

      if (customersToDeactivate.length > 0) {
        await supabase.from('customers').update({ status: 'inactive' }).in('id', customersToDeactivate).eq('tenant_id', tenantId)
      }
      if (customersToDelete.length > 0) {
        await supabase.from('customers').delete().in('id', customersToDelete).eq('tenant_id', tenantId)
      }

      const msg: string[] = []
      if (customersToDelete.length > 0) msg.push(`${customersToDelete.length} silindi`)
      if (customersToDeactivate.length > 0) msg.push(`${customersToDeactivate.length} devre dışı bırakıldı`)
      toast.success(msg.join(', '))
      setSelectedIds(new Set())
      fetchCustomers()
    } catch (error: any) {
      toast.error(error.message || t.customers.failedToDeleteMultiple)
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  function toggleSelectAll() {
    setSelectedIds(prev =>
      prev.size === filteredCustomers.length ? new Set() : new Set(filteredCustomers.map(c => c.id))
    )
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function toggleCustomerStatus(customer: Customer, e: React.MouseEvent) {
    e.stopPropagation()
    const newStatus = customer.status === 'active' ? 'inactive' : 'active'

    try {
      const { error } = await supabase
        .from('customers')
        .update({ status: newStatus })
        .eq('id', customer.id)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast.success(t.customers.customerStatusUpdated.replace('{status}', newStatus === 'active' ? t.customers.activated : t.customers.deactivated))
      fetchCustomers()
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error(error.message || t.customers.failedToUpdateStatus)
    }
  }

  const getAccountTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      customer: 'bg-blue-100 text-blue-800',
      vendor: 'bg-purple-100 text-purple-800',
      both: 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-[#00D4AA] text-white'
      : 'bg-gray-400 text-white'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.customers.title}</h1>
            <p className="text-gray-500 mt-1">{t.customers.manageCustomersVendors}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsMergeDialogOpen(true)}
            >
              <GitMerge className="mr-2 h-4 w-4" />
              Cari Birleştir
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsCsvImportOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              {t.common.csvImport}
            </Button>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-[#00D4AA] hover:bg-[#00B894]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.customers.addCustomer}
            </Button>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-3 flex items-center justify-between">
              <span className="text-sm font-medium">{selectedIds.size} {t.common.selected}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                  {t.common.cancel}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setCustomerToDelete(null)
                    setIsDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t.common.bulkDelete}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-1" />
              <div className="flex-1">
                <CardTitle className="text-purple-900">{t.customers.customerHealth}</CardTitle>
                <CardDescription className="text-purple-700 mt-1">
                  {t.customers.customerHealthDesc}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-white cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSegmentFilter('champion')}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0A192F]">{t.customers.champions}</p>
                      <p className="text-2xl font-bold text-purple-600">{segmentCounts.champions}</p>
                      <p className="text-xs text-[#475569] mt-1">{t.customers.highSpendActive}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSegmentFilter('regular')}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0A192F]">{t.customers.regular}</p>
                      <p className="text-2xl font-bold text-green-600">{segmentCounts.regular}</p>
                      <p className="text-xs text-[#475569] mt-1">{t.customers.consistentBuyers}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSegmentFilter('at_risk')}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0A192F]">{t.customers.atRiskCustomers}</p>
                      <p className="text-2xl font-bold text-amber-600">{segmentCounts.atRisk}</p>
                      <p className="text-xs text-[#475569] mt-1">{t.customers.haventOrderedLately}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSegmentFilter('new_lead')}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0A192F]">{t.customers.newLeads}</p>
                      <p className="text-2xl font-bold text-blue-600">{segmentCounts.newLeads}</p>
                      <p className="text-xs text-[#475569] mt-1">{t.customers.noPurchasesYet}</p>
                    </div>
                    <Sparkles className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Tabs value={segmentFilter} onValueChange={setSegmentFilter}>
                <TabsList>
                  <TabsTrigger value="all" className="data-[state=inactive]:text-[#0A192F]">{t.customers.allCustomers}</TabsTrigger>
                  <TabsTrigger value="champion" className="data-[state=inactive]:text-[#0A192F]">{t.customers.champions}</TabsTrigger>
                  <TabsTrigger value="regular" className="data-[state=inactive]:text-[#0A192F]">{t.customers.regular}</TabsTrigger>
                  <TabsTrigger value="at_risk" className="data-[state=inactive]:text-[#0A192F]">{t.customers.atRiskCustomers}</TabsTrigger>
                  <TabsTrigger value="new_lead" className="data-[state=inactive]:text-[#0A192F]">{t.customers.newLeads}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder={t.common.search + "..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-gray-500">
                {t.customers.customersOfTotal.replace('{filtered}', filteredCustomers.length.toString()).replace('{total}', customers.length.toString())}
              </div>
            </div>

            <div className="border rounded-lg overflow-x-auto overflow-y-hidden">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="h-8 w-4 min-w-4 max-w-4 p-0.5 text-center align-middle">
                      <div className="inline-flex items-center justify-center w-4 h-6">
                        <Checkbox
                          size="sm"
                          checked={filteredCustomers.length > 0 && selectedIds.size === filteredCustomers.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">{t.customers.companyTitle}</TableHead>
                    <TableHead className="font-semibold">{t.customers.type}</TableHead>
                    <TableHead className="font-semibold">{t.customers.segment}</TableHead>
                    <TableHead className="font-semibold">{t.customers.taxNumber}</TableHead>
                    <TableHead className="font-semibold text-right">{t.customers.balance}</TableHead>
                    <TableHead className="font-semibold">{t.common.status}</TableHead>
                    <TableHead className="font-semibold">{t.customers.eInvoice}</TableHead>
                    <TableHead className="font-semibold w-24">{t.common.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                        {searchQuery || segmentFilter !== 'all' ? t.customers.noCustomersFound : t.customers.noCustomersYet}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={(e) => handleRowClick(customer, e)}
                      >
                        <TableCell className="w-4 min-w-4 max-w-4 p-0.5 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-center w-4 h-6">
                            <Checkbox
                              size="sm"
                              checked={selectedIds.has(customer.id)}
                              onCheckedChange={() => toggleSelect(customer.id)}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {customer.company_title || customer.name}
                            </div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getAccountTypeBadge(customer.account_type)}>
                            {customer.account_type === 'customer' ? t.customers.typeCustomer :
                             customer.account_type === 'vendor' ? t.customers.typeVendor :
                             t.customers.typeBoth}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getCustomerSegment(customer.id) && getSegmentBadge(getCustomerSegment(customer.id)!.segment)}
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{customer.tax_number || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{customer.tax_office}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${
                            customer.balance >= 0 ? 'text-[#00D4AA]' : 'text-red-600'
                          }`}>
                            ${customer.balance?.toLocaleString() || '0'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(customer.status)}>
                            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {customer.e_invoice_enabled ? (
                            <Badge className="bg-[#00D4AA] text-white shadow-lg shadow-[#00D4AA]/30">
                              <span className="relative flex h-2 w-2 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                              </span>
                              {t.customers.eInvoice}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-800">
                                {t.common.actions}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e: any) => handleEdit(customer, e)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                {t.common.edit}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e: any) => {
                                e.stopPropagation()
                                setSelectedCustomerForBranches(customer.id)
                                setIsSubBranchesSheetOpen(true)
                              }}>
                                <Building2 className="h-4 w-4 mr-2" />
                                Şube / Alt Cariler
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e: any) => toggleCustomerStatus(customer, e)}>
                                {customer.status === 'active' ? t.customers.deactivate : t.customers.activate}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e: any) => handleDeleteClick(customer.id, e)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t.common.delete}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddCustomerDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={fetchCustomers}
      />

      <EditCustomerDialog
        customer={selectedCustomer}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={fetchCustomers}
      />

      <CustomerDetailSheet
        customer={selectedCustomer}
        isOpen={isDetailSheetOpen}
        onClose={() => setIsDetailSheetOpen(false)}
      />

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open)
          if (!open) {
            setCustomerToDelete(null)
            setSelectedIds(new Set())
          }
        }}
        onConfirm={customerToDelete ? handleDelete : handleBulkDelete}
        itemCount={customerToDelete ? 1 : selectedIds.size}
      />

      <MergeCustomersDialog
        isOpen={isMergeDialogOpen}
        onClose={() => setIsMergeDialogOpen(false)}
        onSuccess={fetchCustomers}
      />

      <CustomerCsvImportDialog
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onSuccess={fetchCustomers}
      />

      <CustomerSubBranchesSheet
        customerId={selectedCustomerForBranches}
        isOpen={isSubBranchesSheetOpen}
        onClose={() => {
          setIsSubBranchesSheetOpen(false)
          setSelectedCustomerForBranches(null)
        }}
      />

      <Toaster />
    </DashboardLayout>
  )
}
