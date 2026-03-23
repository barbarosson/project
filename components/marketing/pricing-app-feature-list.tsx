'use client'

import { CheckCircle2, X } from 'lucide-react'
import {
  PRICING_FEATURE_GROUPS,
  isFeatureEnabledForPlan,
  type FeatureKey,
} from '@/lib/pricing-app-features'

type Props = {
  planTier: string
  language: string
  isPopular: boolean
  /** ÇOK YAKINDA kartlarında hafif soluk görünüm */
  isComingSoon?: boolean
  /** marketing (landing-v2) için daha nötr metin rengi */
  variant?: 'parasut' | 'marketing'
}

export function PricingAppFeatureList({
  planTier,
  language,
  isPopular,
  isComingSoon = false,
  variant = 'parasut',
}: Props) {
  const textMuted = variant === 'marketing' ? 'text-auto-contrast-muted-light' : 'text-gray-700'
  const textHeading = variant === 'marketing' ? 'text-auto-contrast-muted-light' : 'text-gray-500'
  const textDisabled = variant === 'marketing' ? 'opacity-45' : 'text-gray-400'

  const activeIcon = (key: FeatureKey) => {
    const enabled = isFeatureEnabledForPlan(planTier, key)
    const green = isPopular ? 'text-emerald-500' : 'text-green-600'
    if (enabled) {
      return <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${green}`} aria-hidden />
    }
    return (
      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center" aria-hidden>
        <X className={`h-3.5 w-3.5 ${textDisabled}`} strokeWidth={2.5} />
      </span>
    )
  }

  return (
    <div className={`mb-6 flex-1 space-y-4 text-left ${isComingSoon ? 'opacity-95' : ''}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${textHeading}`}>
        {language === 'en' ? 'App features' : 'Uygulama özellikleri'}
      </p>

      {PRICING_FEATURE_GROUPS.map((group) => (
        <div key={group.id} className="space-y-1.5">
          <p className={`text-[11px] font-semibold ${textHeading}`}>
            {language === 'en' ? group.titleEn : group.titleTr}
          </p>
          <ul className="space-y-1.5">
            {group.rows.map((row) => {
              const enabled = isFeatureEnabledForPlan(planTier, row.key)
              return (
                <li
                  key={row.key}
                  className={`flex items-start gap-2 ${row.indent ? 'pl-2 border-l border-gray-200' : ''}`}
                >
                  {activeIcon(row.key)}
                  <span
                    className={`text-sm leading-snug ${
                      enabled ? textMuted : `${textMuted} opacity-60`
                    }`}
                  >
                    {language === 'en' ? row.labelEn : row.labelTr}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
