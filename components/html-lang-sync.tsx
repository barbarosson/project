'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'

/**
 * Syncs the document <html> lang attribute with the current language preference
 * so that screen readers and SEO use the correct language (tr/en).
 */
export function HtmlLangSync() {
  const { language } = useLanguage()

  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = language === 'tr' ? 'tr' : 'en'
    }
  }, [language])

  return null
}
