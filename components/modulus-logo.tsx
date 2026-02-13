'use client'

interface ModulusLogoProps {
  size?: number
  showText?: boolean
  variant?: 'default' | 'light' | 'icon-only'
  className?: string
}

export function ModulusLogo({ size = 40, showText = true, variant = 'default', className = '' }: ModulusLogoProps) {
  const isLight = variant === 'light'
  const uid = `mlogo-${size}-${variant}`

  return (
    <div className={`flex items-center gap-2.5 ${className}`} style={{ flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id={`${uid}-m`} x1="12" y1="14" x2="52" y2="50">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>

        <rect width="64" height="64" rx="12" fill={`url(#${uid}-bg)`} />

        <rect x="3" y="3" width="58" height="58" rx="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        <path
          d="M12 50V16L22 16L32 30L42 16L52 16V50"
          fill="none"
          stroke={`url(#${uid}-m)`}
          strokeWidth="6"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />

        <rect x="12" y="14" width="6" height="36" rx="0" fill="white" opacity="0.95" />
        <rect x="46" y="14" width="6" height="36" rx="0" fill="white" opacity="0.95" />

        <path
          d="M15 14L32 36L49 14"
          fill="none"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="square"
          strokeLinejoin="miter"
          opacity="0.95"
        />

        <rect x="29" y="28" width="6" height="22" rx="0" fill="white" opacity="0.85" />

        <line x1="10" y1="53" x2="54" y2="53" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      </svg>

      {showText && variant !== 'icon-only' && (
        <div className="flex flex-col" style={{ lineHeight: 1 }}>
          <span
            style={{
              fontSize: size * 0.48,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: isLight ? '#FFFFFF' : '#0F172A',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textTransform: 'uppercase' as const,
            }}
          >
            MODULUS
          </span>
          <span
            style={{
              fontSize: size * 0.18,
              fontWeight: 500,
              letterSpacing: '0.25em',
              color: isLight ? 'rgba(255,255,255,0.6)' : '#64748B',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textTransform: 'uppercase' as const,
              marginTop: size * 0.02,
            }}
          >
            BUSINESS
          </span>
        </div>
      )}
    </div>
  )
}

export function ModulusLogoSvgOnly({ size = 40 }: { size?: number }) {
  const uid = `mlogo-only-${size}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="12" fill={`url(#${uid}-bg)`} />

      <rect x="3" y="3" width="58" height="58" rx="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      <rect x="12" y="14" width="6" height="36" rx="0" fill="white" opacity="0.95" />
      <rect x="46" y="14" width="6" height="36" rx="0" fill="white" opacity="0.95" />

      <path
        d="M15 14L32 36L49 14"
        fill="none"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="square"
        strokeLinejoin="miter"
        opacity="0.95"
      />

      <rect x="29" y="28" width="6" height="22" rx="0" fill="white" opacity="0.85" />

      <line x1="10" y1="53" x2="54" y2="53" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  )
}
