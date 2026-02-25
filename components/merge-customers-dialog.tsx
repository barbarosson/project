'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/language-context'
import { useTenant } from '@/contexts/tenant-context'
import { useCurrency } from '@/contexts/currency-context'
import { useAuth } from '@/hooks/use-auth'
import { AlertCircle, CheckCircle2, Users, ArrowRight } from 'lucide-react'

interface MergeCustomersDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function MergeCustomersDialog({
  isOpen,
  onClose,
  onSuccess,
}: MergeCustomersDialogProps) {
  const { t } = useLanguage()
  const { tenantId } = useTenant()
  const { user } = useAuth()
  const { formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [targetCustomerId, setTargetCustomerId] = useState('')
  const [sourceCustomerIds, setSourceCustomerIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)

  useEffect(() => {
    if (isOpen && tenantId) {
      fetchCustomers()
    }
  }, [isOpen, tenantId])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('company_title')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Cariler yüklenemedi')
    }
  }

  const toggleSourceCustomer = (customerId: string) => {
    if (sourceCustomerIds.includes(customerId)) {
      setSourceCustomerIds(sourceCustomerIds.filter(id => id !== customerId))
    } else {
      setSourceCustomerIds([...sourceCustomerIds, customerId])
    }
  }

  const getCustomerById = (id: string) => {
    return customers.find(c => c.id === id)
  }

  const previewMerge = async () => {
    if (!targetCustomerId || sourceCustomerIds.length === 0) {
      toast.error('Lütfen hedef cari ve birleştirilecek carileri seçin')
      return
    }

    if (sourceCustomerIds.includes(targetCustomerId)) {
      toast.error('Hedef cari ile kaynak cariler aynı olamaz')
      return
    }

    setLoading(true)
    try {
      // Count related records for each source customer
      const counts = await Promise.all(
        sourceCustomerIds.map(async (sourceId) => {
          const [invoices, orders, transactions] = await Promise.all([
            supabase
              .from('invoices')
              .select('id', { count: 'exact', head: true })
              .eq('customer_id', sourceId),
            supabase
              .from('orders')
              .select('id', { count: 'exact', head: true })
              .eq('customer_id', sourceId),
            supabase
              .from('transactions')
              .select('id', { count: 'exact', head: true })
              .eq('customer_id', sourceId)
          ])

          return {
            customerId: sourceId,
            invoices: invoices.count || 0,
            orders: orders.count || 0,
            transactions: transactions.count || 0
          }
        })
      )

      setPreviewData(counts)
      setShowConfirmation(true)
    } catch (error) {
      console.error('Error previewing merge:', error)
      toast.error('Önizleme oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  const executeMerge = async () => {
    if (!user?.id) {
      toast.error('Kullanıcı bilgisi bulunamadı')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('merge_customers', {
        target_id: targetCustomerId,
        source_ids: sourceCustomerIds,
        tenant_id_param: tenantId,
        merged_by_param: user.id,
        notes_param: notes || null
      })

      if (error) throw error

      toast.success(
        `${sourceCustomerIds.length} cari başarıyla birleştirildi. ` +
        `${data.total_invoices_transferred} fatura, ` +
        `${data.total_orders_transferred} sipariş, ` +
        `${data.total_transactions_transferred} işlem aktarıldı.`
      )

      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Error merging customers:', error)
      toast.error(error.message || 'Cariler birleştirilemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTargetCustomerId('')
    setSourceCustomerIds([])
    setNotes('')
    setShowConfirmation(false)
    setPreviewData(null)
    onClose()
  }

  const targetCustomer = getCustomerById(targetCustomerId)
  const sourceCustomers = sourceCustomerIds.map(id => getCustomerById(id)).filter(Boolean)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cari Birleştirme
          </DialogTitle>
          <DialogDescription>
            Birden fazla cariyi tek bir cari altında birleştirin. Tüm faturalar, siparişler ve işlemler hedef cariye aktarılacak.
          </DialogDescription>
        </DialogHeader>

        {!showConfirmation ? (
          <div className="space-y-6 mt-4">
            {/* Warning Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Dikkat!</strong> Bu işlem geri alınamaz. Seçilen cariler silinecek ve tüm kayıtları hedef cariye aktarılacaktır.
              </AlertDescription>
            </Alert>

            {/* Target Customer Selection */}
            <div className="space-y-2">
              <Label htmlFor="target_customer">
                Hedef Cari (Ana Cari) <span className="text-red-500">*</span>
              </Label>
              <Select value={targetCustomerId} onValueChange={setTargetCustomerId}>
                <SelectTrigger id="target_customer">
                  <SelectValue placeholder="Hedef cari seçin..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.company_title || customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Tüm kayıtlar bu cariye aktarılacak
              </p>
            </div>

            {/* Source Customers Selection */}
            <div className="space-y-2">
              <Label>
                Birleştirilecek Cariler <span className="text-red-500">*</span>
              </Label>
              <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-2">
                {customers
                  .filter(c => c.id !== targetCustomerId)
                  .map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                    >
                      <Checkbox
                        size="sm"
                        id={`customer-${customer.id}`}
                        checked={sourceCustomerIds.includes(customer.id)}
                        onCheckedChange={() => toggleSourceCustomer(customer.id)}
                      />
                      <label
                        htmlFor={`customer-${customer.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{customer.company_title}</div>
                        <div className="text-sm text-gray-500">{customer.name}</div>
                      </label>
                      {customer.balance !== 0 && (
                        <Badge variant="secondary">
                          {formatCurrency(customer.balance)}
                        </Badge>
                      )}
                    </div>
                  ))}
              </div>
              <p className="text-xs text-gray-500">
                {sourceCustomerIds.length} cari seçildi
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="merge_notes">Notlar (İsteğe Bağlı)</Label>
              <Textarea
                id="merge_notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Birleştirme sebebi veya notlar..."
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Confirmation View */}
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Son kontrol! Aşağıdaki işlem gerçekleştirilecek:
              </AlertDescription>
            </Alert>

            {/* Merge Preview */}
            <div className="space-y-4">
              {/* Target */}
              {targetCustomer && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-semibold text-green-900 mb-1">
                    Hedef Cari (Tüm kayıtlar buraya taşınacak)
                  </div>
                  <div className="text-green-800">{targetCustomer.company_title}</div>
                  <div className="text-sm text-green-700">{targetCustomer.name}</div>
                </div>
              )}

              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-gray-400" />
              </div>

              {/* Sources */}
              <div className="space-y-2">
                <div className="font-semibold text-red-900 mb-2">
                  Silinecek Cariler ({sourceCustomers.length})
                </div>
                {previewData && sourceCustomers.map((customer, index) => {
                  const counts = previewData.find((p: any) => p.customerId === customer.id)
                  return (
                    <div
                      key={customer.id}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-red-900">
                            {customer.company_title}
                          </div>
                          <div className="text-sm text-red-700">{customer.name}</div>
                        </div>
                        {counts && (
                          <div className="text-right text-xs text-red-700">
                            <div>{counts.invoices} Fatura</div>
                            <div>{counts.orders} Sipariş</div>
                            <div>{counts.transactions} İşlem</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {notes && (
              <div className="p-3 bg-gray-50 rounded text-sm">
                <div className="font-medium mb-1">Not:</div>
                <div className="text-gray-700">{notes}</div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={showConfirmation ? () => setShowConfirmation(false) : handleClose}
          >
            {showConfirmation ? 'Geri' : t.common.cancel}
          </Button>
          {!showConfirmation ? (
            <Button
              onClick={previewMerge}
              disabled={loading || !targetCustomerId || sourceCustomerIds.length === 0}
            >
              {loading ? 'Yükleniyor...' : 'Devam Et'}
            </Button>
          ) : (
            <Button
              onClick={executeMerge}
              disabled={loading}
              variant="destructive"
            >
              {loading ? 'Birleştiriliyor...' : 'Onayla ve Birleştir'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
