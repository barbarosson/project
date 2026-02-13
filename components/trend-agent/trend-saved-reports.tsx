'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText, Star, Trash2, Clock, Globe, Tag
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'

interface SavedReport {
  id: string
  title: string
  search_id: string
  notes: string
  is_favorite: boolean
  created_at: string
  trend_searches?: {
    region_code: string
    category_slug: string
    subcategory_slug: string | null
    forecast_days: number
  }
}

interface TrendSavedReportsProps {
  reports: SavedReport[]
  onLoadReport: (searchId: string) => void
  onRefresh: () => void
}

export function TrendSavedReports({ reports, onLoadReport, onRefresh }: TrendSavedReportsProps) {
  const { language } = useLanguage()
  const isTR = language === 'tr'
  const locale = isTR ? tr : enUS

  const toggleFavorite = async (id: string, current: boolean) => {
    await supabase
      .from('trend_saved_reports')
      .update({ is_favorite: !current })
      .eq('id', id)
    onRefresh()
  }

  const deleteReport = async (id: string) => {
    await supabase
      .from('trend_saved_reports')
      .delete()
      .eq('id', id)
    onRefresh()
  }

  if (reports.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16">
          <div className="text-center">
            <div className="bg-muted/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="font-medium text-[#0A192F] mb-1">
              {isTR ? 'Kayitli rapor yok' : 'No saved reports'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isTR
                ? 'Trend analizi sonuclarinizi kaydederek daha sonra erisebilirsiniz'
                : 'Save your trend analysis results to access them later'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const favorites = reports.filter(r => r.is_favorite)
  const others = reports.filter(r => !r.is_favorite)

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-[#0A192F]">
          {isTR ? 'Kayitli Raporlar' : 'Saved Reports'}
          <Badge variant="secondary" className="ml-2 text-[10px]">{reports.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...favorites, ...others].map(report => (
            <div
              key={report.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors group"
            >
              <button
                onClick={() => toggleFavorite(report.id, report.is_favorite)}
                className="flex-shrink-0"
              >
                <Star
                  className={`h-4 w-4 transition-colors ${report.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-amber-400'}`}
                />
              </button>

              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onLoadReport(report.search_id)}
              >
                <p className="text-sm font-medium text-[#0A192F] truncate">{report.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {report.trend_searches?.region_code && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Globe className="h-3 w-3" />
                      {report.trend_searches.region_code}
                    </span>
                  )}
                  {report.trend_searches?.category_slug && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Tag className="h-3 w-3" />
                      {report.trend_searches.category_slug}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {format(new Date(report.created_at), 'dd MMM yyyy', { locale })}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => deleteReport(report.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
