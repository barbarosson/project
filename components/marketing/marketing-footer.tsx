'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Twitter, Linkedin, Github } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'
import { ModulusLogo } from '@/components/modulus-logo'

export function MarketingFooter() {
  const { t } = useLanguage()
  const { config } = useSiteConfig()

  const companyName =
    (config && (config as any).site_name_tr) || 'Songurtech - Barbaros Songur'
  const companyAddress =
    (config && (config as any).contact_address) || 'Küçükbakkalköy, Selvili Sok. No:4/48, 34750 Ataşehir/İstanbul'

  const footerLinks = {
    product: {
      title: t.marketing.footer.product,
      links: [
        { name: t.marketing.footer.features, href: '/landing#features' },
        { name: t.marketing.footer.solutions, href: '/landing#solutions' },
        { name: t.marketing.footer.pricing, href: '/landing#pricing' },
        { name: t.marketing.footer.updates, href: '#' },
      ],
    },
    company: {
      title: t.marketing.footer.company,
      links: [
        { name: t.marketing.footer.about, href: '#' },
        { name: t.marketing.footer.careers, href: '#' },
        { name: t.marketing.footer.blog, href: '#' },
      ],
    },
    resources: {
      title: t.marketing.footer.resources,
      links: [
        { name: t.marketing.footer.documentation, href: '#' },
        { name: t.marketing.footer.helpCenter, href: '#' },
        { name: t.marketing.footer.community, href: '#' },
        { name: t.marketing.footer.contact, href: '/contact' },
      ],
    },
    legal: {
      title: t.marketing.footer.legal,
      links: [
        { name: 'Gizlilik Politikası', href: '/gizlilik' },
        { name: 'İptal ve İade Şartları', href: '/teslimat-iade#iptal-iade' },
        { name: 'Teslimat Politikası', href: '/teslimat-iade#teslimat' },
        { name: 'Mesafeli Satış Sözleşmesi', href: '/mesafeli-satis' },
      ],
    },
  }

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'GitHub', icon: Github, href: '#' },
  ]

  return (
    <footer className="bg-gray-50 border-t">
      <div className="container-marketing">
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {Object.values(footerLinks).map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-sm mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-auto-contrast-muted-light hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <ModulusLogo size={30} />
              </div>

              <div className="text-center md:text-left">
                <div className="text-sm font-semibold text-[#0A2540]">{companyName}</div>
                <div className="text-xs text-auto-contrast-muted-light">{companyAddress}</div>
              </div>

              <p className="text-sm text-auto-contrast-muted-light">
                © 2026 ModulusTech. {t.marketing.footer.allRightsReserved}
              </p>

              <div className="flex items-center gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <Link
                      key={social.name}
                      href={social.href}
                      className="text-auto-contrast-muted-light hover:text-foreground transition-colors"
                      aria-label={social.name}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 opacity-90">
              <Image src="/payments/visa.svg" alt="Visa" width={56} height={18} className="h-4 w-auto" />
              <Image src="/payments/mastercard.svg" alt="Mastercard" width={80} height={18} className="h-4 w-auto" />
              <Image src="/payments/iyzico-ile-ode.svg" alt="iyzico ile Öde" width={120} height={22} className="h-4.5 w-auto" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
