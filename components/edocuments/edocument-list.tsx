'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Loader2, Search, MoreVertical, Eye, FileText, Download, ArrowUpRight, ArrowDownLeft,
  RefreshCw, CheckCircle2, XCircle, Clock, Send, AlertTriangle,
} from 'lucide-react'

interface EdocumentListProps {
  tenantId: string
  language: 'en' | 'tr'
  translations: Record<string, string>
  onViewDocument: (doc: Edocument) => void
}

interface Edocument {
  id: string
  document_type: string
  direction: string
  ettn: string | null
  invoice_number: string | null
  status: string
  sender_title: string | null
  receiver_title: string | null
  issue_date: string
  currency: string
  grand_total: number
  invoice_type: string | null
  created_at: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  queued: 'bg-amber-50 text-amber-700 border-amber-200',
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  delivered: 'bg-teal-50 text-teal-700 border-teal-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
}

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  draft: Clock,
  queued: RefreshCw,
  sent: Send,
  delivered: CheckCircle2,
  accepted: CheckCircle2,
  rejected: XCircle,
  cancelled: AlertTriangle,
}

export function EdocumentList({ tenantId, language, translations: t, onViewDocument }: EdocumentListProps) {
  const [documents, setDocuments] = useState<Edocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadDocuments()
  }, [tenantId])

  async function loadDocuments() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('edocuments')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setDocuments(data || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = documents.filter(doc => {
    if (typeFilter !== 'all' && doc.document_type !== typeFilter) return false
    if (directionFilter !== 'all' && doc.direction !== directionFilter) return false
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        doc.invoice_number?.toLowerCase().includes(q) ||
        doc.ettn?.toLowerCase().includes(q) ||
        doc.sender_title?.toLowerCase().includes(q) ||
        doc.receiver_title?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const docTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      efatura: t.efatura,
      earsiv: t.earsiv,
      edespatch: t.edespatch,
      esmm: t.esmm,
      emm: t.emm,
      ebook: t.ebook,
    }
    return map[type] || type
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: t.draft,
      queued: t.queued,
      sent: t.sent,
      delivered: t.delivered,
      accepted: t.accepted,
      rejected: t.rejected,
      cancelled: t.cancelled,
    }
    return map[status] || status
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }
    return `${symbols[currency] || ''}${amount.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'tr' ? 'ETTN, fatura no, firma ara...' : 'Search ETTN, invoice number, company...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t.documentType} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'tr' ? 'Tümü' : 'All'}</SelectItem>
            <SelectItem value="efatura">{t.efatura}</SelectItem>
            <SelectItem value="earsiv">{t.earsiv}</SelectItem>
            <SelectItem value="edespatch">{t.edespatch}</SelectItem>
            <SelectItem value="esmm">{t.esmm}</SelectItem>
            <SelectItem value="emm">{t.emm}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={t.direction} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'tr' ? 'Tümü' : 'All'}</SelectItem>
            <SelectItem value="incoming">{t.incoming}</SelectItem>
            <SelectItem value="outgoing">{t.outgoing}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'tr' ? 'Tümü' : 'All'}</SelectItem>
            <SelectItem value="draft">{t.draft}</SelectItem>
            <SelectItem value="queued">{t.queued}</SelectItem>
            <SelectItem value="sent">{t.sent}</SelectItem>
            <SelectItem value="delivered">{t.delivered}</SelectItem>
            <SelectItem value="accepted">{t.accepted}</SelectItem>
            <SelectItem value="rejected">{t.rejected}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={loadDocuments}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">{t.direction}</TableHead>
                <TableHead>{t.documentType}</TableHead>
                <TableHead>{t.invoiceNumber}</TableHead>
                <TableHead className="hidden md:table-cell">{t.ettn}</TableHead>
                <TableHead>{language === 'tr' ? 'Firma' : 'Company'}</TableHead>
                <TableHead>{t.issueDate}</TableHead>
                <TableHead className="text-right">{t.grandTotal}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{language === 'tr' ? 'Henüz e-belge yok' : 'No e-documents yet'}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((doc) => {
                  const StatusIcon = statusIcons[doc.status] || Clock
                  return (
                    <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewDocument(doc)}>
                      <TableCell>
                        {doc.direction === 'incoming' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                            <ArrowDownLeft className="mr-1 h-3 w-3" />
                            {t.incoming}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px]">
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                            {t.outgoing}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium">{docTypeLabel(doc.document_type)}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{doc.invoice_number || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-[11px] text-muted-foreground">
                        {doc.ettn ? `${doc.ettn.slice(0, 8)}...` : '-'}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {doc.direction === 'incoming' ? doc.sender_title : doc.receiver_title || '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {doc.issue_date ? new Date(doc.issue_date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US') : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatCurrency(doc.grand_total, doc.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[doc.status] || ''}`}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusLabel(doc.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDocument(doc) }}>
                              <Eye className="mr-2 h-4 w-4" />
                              {language === 'tr' ? 'Detay' : 'View'}
                            </DropdownMenuItem>
                            {doc.ettn && (
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                {t.viewXml}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
