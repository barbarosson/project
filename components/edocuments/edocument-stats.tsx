'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { getAccountInfo } from '@/lib/nes-api'
import {
  FileText, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle,
  Coins, Loader2, RefreshCw,
} from 'lucide-react'

interface EdocumentStatsProps {
  tenantId: string
  language: 'en' | 'tr'
}

interface Stats {
  total: number
  incoming: number
  outgoing: number
  draft: number
  sent: number
  accepted: number
  rejected: number
}

interface AccountInfo {
  credits: number | null
  loading: boolean
  error: string | null
}

export function EdocumentStats({ tenantId, language }: EdocumentStatsProps) {
  const [stats, setStats] = useState<Stats>({
    total: 0, incoming: 0, outgoing: 0, draft: 0, sent: 0, accepted: 0, rejected: 0,
  })
  const [account, setAccount] = useState<AccountInfo>({ credits: null, loading: false, error: null })

  useEffect(() => {
    loadStats()
    loadAccountInfo()
  }, [tenantId])

  async function loadStats() {
    const { data } = await supabase
      .from('edocuments')
      .select('direction, status')
      .eq('tenant_id', tenantId)

    if (data) {
      setStats({
        total: data.length,
        incoming: data.filter(d => d.direction === 'incoming').length,
        outgoing: data.filter(d => d.direction === 'outgoing').length,
        draft: data.filter(d => d.status === 'draft').length,
        sent: data.filter(d => ['sent', 'queued', 'delivered'].includes(d.status)).length,
        accepted: data.filter(d => d.status === 'accepted').length,
        rejected: data.filter(d => d.status === 'rejected').length,
      })
    }
  }

  async function loadAccountInfo() {
    setAccount(prev => ({ ...prev, loading: true, error: null }))
    try {
      const result = await getAccountInfo(tenantId)
      const accountData = result?.Result || result
      let credits: number | null = null

      if (accountData?.RemainingCredit !== undefined) {
        credits = accountData.RemainingCredit
      } else if (accountData?.Credit !== undefined) {
        credits = accountData.Credit
      } else if (accountData?.Balance !== undefined) {
        credits = accountData.Balance
      }

      setAccount({ credits, loading: false, error: null })
    } catch (err: any) {
      const msg = err?.message || ''
      const isConnection = msg.includes('baglantilamadi') || msg.includes('dns error') || msg.includes('Name or service not known')
      setAccount({ credits: null, loading: false, error: isConnection ? 'connection' : 'failed' })
    }
  }

  const cards = [
    { label: language === 'tr' ? 'Toplam Belge' : 'Total Documents', value: stats.total, icon: FileText, color: 'text-[#0D1B2A]', bg: 'bg-[#0D1B2A]/5' },
    { label: language === 'tr' ? 'Gelen' : 'Incoming', value: stats.incoming, icon: ArrowDownLeft, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: language === 'tr' ? 'Giden' : 'Outgoing', value: stats.outgoing, icon: ArrowUpRight, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: language === 'tr' ? 'Taslak' : 'Draft', value: stats.draft, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: language === 'tr' ? 'Gonderilen' : 'Sent', value: stats.sent, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: language === 'tr' ? 'Reddedilen' : 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="overflow-hidden border-amber-200 bg-amber-50/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Coins className="h-4 w-4 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              {account.loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              ) : account.error ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-amber-600" title={account.error === 'connection' ? (language === 'tr' ? 'NES API sunucusuna ulasilamiyor' : 'Cannot reach NES API') : ''}>--</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={loadAccountInfo}>
                    <RefreshCw className="h-3 w-3 text-amber-600" />
                  </Button>
                </div>
              ) : (
                <p className="text-2xl font-bold tracking-tight text-amber-700">
                  {account.credits !== null ? account.credits.toLocaleString('tr-TR') : '--'}
                </p>
              )}
              <p className="text-[11px] text-amber-700/70 leading-tight">
                {language === 'tr' ? 'Kalan Kontor' : 'Credits Left'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
