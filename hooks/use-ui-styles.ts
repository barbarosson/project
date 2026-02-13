import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface UIStyle {
  id: string
  element_name: string
  property: string
  value: number
  unit: string
  category: string
  label: string
  min_value: number
  max_value: number
}

export interface UIColor {
  id: string
  element_name: string
  property: string
  value: string
  category: string
  label: string
}

export interface UIToggle {
  id: string
  element_name: string
  enabled: boolean
  label: string
}

export function useUIStyles() {
  const [styles, setStyles] = useState<UIStyle[]>([])
  const [colors, setColors] = useState<UIColor[]>([])
  const [toggles, setToggles] = useState<UIToggle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUIStyles()

    const stylesSubscription = supabase
      .channel('ui_styles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ui_styles' }, () => {
        fetchUIStyles()
      })
      .subscribe()

    return () => {
      stylesSubscription.unsubscribe()
    }
  }, [])

  async function fetchUIStyles() {
    const { data } = await supabase
      .from('ui_styles')
      .select('*')
      .order('category', { ascending: true })
      .order('element_name', { ascending: true })

    if (data) {
      const parsed = data.map(item => ({
        ...item,
        value: Number(item.value),
        min_value: Number(item.min_value),
        max_value: Number(item.max_value),
      }))
      setStyles(parsed)
    }
    setLoading(false)
  }

  async function fetchUIColors() {
    setColors([])
  }

  async function fetchUIToggles() {
    setToggles([])
  }

  async function updateStyle(id: string, value: number) {
    setStyles(prev => prev.map(s => s.id === id ? { ...s, value } : s))

    const { error } = await supabase
      .from('ui_styles')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error updating style:', error)
      fetchUIStyles()
      throw error
    }
  }

  async function updateColor(id: string, value: string) {
    console.warn('UI Colors table not implemented')
  }

  async function updateToggle(id: string, enabled: boolean) {
    console.warn('UI Toggles table not implemented')
  }

  return {
    styles,
    colors,
    toggles,
    loading,
    updateStyle,
    updateColor,
    updateToggle,
  }
}
