'use client'

import { ModulusLogoSvgOnly } from '@/components/modulus-logo'

type ProductKey = 'erp' | 'appointflow' | 'isendai'

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
