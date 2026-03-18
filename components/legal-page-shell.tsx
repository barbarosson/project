import { ReactNode } from 'react'
import { ModulusFooter } from '@/components/marketing/parasut-footer'

/** Yasal sayfalar: ana ekranla aynı klasik lacivert arka plan + içerik kartı + footer */
export function LegalPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0A2540' }}>
      <div className="flex-1 pt-28 pb-10 px-4 sm:px-6 sm:pt-32">
        <div
          className="mx-auto max-w-3xl rounded-2xl p-6 sm:p-10 shadow-2xl"
          style={{
            backgroundColor: 'rgba(255,255,255,0.98)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {children}
        </div>
      </div>
      <ModulusFooter />
    </div>
  )
}
