'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Phone, MapPin, Building2, FileText, DollarSign, Globe, CreditCard, Calendar, StickyNote } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

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
  city?: string
  district?: string
  postal_code?: string
  country?: string
  payment_terms?: number
  payment_terms_type?: string
  bank_name?: string
  bank_account_holder?: string
  bank_account_number?: string
  bank_iban?: string
  bank_branch?: string
  bank_swift?: string
  website?: string
  industry?: string
  notes?: string
  balance: number
  status: string
  e_invoice_enabled: boolean
  total_revenue: number
}

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
}

interface CustomerDetailSheetProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
}

export function CustomerDetailSheet({ customer, isOpen, onClose }: CustomerDetailSheetProps) {
  const { t } = useLanguage()
  if (!customer) return null

  const mockTransactions: Transaction[] = [
    { id: '1', date: '2026-01-20', description: 'Invoice #INV-1001', amount: 5000, type: 'debit' },
    { id: '2', date: '2026-01-18', description: 'Payment Received', amount: 3000, type: 'credit' },
    { id: '3', date: '2026-01-15', description: 'Invoice #INV-0998', amount: 2500, type: 'debit' },
    { id: '4', date: '2026-01-10', description: 'Payment Received', amount: 2500, type: 'credit' },
    { id: '5', date: '2026-01-05', description: 'Invoice #INV-0992', amount: 4000, type: 'debit' },
  ]

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'customer':
        return 'bg-blue-100 text-blue-800'
      case 'vendor':
        return 'bg-purple-100 text-purple-800'
      case 'both':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-[#00D4AA] text-white'
      : 'bg-gray-400 text-white'
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">{customer.company_title || customer.name}</SheetTitle>
          <SheetDescription>
            Customer details and transaction history
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge className={getAccountTypeColor(customer.account_type)}>
              {customer.account_type.charAt(0).toUpperCase() + customer.account_type.slice(1)}
            </Badge>
            <Badge className={getStatusColor(customer.status)}>
              {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
            </Badge>
            {customer.e_invoice_enabled && (
              <Badge className="bg-[#00D4AA] text-white animate-pulse">
                E-Invoice
              </Badge>
            )}
            {customer.industry && (
              <Badge variant="outline">{customer.industry}</Badge>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={20} className="text-gray-400" />
                <span className="text-sm text-gray-600">{t.customers.balance}</span>
              </div>
              <span className={`text-2xl font-bold ${customer.balance >= 0 ? 'text-[#00D4AA]' : 'text-red-600'}`}>
                ${customer.balance.toLocaleString()}
              </span>
            </div>
          </div>

          <Tabs defaultValue="contact" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="bank">Bank</TabsTrigger>
            </TabsList>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  {customer.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-gray-700">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-gray-700">{customer.phone}</span>
                    </div>
                  )}
                  {customer.website && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe size={16} className="text-gray-400" />
                      <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {customer.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Tax Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 size={16} className="text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Tax Office</div>
                      <div className="text-gray-700">{customer.tax_office || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FileText size={16} className="text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">{t.customers.taxNumber}</div>
                      <div className="text-gray-700 font-mono">{customer.tax_number || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Full Address</h3>
                <div className="space-y-3">
                  {customer.address && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin size={16} className="text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-gray-700">{customer.address}</div>
                        {(customer.district || customer.city) && (
                          <div className="text-gray-600 mt-1">
                            {[customer.district, customer.city].filter(Boolean).join(', ')}
                          </div>
                        )}
                        {(customer.postal_code || customer.country) && (
                          <div className="text-gray-600 mt-1">
                            {[customer.postal_code, customer.country].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {!customer.address && (
                    <div className="text-sm text-gray-500">No address information</div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Terms</h3>
                <div className="space-y-3">
                  {customer.payment_terms !== undefined && customer.payment_terms > 0 ? (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar size={16} className="text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Payment Due</div>
                        <div className="text-gray-700">
                          {customer.payment_terms} days ({customer.payment_terms_type || 'net'})
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No payment terms set</div>
                  )}
                </div>
              </div>

              {customer.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Internal Notes</h3>
                    <div className="flex items-start gap-3 text-sm">
                      <StickyNote size={16} className="text-gray-400 mt-0.5" />
                      <div className="text-gray-700 whitespace-pre-wrap">{customer.notes}</div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="bank" className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Bank Information</h3>
                <div className="space-y-3">
                  {customer.bank_name ? (
                    <>
                      <div className="flex items-center gap-3 text-sm">
                        <CreditCard size={16} className="text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500">Bank Name</div>
                          <div className="text-gray-700">{customer.bank_name}</div>
                        </div>
                      </div>
                      {customer.bank_account_holder && (
                        <div className="text-sm">
                          <div className="text-xs text-gray-500">Account Holder</div>
                          <div className="text-gray-700">{customer.bank_account_holder}</div>
                        </div>
                      )}
                      {customer.bank_branch && (
                        <div className="text-sm">
                          <div className="text-xs text-gray-500">Branch</div>
                          <div className="text-gray-700">{customer.bank_branch}</div>
                        </div>
                      )}
                      {customer.bank_iban && (
                        <div className="text-sm">
                          <div className="text-xs text-gray-500">IBAN</div>
                          <div className="text-gray-700 font-mono">{customer.bank_iban}</div>
                        </div>
                      )}
                      {customer.bank_account_number && (
                        <div className="text-sm">
                          <div className="text-xs text-gray-500">Account Number</div>
                          <div className="text-gray-700 font-mono">{customer.bank_account_number}</div>
                        </div>
                      )}
                      {customer.bank_swift && (
                        <div className="text-sm">
                          <div className="text-xs text-gray-500">SWIFT/BIC</div>
                          <div className="text-gray-700 font-mono">{customer.bank_swift}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">No bank information</div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Transactions</h3>
            <div className="space-y-2">
              {mockTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                    <div className="text-xs text-gray-500 mt-1">{transaction.date}</div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    transaction.type === 'credit' ? 'text-[#00D4AA]' : 'text-gray-900'
                  }`}>
                    {transaction.type === 'credit' ? '+' : ''}{transaction.type === 'debit' ? '-' : ''}${transaction.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
