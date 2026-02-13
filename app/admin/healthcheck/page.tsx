'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion'
import {
  Activity, Search, AlertTriangle, CheckCircle2, XCircle, Loader2,
  Database, Zap, Languages, Palette, Copy, Shield, Trash2,
  GitMerge, Download, RefreshCcw, Play, Clock, BarChart3,
  ChevronRight, FileText, Sparkles, Heart, Server, Eye
} from 'lucide-react'
import {
  runFullHealthCheck,
  type HealthCheckReport,
  type CheckResult,
  type CheckCategory,
  type CategorySummary,
} from '@/lib/healthcheck'

const CATEGORY_ICONS: Record<CheckCategory, typeof Database> = {
  database: Database,
  performance: Zap,
  translation: Languages,
  theme: Palette,
  duplicates: Copy,
  security: Shield,
  unused: Trash2,
  consistency: GitMerge,
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  pass: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  fail: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
  warning: { color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle },
  info: { color: 'text-sky-600', bg: 'bg-sky-50', icon: Eye },
  running: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Loader2 },
  pending: { color: 'text-gray-400', bg: 'bg-gray-50', icon: Clock },
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
}

function OverallGauge({ score, status }: { score: number; status: string }) {
  const color = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'
  const strokeColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label = score >= 80 ? 'SAGLIKLI' : score >= 50 ? 'UYARI' : 'KRITIK'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="58" fill="none" stroke="#f1f5f9" strokeWidth="12" />
          <circle
            cx="70" cy="70" r="58" fill="none"
            stroke={strokeColor}
            strokeWidth="12"
            strokeDasharray={`${(score / 100) * 364.4} 364.4`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color}`}>{Math.round(score)}</span>
          <span className="text-[10px] text-muted-foreground font-medium">/100</span>
        </div>
      </div>
      <Badge className={`${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'} text-white border-0 text-xs tracking-wider`}>
        {label}
      </Badge>
    </div>
  )
}

