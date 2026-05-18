'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ModulusLogo } from '@/components/modulus-logo'
import { Button } from '@/components/ui/button'
import { Menu, X, Globe, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { getCorporateCopy } from '@/lib/corporate-marketing-copy'
import {
  CORPORATE_PRODUCT_AVAILABLE,
  CORPORATE_PRODUCT_HREFS,
  CORPORATE_PRODUCT_ORDER,
  type CorporateProductKey,
} from '@/lib/corporate-products'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ProductMenuIcon } from '@/components/marketing/product-menu-icons'

export function MarketingHeader() {
  const pathname = usePathname()
  const { language, setLanguage } = useLanguage()
  const c = getCorporateCopy(language)
  const isErpProductPage = pathname?.startsWith('/products/modulus-erp') ?? false
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

  const navNames: Record<CorporateProductKey, string> = {
    isendai: c.nav.isendai,
    erp: c.nav.modulusErp,
    appointflow: c.nav.appointflow,
  }

  const productLinks = CORPORATE_PRODUCT_ORDER.map((key) => ({
    key,
    name: navNames[key],
    href: CORPORATE_PRODUCT_HREFS[key],
    description: c.products[key].tagline,
    available: CORPORATE_PRODUCT_AVAILABLE[key],
  }))

  const topNav = [
    { name: c.nav.solutions, href: '/#solutions' },
    { name: c.nav.company, href: '/hakkimizda' },
    { name: c.nav.contact, href: '/contact' },
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
          <Link href="/" className="flex items-center shrink-0 mr-10 relative" style={{ height: '76px' }}>
            <ModulusLogo size={48} variant="default" showText={true} className="transition-opacity duration-300" />
          </Link>

          <div className="hidden lg:flex items-center gap-6 nav-links-24bold">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-auto items-center gap-1.5 border-0 bg-transparent p-0 font-bold transition-all duration-300 hover:opacity-80"
                  style={{ color: '#425466' }}
                >
                  <span>{c.nav.products}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 opacity-70" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[min(100vw-2rem,20rem)] p-2">
                {productLinks.map((item) =>
                  item.available ? (
                    <DropdownMenuItem key={item.key} asChild className="p-0 focus:bg-transparent">
                      <Link
                        href={item.href}
                        className="flex items-center gap-4 rounded-lg px-3 py-3.5 cursor-pointer transition-colors hover:bg-[#F6F9FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/40"
                      >
                        <ProductMenuIcon product={item.key} size={48} />
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block text-lg font-bold leading-tight text-[#0A2540]">
                            {item.name}
                          </span>
                          <span className="mt-1 block text-sm font-medium leading-snug text-[#425466]">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <div
                      key={item.key}
                      className="flex items-center gap-4 rounded-lg px-3 py-3.5 opacity-90"
                      aria-disabled
                    >
                      <ProductMenuIcon product={item.key} size={48} />
                      <span className="min-w-0 flex-1 text-left">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold leading-tight text-[#0A2540]">{item.name}</span>
                          <span className="rounded-full bg-[#E6EBF1] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#425466]">
                            {c.products.comingSoon}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm font-medium leading-snug text-[#425466]">
                          {item.description}
                        </span>
                      </span>
                    </div>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {topNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="transition-all duration-300 hover:opacity-80"
              >
                <span className="font-bold" style={{ color: '#425466' }}>
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
                  className="gap-1.5 text-lg font-bold hover:bg-gray-100 transition-colors duration-300"
                  style={{ color: '#425466' }}
                >
                  <Globe className="h-4 w-4" />
                  <span className="uppercase font-bold">{language}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem
                  onClick={() => setLanguage('tr')}
                  className={language === 'tr' ? 'bg-accent' : ''}
                >
                  Türkçe (TR)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage('en')}
                  className={language === 'en' ? 'bg-accent' : ''}
                >
                  English (EN)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {showHeaderCta && isErpProductPage && (
              <>
                <Link href="/login">
                  <Button
                    size="sm"
                    className="text-lg font-bold rounded-full px-5 transition-all duration-300"
                    style={{ backgroundColor: '#0A2540', color: '#ffffff' }}
                  >
                    {c.nav.signIn}
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="sm"
                    className="text-lg font-bold rounded-full px-5 transition-all duration-300"
                    style={{ backgroundColor: '#00D4AA', color: '#0A2540' }}
                  >
                    {c.nav.bookDemo}
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
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="py-6 px-6 space-y-1">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#425466]">
              {c.nav.products}
            </p>
            {productLinks.map((item) =>
              item.available ? (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-[#F6F9FC]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ProductMenuIcon product={item.key} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold text-[#0A2540]">{item.name}</span>
                    <span className="block text-sm font-medium text-[#425466]">{item.description}</span>
                  </span>
                </Link>
              ) : (
                <div
                  key={item.key}
                  className="flex items-center gap-3 py-3 px-3 rounded-lg opacity-90"
                  aria-disabled
                >
                  <ProductMenuIcon product={item.key} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-[#0A2540]">{item.name}</span>
                      <span className="rounded-full bg-[#E6EBF1] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#425466]">
                        {c.products.comingSoon}
                      </span>
                    </span>
                    <span className="block text-sm font-medium text-[#425466]">{item.description}</span>
                  </span>
                </div>
              )
            )}
            <DropdownMenuSeparator className="my-3" />
            {topNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-3 px-3 text-lg font-bold text-[#425466] hover:text-[#0A2540] hover:bg-[#F6F9FC] rounded-lg"
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
                  className="flex-1 font-bold rounded-full"
                  style={
                    language === 'tr'
                      ? { backgroundColor: '#0A2540', color: '#ffffff' }
                      : { borderColor: '#E6EBF1', color: '#425466' }
                  }
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
                  className="flex-1 font-bold rounded-full"
                  style={
                    language === 'en'
                      ? { backgroundColor: '#0A2540', color: '#ffffff' }
                      : { borderColor: '#E6EBF1', color: '#425466' }
                  }
                  onClick={() => {
                    setLanguage('en')
                    setIsMobileMenuOpen(false)
                  }}
                >
                  EN
                </Button>
              </div>
              {isErpProductPage && (
                <>
                  <Link href="/login" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full font-bold rounded-full"
                      style={{ borderColor: '#E6EBF1', color: '#0A2540' }}
                    >
                      {c.nav.signIn}
                    </Button>
                  </Link>
                  <Link href="/contact" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      className="w-full font-bold rounded-full"
                      style={{ backgroundColor: '#0A2540', color: '#ffffff' }}
                    >
                      {c.nav.bookDemo}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
