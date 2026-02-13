'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'
import { Card } from '@/components/ui/card'
import * as LucideIcons from 'lucide-react'

interface TrustBadge {
  id: string
  title_en: string
  title_tr: string
  description_en: string
  description_tr: string
  icon: string
}

export function TrustBadges() {
  const { language } = useLanguage()
  const [badges, setBadges] = useState<TrustBadge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBadges()
  }, [])

  async function fetchBadges() {
    try {
      const { data, error } = await supabase
        .from('pricing_trust_badges')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (data) {
        setBadges(data as TrustBadge[])
      }
    } catch (error) {
      console.error('Error fetching trust badges:', error)
    } finally {
      setLoading(false)
    }
  }

  function getIcon(iconName: string) {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Shield
    return <Icon className="h-8 w-8" />
  }

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (badges.length === 0) {
    return null
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {badges.map((badge) => (
        <Card
          key={badge.id}
          className="p-6 text-center hover:shadow-lg transition-shadow bg-white"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            {getIcon(badge.icon)}
          </div>
          <h4 className="font-semibold text-base mb-2">
            {language === 'en' ? badge.title_en : badge.title_tr}
          </h4>
          <p className="text-sm text-muted-foreground">
            {language === 'en' ? badge.description_en : badge.description_tr}
          </p>
        </Card>
      ))}
    </div>
  )
}
