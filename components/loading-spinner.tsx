'use client'

import { cn } from '@/lib/utils'
import { ModulusLogoSvgOnly } from '@/components/modulus-logo'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

const logoSizes = { sm: 48, md: 72, lg: 96, xl: 120 }
const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40'
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-6', className)}>
      <div className={cn('relative flex items-center justify-center', sizeClasses[size])}>
        <div className="animate-flip-3d">
          <ModulusLogoSvgOnly size={logoSizes[size]} />
        </div>
      </div>
      {text && (
        <p className="text-lg font-medium text-muted-foreground animate-pulse">{text}</p>
      )}

      <style jsx global>{`
        @keyframes flip-3d {
          0% {
            transform: perspective(400px) rotateY(0deg);
          }
          50% {
            transform: perspective(400px) rotateY(180deg);
          }
          100% {
            transform: perspective(400px) rotateY(360deg);
          }
        }

        .animate-flip-3d {
          animation: flip-3d 2s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        @keyframes flip-bounce {
          0%, 100% {
            transform: perspective(400px) rotateY(0deg) translateY(0);
          }
          25% {
            transform: perspective(400px) rotateY(180deg) translateY(-10px);
          }
          50% {
            transform: perspective(400px) rotateY(360deg) translateY(0);
          }
          75% {
            transform: perspective(400px) rotateY(540deg) translateY(-10px);
          }
        }
      `}</style>
    </div>
  )
}

export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}