function CategoryCard({ summary }: { summary: CategorySummary }) {
  const Icon = CATEGORY_ICONS[summary.category] || Database
  const scoreColor = summary.score >= 80 ? 'text-emerald-600' : summary.score >= 50 ? 'text-amber-600' : 'text-red-600'
  const progressColor = summary.score >= 80 ? 'bg-emerald-500' : summary.score >= 50 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg ${summary.score >= 80 ? 'bg-emerald-50 text-emerald-600' : summary.score >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{summary.label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-emerald-600">{summary.passed} basarili</span>
                {summary.warnings > 0 && <span className="text-[10px] text-amber-600">{summary.warnings} uyari</span>}
                {summary.failed > 0 && <span className="text-[10px] text-red-600">{summary.failed} hata</span>}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className={`text-lg font-bold ${scoreColor}`}>{summary.score}</span>
            <Progress value={summary.score} className="h-1.5 w-16 mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CheckRow({ check }: { check: CheckResult }) {
  const conf = STATUS_CONFIG[check.status] || STATUS_CONFIG.pending
  const Icon = conf.icon
  const CatIcon = CATEGORY_ICONS[check.category] || Database

  return (
    <AccordionItem value={check.id} className="border rounded-lg mb-2 overflow-hidden">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/20">
        <div className="flex items-center gap-3 w-full">
          <Icon className={`h-4 w-4 flex-shrink-0 ${conf.color} ${check.status === 'running' ? 'animate-spin' : ''}`} />
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">{check.name}</span>
              <Badge className={`${SEVERITY_COLORS[check.severity]} border-0 text-[9px] px-1.5 py-0`}>
                {check.severity}
              </Badge>
            </div>
            <p className={`text-xs mt-0.5 ${conf.color}`}>{check.message}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {check.metric !== undefined && (
              <span className="text-sm font-mono font-bold text-slate-700">
                {check.metric}{check.metricLabel}
              </span>
            )}
            <CatIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        {check.details.length > 0 && (
          <div className="space-y-1 mb-3">
            {check.details.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        )}
        {check.fixable && check.fixAction && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-xs text-blue-700 flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>{check.fixAction}</span>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

export default function AdminHealthcheckPage() {
  const [report, setReport] = useState<HealthCheckReport | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [liveChecks, setLiveChecks] = useState<CheckResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [consoleLog, setConsoleLog] = useState<string[]>([])
  const consoleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [consoleLog])

  const log = (msg: string) => {
    setConsoleLog(prev => [...prev, `[${new Date().toLocaleTimeString('tr-TR')}] ${msg}`])
  }

  const runHealthCheck = async () => {
    setIsRunning(true)
    setLiveChecks([])
    setReport(null)
    setConsoleLog([])

    log('Sistem saglik kontrolu baslatiliyor...')
    log('')

    try {
      const result = await runFullHealthCheck((check) => {
        setLiveChecks(prev => [...prev, check])
        const statusIcon = check.status === 'pass' ? '+' : check.status === 'fail' ? 'X' : check.status === 'warning' ? '!' : '-'
        log(`[${statusIcon}] ${check.name}: ${check.message}`)
      })

      setReport(result)
      log('')
      log(`=== Kontrol Tamamlandi ===`)
      log(`Genel Skor: ${result.overallScore}/100`)
      log(`Durum: ${result.overallStatus.toUpperCase()}`)
      log(`Toplam Kontrol: ${result.checks.length}`)
      log(`Sure: ${result.executionTime}ms`)
    } catch (error: any) {
      log(`HATA: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const filteredChecks = useMemo(() => {
    const source = report?.checks || liveChecks
    let checks = source

    if (filterCategory !== 'all') {
      checks = checks.filter(c => c.category === filterCategory)
    }

    if (filterStatus !== 'all') {
      checks = checks.filter(c => c.status === filterStatus)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      checks = checks.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q) ||
        c.details.some(d => d.toLowerCase().includes(q))
      )
    }

    return checks
  }, [report, liveChecks, filterCategory, filterStatus, searchQuery])

  const exportReport = () => {
    if (!report) return
    const data = JSON.stringify(report, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `healthcheck-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const allChecks = report?.checks || liveChecks
  const passCount = allChecks.filter(c => c.status === 'pass' || c.status === 'info').length
  const failCount = allChecks.filter(c => c.status === 'fail').length
  const warnCount = allChecks.filter(c => c.status === 'warning').length
  const fixableCount = allChecks.filter(c => c.fixable && (c.status === 'fail' || c.status === 'warning')).length

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-50 p-2.5 rounded-xl">
              <Heart className="h-6 w-6 text-teal-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Sistem Saglik Kontrolu</h1>
              <p className="text-sm text-muted-foreground">
                Veritabani, performans, tercume, tema, guvenlik ve tutarlilik analizi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report && (
              <Button variant="outline" size="sm" onClick={exportReport}>
                <Download className="h-4 w-4 mr-1" />
                Rapor
              </Button>
            )}
            <Button
              onClick={runHealthCheck}
              disabled={isRunning}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Taraniyor...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {report ? 'Tekrar Tara' : 'Taramayi Baslat'}
                </>
              )}
            </Button>
          </div>
        </div>

        {!report && !isRunning && liveChecks.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-20">
              <div className="text-center max-w-lg mx-auto">
                <div className="bg-teal-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Activity className="h-12 w-12 text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Kapsamli Sistem Analizi</h2>
                <p className="text-sm text-muted-foreground mb-8">
                  Tum sistemi 8 farkli kategoride tarar: Veritabani semalari, performans metrikleri, tercume tutarliligi,
                  tema/tasarim ayarlari, mukerrer kayitlar, guvenlik politikalari, kullanilmayan kaynaklar ve veri tutarliligi.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {[
                    { icon: Database, label: 'Veritabani', desc: 'Tablo ve kolon kontrolu' },
                    { icon: Zap, label: 'Performans', desc: 'Sorgu sureleri ve boyut' },
                    { icon: Languages, label: 'Tercume', desc: 'i18n kapsam analizi' },
                    { icon: Palette, label: 'Tema', desc: 'Stil ve banner durumu' },
                    { icon: Copy, label: 'Mukerrer', desc: 'SKU, email, fatura no' },
                    { icon: Shield, label: 'Guvenlik', desc: 'RLS ve oturum' },
                    { icon: Trash2, label: 'Kullanilmayan', desc: 'Eski taslaklar, fiyatsiz' },
                    { icon: GitMerge, label: 'Tutarlilik', desc: 'Fatura, gider, urun' },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-3 rounded-xl border bg-white hover:shadow-sm transition-shadow">
                      <item.icon className="h-5 w-5 text-teal-600 mx-auto mb-1.5" />
                      <p className="text-xs font-medium text-slate-900">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <Button onClick={runHealthCheck} className="bg-teal-600 hover:bg-teal-700 text-white" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Taramayi Baslat
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(report || isRunning || liveChecks.length > 0) && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <Card className="border-0 shadow-sm lg:col-span-3">
                <CardContent className="py-6 flex flex-col items-center">
                  <OverallGauge score={report?.overallScore || 0} status={report?.overallStatus || 'warning'} />
                  {report && (
                    <div className="mt-4 text-center">
                      <p className="text-[10px] text-muted-foreground">
                        {report.checks.length} kontrol | {report.executionTime}ms
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(report.timestamp).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="lg:col-span-9 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Basarili', value: passCount, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Uyari', value: warnCount, icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Hata', value: failCount, icon: XCircle, color: 'bg-red-50 text-red-600' },
                    { label: 'Duzeltilir', value: fixableCount, icon: Sparkles, color: 'bg-blue-50 text-blue-600' },
                  ].map((card) => (
                    <Card key={card.label} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${card.color}`}>
                            <card.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-slate-900">{card.value}</p>
                            <p className="text-[10px] text-muted-foreground">{card.label}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {report && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {report.categories.map(cat => (
                      <CategoryCard key={cat.category} summary={cat} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Tabs defaultValue="results" className="space-y-4">
              <TabsList className="bg-muted/50 p-1 h-auto">
                <TabsTrigger value="results" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <FileText className="h-4 w-4" />
                  Detayli Rapor
                  {allChecks.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-5">{allChecks.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="console" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Server className="h-4 w-4" />
                  Konsol
                </TabsTrigger>
              </TabsList>

              <TabsContent value="results">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        Detayli Kontrol Sonuclari
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Ara..."
                            className="pl-8 h-8 w-40 text-xs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tum Kategoriler</SelectItem>
                            <SelectItem value="database">Veritabani</SelectItem>
                            <SelectItem value="performance">Performans</SelectItem>
                            <SelectItem value="translation">Tercume</SelectItem>
                            <SelectItem value="theme">Tema</SelectItem>
                            <SelectItem value="duplicates">Mukerrer</SelectItem>
                            <SelectItem value="security">Guvenlik</SelectItem>
                            <SelectItem value="unused">Kullanilmayan</SelectItem>
                            <SelectItem value="consistency">Tutarlilik</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tum Durum</SelectItem>
                            <SelectItem value="pass">Basarili</SelectItem>
                            <SelectItem value="warning">Uyari</SelectItem>
                            <SelectItem value="fail">Hata</SelectItem>
                            <SelectItem value="info">Bilgi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredChecks.length === 0 ? (
                      <div className="text-center py-12">
                        {isRunning ? (
                          <>
                            <Loader2 className="h-10 w-10 animate-spin text-teal-500 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">Kontroller calistiriliyor...</p>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                            <p className="font-medium text-slate-900">Sorun bulunamadi</p>
                            <p className="text-sm text-muted-foreground">Secili filtrelere uyan kontrol yok.</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <Accordion type="multiple" className="space-y-0">
                        {filteredChecks.map(check => (
                          <CheckRow key={check.id} check={check} />
                        ))}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="console">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        Calisma Konsolu
                      </CardTitle>
                      {consoleLog.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setConsoleLog([])}>
                          <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                          Temizle
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      ref={consoleRef}
                      className="bg-[#0d1117] text-[#c9d1d9] font-mono text-[11px] p-4 rounded-lg h-96 overflow-y-auto leading-relaxed"
                    >
                      {consoleLog.length === 0 ? (
                        <span className="text-[#484f58]">Konsol ciktisi burada gorunecek...</span>
                      ) : (
                        consoleLog.map((line, idx) => (
                          <div key={idx} className={`${line.startsWith('[X]') ? 'text-[#f85149]' : line.startsWith('[+]') ? 'text-[#3fb950]' : line.startsWith('[!]') ? 'text-[#d29922]' : line.startsWith('===') ? 'text-[#58a6ff] font-bold' : ''}`}>
                            {line}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
