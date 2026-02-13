'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ModulusLogo } from '@/components/modulus-logo'
import { Button } from '@/components/ui/button'
import { Menu, X, Globe, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function MarketingHeader() {
  const { language, setLanguage, t } = useLanguage()
  const { config } = useSiteConfig()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showHeaderCta, setShowHeaderCta] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
      setShowHeaderCta(window.scrollY <= 100)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: t.marketing.nav.product, href: '/landing#product' },
    { name: t.marketing.nav.solutions, href: '/landing#solutions' },
    { name: t.marketing.nav.caseStudies, href: '/case-studies' },
    { name: t.marketing.nav.pricing, href: '/landing#pricing' },
    { name: t.marketing.nav.contact, href: '/contact' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
          : 'bg-white/80 backdrop-blur-md'
      }`}
      style={{ height: '80px' }}
    >
      <nav className="h-full" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px' }}>
        <div className="flex items-center justify-between h-full">
          <Link href="/landing" className="flex items-center shrink-0 mr-10 relative" style={{ height: '76px' }}>
            <ModulusLogo size={48} variant="default" showText={true} className="transition-opacity duration-300" />
          </Link>

          <div className="hidden lg:flex items-center gap-8 nav-links-24bold">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="transition-all duration-300 hover:opacity-80"
              >
                <span
                  className="font-bold"
                  style={{
                    color: '#425466',
                    fontSize: '24px',
                    fontWeight: 700,
                  }}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-2xl font-bold hover:bg-gray-100 transition-colors duration-300"
                  style={{ color: '#425466' }}
                >
                  <Globe className="h-4 w-4" />
                  <span className="uppercase text-2xl font-bold">{language}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem
                  onClick={() => setLanguage('tr')}
                  className={language === 'tr' ? 'bg-accent' : ''}
                >
                  Turkce (TR)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage('en')}
                  className={language === 'en' ? 'bg-accent' : ''}
                >
                  English (EN)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {showHeaderCta && (
              <>
                <Link href="/login">
                  <Button
                    size="sm"
                    className="text-2xl font-bold rounded-full px-5 transition-all duration-300"
                    style={{
                      backgroundColor: '#0A2540',
                      color: '#ffffff',
                    }}
                  >
                    {t.marketing.nav.signIn}
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="sm"
                    className="text-2xl font-bold rounded-full px-5 transition-all duration-300"
                    style={{
                      backgroundColor: '#0A2540',
                      color: '#ffffff',
                    }}
                  >
                    {t.marketing.nav.bookDemo}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            style={{ color: '#0A2540' }}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
          <div className="py-6 px-6 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-3 px-3 text-2xl font-bold text-[#425466] hover:text-[#0A2540] hover:bg-[#F6F9FC] rounded-lg transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-6 border-t border-gray-100 space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={language === 'tr' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-2xl font-bold rounded-full"
                  style={language === 'tr' ? { backgroundColor: '#0A2540', color: '#ffffff' } : { borderColor: '#E6EBF1', color: '#425466' }}
                  onClick={() => {
                    setLanguage('tr')
                    setIsMobileMenuOpen(false)
                  }}
                >
                  TR
                </Button>
                <Button
                  variant={language === 'en' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-2xl font-bold rounded-full"
                  style={language === 'en' ? { backgroundColor: '#0A2540', color: '#ffffff' } : { borderColor: '#E6EBF1', color: '#425466' }}
                  onClick={() => {
                    setLanguage('en')
                    setIsMobileMenuOpen(false)
                  }}
                >
                  EN
                </Button>
              </div>
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full text-2xl font-bold rounded-full" style={{ borderColor: '#E6EBF1', color: '#0A2540' }}>
                  {t.marketing.nav.signIn}
                </Button>
              </Link>
              <Link href="/contact" className="block">
                <Button className="w-full text-2xl font-bold rounded-full" style={{ backgroundColor: '#0A2540', color: '#ffffff' }}>
                  {t.marketing.nav.bookDemo}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
