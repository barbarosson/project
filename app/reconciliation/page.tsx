'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/language-context'
import { useTenant } from '@/contexts/tenant-context'
import { useAuth } from '@/hooks/use-auth'
import {
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Filter,
  Calendar as CalendarIcon,
  Eye,
  MessageSquare,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0)

const STATUS_CONFIG: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; label: string; color: string }> = {
  pending: { variant: 'secondary', icon: Clock, label: 'Beklemede', color: 'text-gray-600' },
  sent: { variant: 'default', icon: Send, label: 'Gonderildi', color: 'text-blue-600' },
  agreed: { variant: 'default', icon: CheckCircle2, label: 'Mutabik', color: 'text-green-600' },
  disagreed: { variant: 'destructive', icon: XCircle, label: 'Mutabik Degil', color: 'text-red-600' },
  expired: { variant: 'secondary', icon: XCircle, label: 'Suresi Doldu', color: 'text-gray-500' },
}

export default function ReconciliationPage() {
  const { t } = useLanguage()
  const { tenantId } = useTenant()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [reconciliations, setReconciliations] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedRec, setSelectedRec] = useState<any>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [customerNotes, setCustomerNotes] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchCustomers = useCallback(async () => {
    if (!tenantId) return
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_title, name, email, balance')
        .eq('tenant_id', tenantId)
        .order('company_title')
      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }, [tenantId])

  const fetchReconciliations = useCallback(async () => {
    if (!tenantId) return
    try {
      let query = supabase
        .from('reconciliation_requests')
        .select(`
          *,
          customer:customers(company_title, name, email, tax_id, tax_office)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query
      if (error) throw error
      setReconciliations(data || [])
    } catch (error) {
      console.error('Error fetching reconciliations:', error)
    }
  }, [tenantId, filterStatus])

  useEffect(() => {
    if (tenantId) {
      fetchCustomers()
      fetchReconciliations()
    }
  }, [tenantId, fetchCustomers, fetchReconciliations])

  const generateReconciliation = async () => {
    if (!selectedCustomerId || !startDate || !endDate) {
      toast.error('Lutfen cari ve tarih araligini secin')
      return
    }

    setLoading(true)
    try {
      const { data: statementData, error: statementError } = await supabase.rpc(
        'generate_reconciliation_statement',
        {
          customer_id_param: selectedCustomerId,
          start_date_param: format(startDate, 'yyyy-MM-dd'),
          end_date_param: format(endDate, 'yyyy-MM-dd'),
          tenant_id_param: tenantId
        }
      )

      if (statementError) throw statementError

      const customer = customers.find(c => c.id === selectedCustomerId)
      const requestNumber = `MUT-${Date.now()}`

      const { data: insertedRow, error: insertError } = await supabase
        .from('reconciliation_requests')
        .insert([{
          tenant_id: tenantId,
          customer_id: selectedCustomerId,
          request_number: requestNumber,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          opening_balance: statementData.opening_balance,
          total_debits: statementData.total_debits,
          total_credits: statementData.total_credits,
          closing_balance: statementData.closing_balance,
          status: 'pending',
          sent_to_email: customer?.email,
          created_by: user?.id,
          details: statementData
        }])
        .select('*')
        .single()

      if (insertError) throw insertError

      toast.success('Mutabakat talebi olusturuldu: ' + requestNumber)
      if (insertedRow) {
        setReconciliations(prev => [{
          ...insertedRow,
          customer: customer ? { company_title: customer.company_title, name: customer.name, email: customer.email, tax_id: (customer as any).tax_id, tax_office: (customer as any).tax_office } : null
        }, ...prev])
      }
      setFilterStatus('all')
      await fetchReconciliations()
      setSelectedCustomerId('')
      setStartDate(undefined)
      setEndDate(undefined)
    } catch (error: any) {
      console.error('Error generating reconciliation:', error)
      toast.error(error.message || 'Mutabakat olusturulamadi')
    } finally {
      setLoading(false)
    }
  }

  const sendReconciliationEmail = async (rec: any) => {
    const recId = rec?.id ? String(rec.id) : null
    if (!recId) {
      toast.error('Mutabakat kaydi bulunamadi (id eksik). Sayfayi yenileyip tekrar deneyin.')
      return
    }
    setSendingId(recId)
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-reconciliation-email`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reconciliation_id: recId }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        const msg = [result?.error, result?.details].filter(Boolean).join(': ') || 'Email gonderilemedi'
        throw new Error(msg)
      }

      toast.success(`Mutabakat mektubu ${rec.sent_to_email || rec.customer?.email} adresine gonderildi`)
      fetchReconciliations()
    } catch (error: any) {
      console.error('Error sending email:', error)
      toast.error(error.message || 'E-posta gonderilemedi')
    } finally {
      setSendingId(null)
    }
  }

  const openLetterPreview = (rec: any) => {
    setSelectedRec(rec)
    setCustomerNotes(rec.customer_notes || '')
    setSheetOpen(true)
  }

  const updateReconciliationStatus = async (status: string) => {
    if (!selectedRec) return
    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from('reconciliation_requests')
        .update({
          status,
          customer_notes: customerNotes || null,
          response_received_at: new Date().toISOString(),
          response_method: 'manual',
        })
        .eq('id', selectedRec.id)

      if (error) throw error
      toast.success(`Durum guncellendi: ${STATUS_CONFIG[status]?.label || status}`)
      fetchReconciliations()
      setSelectedRec({ ...selectedRec, status, customer_notes: customerNotes, response_received_at: new Date().toISOString(), response_method: 'manual' })
    } catch (error: any) {
      toast.error(error.message || 'Durum guncellenemedi')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const stats = [
    { title: 'Toplam Mutabakat', value: reconciliations.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Gonderildi', value: reconciliations.filter(r => r.status === 'sent').length, icon: Send, color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'Mutabik', value: reconciliations.filter(r => r.status === 'agreed').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Mutabik Degil', value: reconciliations.filter(r => r.status === 'disagreed').length, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cari Mutabakat</h1>
            <p className="text-gray-500 mt-1">
              Carilerle bakiye mutabakati yapin ve e-posta ile gonderin
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchReconciliations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Yeni Mutabakat Talebi Olustur</CardTitle>
            <CardDescription>Cari secin ve tarih araligini belirleyin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Cari Secin</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Cari secin..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Donem (Baslangic – Bitis)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate && endDate
                        ? `${format(startDate, 'd MMM yyyy', { locale: tr })} – ${format(endDate, 'd MMM yyyy', { locale: tr })}`
                        : 'Tarih secin'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={startDate && endDate ? { from: startDate, to: endDate } : startDate ? { from: startDate, to: undefined } : undefined}
                      onSelect={(range: { from?: Date; to?: Date } | undefined) => {
                        if (range?.from) {
                          setStartDate(range.from)
                          setEndDate(range.to ?? range.from)
                        } else {
                          setStartDate(undefined)
                          setEndDate(undefined)
                        }
                      }}
                      numberOfMonths={1}
                      locale={tr}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button
              onClick={generateReconciliation}
              disabled={loading || !selectedCustomerId || !startDate || !endDate}
              className="w-full md:w-auto"
            >
              <FileText className="mr-2 h-4 w-4" />
              {loading ? 'Olusturuluyor...' : 'Mutabakat Olustur'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mutabakat Talepleri</CardTitle>
                <CardDescription>Tum mutabakat talepleri ve durumlari</CardDescription>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tumu</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="sent">Gonderildi</SelectItem>
                  <SelectItem value="agreed">Mutabik</SelectItem>
                  <SelectItem value="disagreed">Mutabik Degil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talep No</TableHead>
                    <TableHead>Cari</TableHead>
                    <TableHead>Donem</TableHead>
                    <TableHead className="text-right">Kapanis Bakiye</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Yanit</TableHead>
                    <TableHead>Islemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Henuz mutabakat talebi olusturulmamis
                      </TableCell>
                    </TableRow>
                  ) : (
                    reconciliations.map((rec) => (
                      <TableRow key={rec.id} className="group">
                        <TableCell className="font-mono text-sm font-medium">
                          {rec.request_number}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{rec.customer?.company_title}</div>
                          <div className="text-xs text-gray-500">{rec.sent_to_email || rec.customer?.email}</div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(rec.start_date), 'dd.MM.yy')} -{' '}
                          {format(new Date(rec.end_date), 'dd.MM.yy')}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(rec.closing_balance)}
                        </TableCell>
                        <TableCell>{getStatusBadge(rec.status)}</TableCell>
                        <TableCell>
                          {rec.response_received_at ? (
                            <div className="text-xs">
                              <div className="text-gray-500">
                                {format(new Date(rec.response_received_at), 'dd.MM.yy HH:mm')}
                              </div>
                              <div className="text-gray-400">{rec.response_method === 'email' ? 'E-posta ile' : 'Manuel'}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openLetterPreview(rec)}
                              title="Mektubu Gor"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(rec.status === 'pending' || rec.status === 'sent') && (
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-white border-0"
                                onClick={() => sendReconciliationEmail(rec)}
                                disabled={sendingId === rec.id}
                                title="E-posta Gonder"
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                {sendingId === rec.id ? '...' : 'Gonder'}
                              </Button>
                            )}
                          </div>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedRec && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Mutabakat Mektubu
                </SheetTitle>
                <SheetDescription>
                  {selectedRec.request_number}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between">
                  {getStatusBadge(selectedRec.status)}
                  {selectedRec.sent_at && (
                    <span className="text-xs text-gray-500">
                      Gonderim: {format(new Date(selectedRec.sent_at), 'dd.MM.yyyy HH:mm')}
                    </span>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
                    <h3 className="text-lg font-bold">Cari Mutabakat Mektubu</h3>
                    <p className="text-slate-300 text-sm mt-1">{selectedRec.request_number}</p>
                  </div>

                  <div className="p-6 space-y-5 bg-white">
                    <p className="text-sm">
                      Sayin <strong>{selectedRec.customer?.company_title}</strong>,
                    </p>
                    <p className="text-sm text-gray-600">
                      Asagida belirtilen donem icin hesap mutabakatinizi dikkatinize sunariz.
                      Lutfen kayitlarinizla karsilastirarak mutabakat durumunuzu bildiriniz.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Cari Unvan</div>
                        <div className="font-semibold text-sm mt-1">{selectedRec.customer?.company_title}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Yetkili</div>
                        <div className="font-semibold text-sm mt-1">{selectedRec.customer?.name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Vergi No / Dairesi</div>
                        <div className="font-semibold text-sm mt-1">
                          {selectedRec.customer?.tax_id || '-'} / {selectedRec.customer?.tax_office || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">E-posta</div>
                        <div className="font-semibold text-sm mt-1">{selectedRec.sent_to_email || selectedRec.customer?.email || '-'}</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Donem Baslangic</div>
                        <div className="font-semibold text-sm mt-1">
                          {format(new Date(selectedRec.start_date), 'dd MMMM yyyy', { locale: tr })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Donem Bitis</div>
                        <div className="font-semibold text-sm mt-1">
                          {format(new Date(selectedRec.end_date), 'dd MMMM yyyy', { locale: tr })}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-3 text-xs text-gray-500 uppercase">Kalem</th>
                            <th className="text-right p-3 text-xs text-gray-500 uppercase">Tutar</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t">
                            <td className="p-3">Donem Basi Bakiye (Acilis)</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(selectedRec.opening_balance)}</td>
                          </tr>
                          <tr className="border-t">
                            <td className="p-3">Toplam Borc</td>
                            <td className="p-3 text-right font-mono text-red-600">{formatCurrency(selectedRec.total_debits)}</td>
                          </tr>
                          <tr className="border-t">
                            <td className="p-3">Toplam Alacak</td>
                            <td className="p-3 text-right font-mono text-green-600">{formatCurrency(selectedRec.total_credits)}</td>
                          </tr>
                          <tr className="border-t-2 border-green-500 bg-green-50">
                            <td className="p-3 font-bold">Donem Sonu Bakiye (Kapanis)</td>
                            <td className="p-3 text-right font-mono font-bold text-lg">
                              {formatCurrency(selectedRec.closing_balance)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {selectedRec.response_received_at && (
                  <Card className={selectedRec.status === 'agreed' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Cari Yaniti
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        {getStatusBadge(selectedRec.status)}
                        <span className="text-xs text-gray-500">
                          {format(new Date(selectedRec.response_received_at), 'dd.MM.yyyy HH:mm')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Yanit yontemi: {selectedRec.response_method === 'email' ? 'E-posta uzerinden' : 'Manuel giris'}
                      </div>
                      {selectedRec.customer_notes && (
                        <div className="mt-2 p-3 bg-white rounded border text-sm">
                          {selectedRec.customer_notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Manuel Durum Guncelleme</Label>
                  <Textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Cari notu veya aciklama..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => updateReconciliationStatus('agreed')}
                      disabled={updatingStatus}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Mutabik
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => updateReconciliationStatus('disagreed')}
                      disabled={updatingStatus}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Mutabik Degil
                    </Button>
                  </div>
                </div>

                {(selectedRec.status === 'pending' || selectedRec.status === 'sent') && (
                  <>
                    <Separator />
                    <Button
                      className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-white border-0"
                      onClick={() => {
                        sendReconciliationEmail(selectedRec)
                        setSheetOpen(false)
                      }}
                      disabled={sendingId === selectedRec.id}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {sendingId === selectedRec.id ? 'Gonderiliyor...' : 'Mutabakat Mektubunu E-posta ile Gonder'}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
