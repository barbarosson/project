'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'

interface Comparison {
  id: string
  feature_name_en: string
  feature_name_tr: string
  modulus_value: string
  isbasi_value: string
  bizimhesap_value: string
  category: string
}

export function ComparisonMatrix() {
  const { language } = useLanguage()
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComparisons()
  }, [])

  async function fetchComparisons() {
    try {
      const { data, error } = await supabase
        .from('pricing_comparisons')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (data) {
        setComparisons(data as Comparison[])
      }
    } catch (error) {
      console.error('Error fetching comparisons:', error)
    } finally {
      setLoading(false)
    }
  }

  function getComparisonIcon(value: string) {
    if (value.includes('✓')) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    } else if (value.includes('✗')) {
      return <XCircle className="h-5 w-5 text-red-500" />
    } else if (value.includes('~')) {
      return <MinusCircle className="h-5 w-5 text-yellow-600" />
    }
    return null
  }

  function getValueStyle(value: string, isModulus: boolean = false) {
    if (value.includes('✓')) {
      return isModulus
        ? 'text-green-700 font-semibold bg-green-50 px-3 py-2 rounded-lg'
        : 'text-green-600'
    } else if (value.includes('✗')) {
      return 'text-red-500'
    } else if (value.includes('~')) {
      return 'text-yellow-600'
    }
    return 'text-gray-700'
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    )
  }

  if (comparisons.length === 0) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  {language === 'en' ? 'Feature' : 'Özellik'}
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold bg-blue-50">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-blue-600 text-lg">Modulus ERP</span>
                    <Badge className="bg-blue-600 text-white text-xs">
                      {language === 'en' ? 'Our Solution' : 'Bizim Çözümümüz'}
                    </Badge>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">
                  {language === 'en' ? 'Others' : 'Diğerleri'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comparisons.map((comparison, idx) => (
                <tr
                  key={comparison.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {language === 'en' ? comparison.feature_name_en : comparison.feature_name_tr}
                  </td>
                  <td className="px-6 py-4 text-center bg-blue-50/50">
                    <div className="flex items-center justify-center gap-2">
                      {getComparisonIcon(comparison.modulus_value)}
                      <span className={getValueStyle(comparison.modulus_value, true)}>
                        {comparison.modulus_value.replace(/[✓✗~]/g, '').trim()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-gray-500 min-w-[80px]">İşbaşı:</span>
                        {getComparisonIcon(comparison.isbasi_value || '')}
                        <span className={getValueStyle(comparison.isbasi_value || '')}>
                          {(comparison.isbasi_value || '').replace(/[✓✗~]/g, '').trim()}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-gray-500 min-w-[80px]">BizimHesap:</span>
                        {getComparisonIcon(comparison.bizimhesap_value || '')}
                        <span className={getValueStyle(comparison.bizimhesap_value || '')}>
                          {(comparison.bizimhesap_value || '').replace(/[✓✗~]/g, '').trim()}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4 p-4">
          {comparisons.map((comparison) => (
            <Card key={comparison.id} className="p-4 bg-gray-50">
              <h4 className="font-semibold text-sm mb-3">
                {language === 'en' ? comparison.feature_name_en : comparison.feature_name_tr}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                  <span className="text-sm font-semibold text-blue-600">Modulus</span>
                  <div className="flex items-center gap-2">
                    {getComparisonIcon(comparison.modulus_value)}
                    <span className={getValueStyle(comparison.modulus_value)}>
                      {comparison.modulus_value.replace(/[✓✗~]/g, '').trim()}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <div className="text-xs text-gray-500 font-semibold mb-2">
                    {language === 'en' ? 'Others' : 'Diğerleri'}
                  </div>
                  <div className="space-y-1.5 pl-2">
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-xs text-gray-600">İşbaşı</span>
                      <div className="flex items-center gap-2">
                        {getComparisonIcon(comparison.isbasi_value || '')}
                        <span className={getValueStyle(comparison.isbasi_value || '')}>
                          {(comparison.isbasi_value || '').replace(/[✓✗~]/g, '').trim()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-xs text-gray-600">BizimHesap</span>
                      <div className="flex items-center gap-2">
                        {getComparisonIcon(comparison.bizimhesap_value || '')}
                        <span className={getValueStyle(comparison.bizimhesap_value || '')}>
                          {(comparison.bizimhesap_value || '').replace(/[✓✗~]/g, '').trim()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-gray-600">
            {language === 'en' ? 'Fully Supported' : 'Tam Destekleniyor'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MinusCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-gray-600">
            {language === 'en' ? 'Partial Support' : 'Kısmi Destek'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-gray-600">
            {language === 'en' ? 'Not Supported' : 'Desteklenmiyor'}
          </span>
        </div>
      </div>
    </div>
  )
}
