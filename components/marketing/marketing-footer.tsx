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
        { name: t.marketing.footer.caseStudies, href: '/case-studies' },
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
        { name: t.marketing.footer.privacy, href: '#' },
        { name: t.marketing.footer.terms, href: '#' },
        { name: t.marketing.footer.cookies, href: '#' },
        { name: t.marketing.footer.kvkk, href: '#' },
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
          </div>
        </div>
      </div>
    </footer>
  )
}
