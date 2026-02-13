'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Globe, Menu, X } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'
import { ModulusLogo } from '@/components/modulus-logo'

export function PublicHeader() {
  const router = useRouter()
  const { language, setLanguage } = useLanguage()
  const { config } = useSiteConfig()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  const navItems = [
    { label: language === 'tr' ? 'Özellikler' : 'Features', id: 'features' },
    { label: language === 'tr' ? 'Nasıl Çalışır' : 'How it Works', id: 'how-it-works' },
    { label: language === 'tr' ? 'Fiyatlandırma' : 'Pricing', id: 'pricing' }
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <ModulusLogo size={38} />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-gray-700 hover:text-[#00D4AA] font-medium transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              {language === 'tr' ? 'EN' : 'TR'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
            >
              {language === 'tr' ? 'Giriş Yap' : 'Sign In'}
            </Button>
            <Button
              onClick={() => router.push('/login?mode=register')}
              className="bg-[#00D4AA] hover:bg-[#00B894] text-white"
            >
              {language === 'tr' ? 'Ücretsiz Başla' : 'Start Free'}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-gray-700 hover:text-[#00D4AA] font-medium text-left"
                >
                  {item.label}
                </button>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                  className="gap-2 justify-center"
                >
                  <Globe className="h-4 w-4" />
                  {language === 'tr' ? 'Switch to English' : 'Türkçeye Geç'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push('/login')
                    setMobileMenuOpen(false)
                  }}
                  className="w-full"
                >
                  {language === 'tr' ? 'Giriş Yap' : 'Sign In'}
                </Button>
                <Button
                  onClick={() => {
                    router.push('/login?mode=register')
                    setMobileMenuOpen(false)
                  }}
                  className="bg-[#00D4AA] hover:bg-[#00B894] text-white w-full"
                >
                  {language === 'tr' ? 'Ücretsiz Başla' : 'Start Free'}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
