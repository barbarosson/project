'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  TrendingUp, TrendingDown, Minus, Zap, Eye, Star, Bookmark,
  ExternalLink, BarChart3, Globe, Calendar, Shield, ArrowUp
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface TrendResult {
  id: string
  product_name: string
  trend_score: number
  confidence: number
  rank: number
  category: string
  price_range_min: number | null
  price_range_max: number | null
  currency: string
  trend_direction: string
  data_sources: string[]
  seasonal_factor: number
  event_boost: number
  explanation: string
  image_url: string
  marketplace_links: { name: string; url: string }[]
}

interface TrendResultsPanelProps {
  results: TrendResult[]
  regionName: string
  categoryName: string
  forecastDays: number
  onSaveReport: (title: string) => void
}

const DIRECTION_CONFIG: Record<string, { icon: typeof TrendingUp; color: string; label: { tr: string; en: string } }> = {
  rising: { icon: TrendingUp, color: 'text-emerald-500', label: { tr: 'Yukseliste', en: 'Rising' } },
  accelerating: { icon: Zap, color: 'text-teal-500', label: { tr: 'Hizlaniyor', en: 'Accelerating' } },
  stable: { icon: Minus, color: 'text-blue-500', label: { tr: 'Sabit', en: 'Stable' } },
  declining: { icon: TrendingDown, color: 'text-red-500', label: { tr: 'Dususte', en: 'Declining' } },
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-teal-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-teal-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function confidenceLabel(conf: number, isTR: boolean): string {
  if (conf >= 80) return isTR ? 'Cok Yuksek' : 'Very High'
  if (conf >= 60) return isTR ? 'Yuksek' : 'High'
  if (conf >= 40) return isTR ? 'Orta' : 'Medium'
  return isTR ? 'Dusuk' : 'Low'
}

export function TrendResultsPanel({ results, regionName, categoryName, forecastDays, onSaveReport }: TrendResultsPanelProps) {
  const { language } = useLanguage()
  const isTR = language === 'tr'
  const [selectedResult, setSelectedResult] = useState<TrendResult | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  if (results.length === 0) return null

  const formatPrice = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return '-'
    const fmt = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 0 })
    if (min && max) return `${fmt(min)} - ${fmt(max)} ${currency}`
    if (min) return `${fmt(min)}+ ${currency}`
    return `${fmt(max!)} ${currency}`
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-[#0A192F]">
                {isTR ? 'Trend Urunler' : 'Trending Products'}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="outline" className="text-[10px]">
                  <Globe className="h-3 w-3 mr-1" />
                  {regionName}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {categoryName}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Calendar className="h-3 w-3 mr-1" />
                  {forecastDays} {isTR ? 'gun' : 'days'}
                </Badge>
                <Badge className="bg-teal-100 text-teal-700 border-0 text-[10px]">
                  {results.length} {isTR ? 'urun' : 'products'}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSaveReport(`${categoryName} - ${regionName}`)}
            >
              <Bookmark className="h-4 w-4 mr-1" />
              {isTR ? 'Raporu Kaydet' : 'Save Report'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.map((result, idx) => {
              const dirConf = DIRECTION_CONFIG[result.trend_direction] || DIRECTION_CONFIG.stable
              const DirIcon = dirConf.icon
              const isTop3 = idx < 3

              return (
                <div
                  key={result.id}
                  className={`group rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer ${isTop3 ? 'bg-gradient-to-r from-teal-50/50 to-transparent border-teal-100' : 'hover:bg-muted/20'}`}
                  onClick={() => {
                    setSelectedResult(result)
                    setDetailOpen(true)
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${isTop3 ? 'bg-teal-600' : 'bg-gray-400'}`}>
                      {result.rank}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-[#0A192F] text-sm truncate">
                            {result.product_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {result.category && (
                              <span className="text-[10px] text-muted-foreground">{result.category}</span>
                            )}
                            {(result.price_range_min || result.price_range_max) && (
                              <span className="text-[10px] text-muted-foreground">
                                {formatPrice(result.price_range_min, result.price_range_max, result.currency)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className={`text-xl font-bold ${scoreColor(result.trend_score)}`}>
                              {Math.round(result.trend_score)}
                            </div>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">score</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <DirIcon className={`h-3.5 w-3.5 ${dirConf.color}`} />
                          <span className={`text-xs font-medium ${dirConf.color}`}>
                            {isTR ? dirConf.label.tr : dirConf.label.en}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            {confidenceLabel(result.confidence, isTR)} ({Math.round(result.confidence)}%)
                          </span>
                        </div>

                        {result.event_boost > 1.2 && (
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">
                            <Zap className="h-3 w-3 mr-0.5" />
                            {isTR ? 'Etkinlik Etkisi' : 'Event Boost'} x{result.event_boost.toFixed(1)}
                          </Badge>
                        )}

                        {result.seasonal_factor > 1.3 && (
                          <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">
                            <ArrowUp className="h-3 w-3 mr-0.5" />
                            {isTR ? 'Mevsimsel' : 'Seasonal'} x{result.seasonal_factor.toFixed(1)}
                          </Badge>
                        )}

                        <div className="w-20">
                          <Progress value={result.trend_score} className="h-1.5" />
                        </div>

                        <Eye className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedResult && (
            <>
              <SheetHeader>
                <SheetTitle className="text-[#0A192F] flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm ${scoreBg(selectedResult.trend_score)}`}>
                    #{selectedResult.rank}
                  </div>
                  {selectedResult.product_name}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <div className={`text-2xl font-bold ${scoreColor(selectedResult.trend_score)}`}>
                      {Math.round(selectedResult.trend_score)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">Trend Score</span>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <div className="text-2xl font-bold text-[#0A192F]">
                      {Math.round(selectedResult.confidence)}%
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {isTR ? 'Guven' : 'Confidence'}
                    </span>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <div className={`text-lg font-bold flex items-center justify-center gap-1 ${(DIRECTION_CONFIG[selectedResult.trend_direction] || DIRECTION_CONFIG.stable).color}`}>
                      {(() => {
                        const Icon = (DIRECTION_CONFIG[selectedResult.trend_direction] || DIRECTION_CONFIG.stable).icon
                        return <Icon className="h-5 w-5" />
                      })()}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {isTR
                        ? (DIRECTION_CONFIG[selectedResult.trend_direction] || DIRECTION_CONFIG.stable).label.tr
                        : (DIRECTION_CONFIG[selectedResult.trend_direction] || DIRECTION_CONFIG.stable).label.en}
                    </span>
                  </div>
                </div>

                <Separator />

                {selectedResult.explanation && (
                  <div>
                    <h4 className="text-sm font-medium text-[#0A192F] mb-2">
                      {isTR ? 'Analiz' : 'Analysis'}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedResult.explanation}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  {selectedResult.category && (
                    <div>
                      <span className="text-[10px] text-muted-foreground">{isTR ? 'Kategori' : 'Category'}</span>
                      <p className="text-sm font-medium">{selectedResult.category}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-muted-foreground">{isTR ? 'Fiyat Araligi' : 'Price Range'}</span>
                    <p className="text-sm font-medium">
                      {formatPrice(selectedResult.price_range_min, selectedResult.price_range_max, selectedResult.currency)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">{isTR ? 'Mevsimsel Carpan' : 'Seasonal Factor'}</span>
                    <p className="text-sm font-medium">x{selectedResult.seasonal_factor.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">{isTR ? 'Etkinlik Carpan' : 'Event Boost'}</span>
                    <p className="text-sm font-medium">x{selectedResult.event_boost.toFixed(2)}</p>
                  </div>
                </div>

                {selectedResult.data_sources && selectedResult.data_sources.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-[#0A192F] mb-2">
                        {isTR ? 'Veri Kaynaklari' : 'Data Sources'}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedResult.data_sources.map((src, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{src}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedResult.marketplace_links && selectedResult.marketplace_links.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-[#0A192F] mb-2">
                        {isTR ? 'Pazaryeri Linkleri' : 'Marketplace Links'}
                      </h4>
                      <div className="space-y-2">
                        {selectedResult.marketplace_links.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-800 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {link.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
