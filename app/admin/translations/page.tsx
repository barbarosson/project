'use client'

import { useState, useMemo } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion'
import {
  Languages, Search, AlertTriangle, CheckCircle2, XCircle,
  BarChart3, FileText, Download, RefreshCcw, Eye,
  Shield, ArrowRight, ChevronRight, Globe, Sparkles
} from 'lucide-react'
import {
  analyzeTranslations,
  type TranslationReport,
  type TranslationIssue,
  type SectionStats,
} from '@/lib/translation-checker'

const ISSUE_LABELS: Record<string, { label: string; color: string; icon: typeof XCircle }> = {
  missing_in_tr: { label: 'TR Eksik', color: 'bg-red-100 text-red-700', icon: XCircle },
  missing_in_en: { label: 'EN Eksik', color: 'bg-red-100 text-red-700', icon: XCircle },
  empty_value: { label: 'Bos Deger', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  untranslated: { label: 'Tercume Edilmemis', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  placeholder_mismatch: { label: 'Parametre Uyumsuz', color: 'bg-blue-100 text-blue-700', icon: AlertTriangle },
}

const SEVERITY_COLORS: Record<string, string> = {
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
}

function HealthGauge({ score }: { score: number }) {
  const color = score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-red-600'
  const bgColor = score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-red-500'
  const label = score >= 90 ? 'Cok Iyi' : score >= 70 ? 'Iyi' : score >= 50 ? 'Orta' : 'Kritik'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{Math.round(score)}</span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <Badge className={`${bgColor} text-white border-0 text-xs`}>{label}</Badge>
    </div>
  )
}

function SectionRow({ section }: { section: SectionStats }) {
  const totalIssues = section.missingInTr + section.missingInEn + section.emptyInTr + section.untranslated + section.placeholderMismatch
  const color = section.completionPct >= 100 ? 'text-emerald-600' : section.completionPct >= 80 ? 'text-amber-600' : 'text-red-600'

  return (
    <TableRow className={totalIssues > 0 ? 'bg-red-50/30' : ''}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {totalIssues === 0 ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{section.section}</code>
        </div>
      </TableCell>
      <TableCell className="text-center">{section.enKeys}</TableCell>
      <TableCell className="text-center">{section.trKeys}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Progress value={section.completionPct} className="h-2 w-20" />
          <span className={`text-xs font-medium ${color}`}>{section.completionPct.toFixed(0)}%</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        {section.missingInTr > 0 ? (
          <Badge variant="destructive" className="text-[10px]">{section.missingInTr}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        {section.untranslated > 0 ? (
          <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">{section.untranslated}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        {section.placeholderMismatch > 0 ? (
          <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">{section.placeholderMismatch}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </TableCell>
    </TableRow>
  )
}

function IssueRow({ issue }: { issue: TranslationIssue }) {
  const conf = ISSUE_LABELS[issue.type] || ISSUE_LABELS.untranslated
  const Icon = conf.icon

  return (
    <TableRow>
      <TableCell>
        <Badge className={`${conf.color} border-0 text-[10px] gap-1`}>
          <Icon className="h-3 w-3" />
          {conf.label}
        </Badge>
      </TableCell>
      <TableCell>
        <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded break-all">{issue.key}</code>
      </TableCell>
      <TableCell>
        <code className="text-[10px] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded">{issue.section}</code>
      </TableCell>
      <TableCell>
        {issue.enValue && (
          <span className="text-xs text-muted-foreground line-clamp-2">{issue.enValue}</span>
        )}
      </TableCell>
      <TableCell>
        {issue.trValue ? (
          <span className="text-xs text-muted-foreground line-clamp-2">{issue.trValue}</span>
        ) : (
          <span className="text-xs text-red-400 italic">--bos--</span>
        )}
      </TableCell>
      <TableCell>
        <div className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[issue.severity]}`} />
      </TableCell>
    </TableRow>
  )
}

export default function AdminTranslationsPage() {
  const [report, setReport] = useState<TranslationReport | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterSection, setFilterSection] = useState('all')

  const runAnalysis = () => {
    setIsScanning(true)
    setTimeout(() => {
      const result = analyzeTranslations()
      setReport(result)
      setIsScanning(false)
    }, 800)
  }

  const filteredIssues = useMemo(() => {
    if (!report) return []
    let issues = report.issues

    if (filterType !== 'all') {
      issues = issues.filter(i => i.type === filterType)
    }

    if (filterSection !== 'all') {
      issues = issues.filter(i => i.section === filterSection)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      issues = issues.filter(i =>
        i.key.toLowerCase().includes(q) ||
        (i.enValue && i.enValue.toLowerCase().includes(q)) ||
        (i.trValue && i.trValue.toLowerCase().includes(q))
      )
    }

    return issues
  }, [report, filterType, filterSection, searchQuery])

  const exportReport = () => {
    if (!report) return
    const data = JSON.stringify(report, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `translation-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const allSections = useMemo(() => {
    if (!report) return []
    return report.sections.map(s => s.section)
  }, [report])

  const errorCount = report?.issues.filter(i => i.severity === 'error').length || 0
  const warningCount = report?.issues.filter(i => i.severity === 'warning').length || 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-50 p-2.5 rounded-xl">
              <Languages className="h-6 w-6 text-teal-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Tercume Ajani</h1>
              <p className="text-sm text-muted-foreground">
                i18n dosyasini tarayip eksik ve hatali tercumeleri tespit eder
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report && (
              <Button variant="outline" size="sm" onClick={exportReport}>
                <Download className="h-4 w-4 mr-1" />
                Rapor Indir
              </Button>
            )}
            <Button
              onClick={runAnalysis}
              disabled={isScanning}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isScanning ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Taraniyor...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {report ? 'Tekrar Tara' : 'Taramayi Baslat'}
                </>
              )}
            </Button>
          </div>
        </div>

        {!report && !isScanning && (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-20">
              <div className="text-center max-w-md mx-auto">
                <div className="bg-teal-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Languages className="h-12 w-12 text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Tercume Kontrol Sistemi</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  i18n.ts dosyasindaki Ingilizce ve Turkce tercumeleri karsilastirarak eksik anahtarlari,
                  bos degerleri, tercume edilmemis metinleri ve parametre uyumsuzluklarini tespit eder.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { icon: XCircle, label: 'Eksik Anahtar', desc: 'Bir dilde var, digerinde yok' },
                    { icon: AlertTriangle, label: 'Bos Deger', desc: 'Anahtar var, deger bos' },
                    { icon: Globe, label: 'Tercumesiz', desc: 'EN ve TR degeri ayni' },
                    { icon: FileText, label: 'Parametre', desc: '{count} gibi parametreler uyumsuz' },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-3 rounded-lg border bg-white">
                      <item.icon className="h-5 w-5 text-teal-600 mx-auto mb-1" />
                      <p className="text-xs font-medium">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <Button onClick={runAnalysis} className="bg-teal-600 hover:bg-teal-700 text-white" size="lg">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Taramayi Baslat
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {report && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="border-0 shadow-sm md:col-span-1">
                <CardContent className="py-6 flex justify-center">
                  <HealthGauge score={report.healthScore} />
                </CardContent>
              </Card>

              <div className="md:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'EN Anahtar', value: report.totalEnKeys, icon: FileText, color: 'bg-blue-50 text-blue-600' },
                  { label: 'TR Anahtar', value: report.totalTrKeys, icon: FileText, color: 'bg-teal-50 text-teal-600' },
                  { label: 'Tamamlanma', value: `${report.overallCompletion.toFixed(1)}%`, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'Toplam Sorun', value: report.issues.length, icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Hatalar', value: errorCount, icon: XCircle, color: 'bg-red-50 text-red-600' },
                  { label: 'Uyarilar', value: warningCount, icon: AlertTriangle, color: 'bg-orange-50 text-orange-600' },
                  { label: 'Bolum Sayisi', value: report.sections.length, icon: BarChart3, color: 'bg-sky-50 text-sky-600' },
                  { label: 'Dil Sayisi', value: 2, icon: Globe, color: 'bg-teal-50 text-teal-600' },
                ].map((card) => {
                  const Icon = card.icon
                  return (
                    <Card key={card.label} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${card.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-slate-900">{card.value}</p>
                            <p className="text-[10px] text-muted-foreground">{card.label}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            <Tabs defaultValue="sections" className="space-y-4">
              <TabsList className="bg-muted/50 p-1 h-auto">
                <TabsTrigger value="sections" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <BarChart3 className="h-4 w-4" />
                  Bolumler
                </TabsTrigger>
                <TabsTrigger value="issues" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Sorunlar
                  {report.issues.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-5">
                      {report.issues.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sections">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      Bolum Bazli Tercume Durumu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bolum</TableHead>
                          <TableHead className="text-center">EN</TableHead>
                          <TableHead className="text-center">TR</TableHead>
                          <TableHead>Tamamlanma</TableHead>
                          <TableHead className="text-center">Eksik</TableHead>
                          <TableHead className="text-center">Tercumesiz</TableHead>
                          <TableHead className="text-center">Parametre</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.sections.map(section => (
                          <SectionRow key={section.section} section={section} />
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="issues">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        Tespit Edilen Sorunlar
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Ara..."
                            className="pl-8 h-8 w-48 text-xs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tum Tipler</SelectItem>
                            <SelectItem value="missing_in_tr">TR Eksik</SelectItem>
                            <SelectItem value="missing_in_en">EN Eksik</SelectItem>
                            <SelectItem value="empty_value">Bos Deger</SelectItem>
                            <SelectItem value="untranslated">Tercumesiz</SelectItem>
                            <SelectItem value="placeholder_mismatch">Parametre Uyumsuz</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterSection} onValueChange={setFilterSection}>
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tum Bolumler</SelectItem>
                            {allSections.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredIssues.length === 0 ? (
                      <div className="text-center py-16">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                        <h3 className="font-medium text-slate-900 mb-1">Sorun Bulunamadi</h3>
                        <p className="text-sm text-muted-foreground">
                          {report.issues.length === 0
                            ? 'Tum tercumeler eksiksiz ve dogru gorunuyor.'
                            : 'Secili filtrelere uyan sorun yok.'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-32">Tip</TableHead>
                              <TableHead>Anahtar</TableHead>
                              <TableHead className="w-24">Bolum</TableHead>
                              <TableHead>EN Deger</TableHead>
                              <TableHead>TR Deger</TableHead>
                              <TableHead className="w-12">Onem</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredIssues.slice(0, 100).map((issue, idx) => (
                              <IssueRow key={`${issue.key}-${idx}`} issue={issue} />
                            ))}
                          </TableBody>
                        </Table>
                        {filteredIssues.length > 100 && (
                          <p className="text-center text-sm text-muted-foreground mt-4">
                            ...ve {filteredIssues.length - 100} sorun daha
                          </p>
                        )}
                      </div>
                    )}
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
