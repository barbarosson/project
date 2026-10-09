'use client'

import { ModulusLogoSvgOnly } from '@/components/modulus-logo'

type ProductKey = 'erp' | 'appointflow' | 'isendai' | 'digitalLegacy' | 'seekdesk'

export function ProductMenuIcon({
  product,
  size = 44,
}: {
  product: ProductKey
  size?: number
}) {
  if (product === 'erp') {
    return <ModulusLogoSvgOnly size={size} />
  }

  if (product === 'digitalLegacy') {
    const uid = `dl-${size}`
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <rect width="64" height="64" rx="12" fill="#78350F" />
        <rect x="16" y="14" width="32" height="36" rx="6" fill={`url(#${uid}-p)`} />
        <path
          d="M22 24h20M22 30h16M22 36h18M22 42h12"
          stroke="#FFFBEB"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />
        <circle cx="44" cy="44" r="10" fill="#F59E0B" stroke="#FFFBEB" strokeWidth="2" />
        <path
          d="M40 44l3 3 6-6"
          stroke="#78350F"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id={`${uid}-p`} x1="16" y1="14" x2="48" y2="50">
            <stop stopColor="#FBBF24" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  if (product === 'seekdesk') {
    const uid = `sd-${size}`
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <rect width="64" height="64" rx="12" fill="#312E81" />
        <path
          d="M16 42 L26 30 L34 36 L48 20"
          stroke={`url(#${uid}-g)`}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="48" cy="20" r="4" fill="#A5B4FC" />
        <path
          d="M18 48h28"
          stroke="#6366F1"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <defs>
          <linearGradient id={`${uid}-g`} x1="16" y1="42" x2="48" y2="20">
            <stop stopColor="#818CF8" />
            <stop offset="1" stopColor="#C7D2FE" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  if (product === 'appointflow') {
    const uid = `af-${size}`
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <rect width="64" height="64" rx="12" fill="#0A2540" />
        <rect
          x="14"
          y="16"
          width="36"
          height="32"
          rx="6"
          fill="#00D4AA"
          fillOpacity="0.2"
          stroke="#00D4AA"
          strokeWidth="2"
        />
        <path
          d="M22 24h20M22 32h14"
          stroke="#00D4AA"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="44" cy="40" r="10" fill={`url(#${uid}-g)`} />
        <path
          d="M40 40c1.5-2 4-2 5.5 0 1.2 1.6 1.2 3.4 0 5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id={`${uid}-g`} x1="34" y1="30" x2="54" y2="50">
            <stop stopColor="#25D366" />
            <stop offset="1" stopColor="#128C7E" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  const uid = `isend-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-g1`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c084fc" />
          <stop offset="0.55" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#e879f9" />
        </linearGradient>
        <radialGradient id={`${uid}-g2`} cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor="rgba(192,132,252,0.5)" />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="12" fill="#1e1b4b" />
      <circle cx="32" cy="32" r="24" fill={`url(#${uid}-g2)`} />
      <circle
        cx="32"
        cy="32"
        r="18.5"
        fill="none"
        stroke={`url(#${uid}-g1)`}
        strokeWidth="2.75"
      />
      <g fill={`url(#${uid}-g1)`}>
        <circle cx="24" cy="30" r="2.2" />
        <circle cx="32" cy="24" r="2.2" />
        <circle cx="40" cy="30" r="2.2" />
        <circle cx="30" cy="40" r="2.2" />
        <circle cx="42" cy="41" r="2.2" />
      </g>
      <g stroke={`url(#${uid}-g1)`} strokeWidth="2" opacity="0.85">
        <path d="M24 30 L32 24 L40 30" fill="none" />
        <path d="M24 30 L30 40" fill="none" />
        <path d="M40 30 L42 41" fill="none" />
        <path d="M30 40 L42 41" fill="none" />
      </g>
    </svg>
  )
}
