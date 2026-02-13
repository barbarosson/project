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
import { Building2, Warehouse, Users, MapPin, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface SubBranch {
  id: string
  company_title: string
  name: string
  branch_type: string
  branch_code: string
  city: string
  phone: string
  email: string
  balance: number
  status: string
}

interface CustomerSubBranchesSheetProps {
  customerId: string | null
  isOpen: boolean
  onClose: () => void
}

export function CustomerSubBranchesSheet({
  customerId,
  isOpen,
  onClose,
}: CustomerSubBranchesSheetProps) {
  const { t } = useLanguage()
  const { tenantId } = useTenant()
  const [loading, setLoading] = useState(false)
  const [subBranches, setSubBranches] = useState<SubBranch[]>([])
  const [parentCustomer, setParentCustomer] = useState<any>(null)

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

  return (
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
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{branch.company_title}</h5>
                            {branch.branch_code && (
                              <Badge variant="secondary" className="text-xs">
                                {branch.branch_code}
                              </Badge>
                            )}
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

                      <div className="text-right">
                        <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                          {getBranchTypeLabel(branch.branch_type)}
                        </Badge>
                        <div className="mt-2">
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
              <li>Yeni cari eklerken "Bağlı Olduğu Ana Cari" alanından üst cari seçebilirsiniz</li>
              <li>Alt şubeler kendi faturaları, siparişleri ve ödemeleriyle yönetilir</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
