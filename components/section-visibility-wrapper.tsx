'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SectionVisibilityWrapperProps {
  sectionKey: string
  children: React.ReactNode
}

export function SectionVisibilityWrapper({ sectionKey, children }: SectionVisibilityWrapperProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVisibility = async () => {
      const { data } = await supabase
        .from('ui_toggles')
        .select('enabled')
        .eq('element_name', sectionKey)
        .single()

      if (data) {
        setIsVisible(data.enabled)
      }
      setLoading(false)
    }

    fetchVisibility()

    const channel = supabase
      .channel(`toggle_${sectionKey}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ui_toggles',
          filter: `element_name=eq.${sectionKey}`
        },
        (payload: any) => {
          setIsVisible(payload.new.enabled)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [sectionKey])

  if (loading) {
    return null
  }

  if (!isVisible) {
    return null
  }

  return <>{children}</>
}
