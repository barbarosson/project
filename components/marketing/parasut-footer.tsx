'use client'

import Link from 'next/link'
import { ModulusLogo } from '@/components/modulus-logo'
import { Facebook, Twitter, Linkedin, Github, Circle } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'

export function ParasutFooter() {
  const { language } = useLanguage()
  const { config } = useSiteConfig()

  const footerSections = {
    product: {
      title: language === 'en' ? 'Product' : 'Urun',
      links: [
        { name: language === 'en' ? 'Features' : 'Ozellikler', href: '/landing#features' },
        { name: language === 'en' ? 'Pricing' : 'Fiyatlandirma', href: '/pricing' },
        { name: language === 'en' ? 'Integrations' : 'Entegrasyonlar', href: '#' },
        { name: language === 'en' ? 'API Documentation' : 'API Dokumantasyon', href: '#' },
        { name: language === 'en' ? 'Changelog' : 'Guncellemeler', href: '#' }
      ]
    },
    resources: {
      title: language === 'en' ? 'Resources' : 'Kaynaklar',
      links: [
        { name: language === 'en' ? 'Help Center' : 'Yardim Merkezi', href: '/help' },
        { name: language === 'en' ? 'Blog' : 'Blog', href: '#' },
        { name: language === 'en' ? 'Case Studies' : 'Basari Hikayeleri', href: '/case-studies' },
        { name: language === 'en' ? 'Tutorials' : 'Egitimler', href: '#' },
        { name: language === 'en' ? 'Community' : 'Topluluk', href: '#' }
      ]
    },
    company: {
      title: language === 'en' ? 'Company' : 'Sirket',
      links: [
        { name: language === 'en' ? 'About Us' : 'Hakkimizda', href: '#' },
        { name: language === 'en' ? 'Careers' : 'Kariyer', href: '#' },
        { name: language === 'en' ? 'Contact' : 'Iletisim', href: '/contact' },
        { name: language === 'en' ? 'Press Kit' : 'Basin Kiti', href: '#' },
        { name: language === 'en' ? 'Partners' : 'Partnerler', href: '#' },
        { name: 'Admin', href: '/admin/login' }
      ]
    },
    legal: {
      title: language === 'en' ? 'Legal' : 'Yasal',
      links: [
        { name: language === 'en' ? 'Privacy Policy' : 'Gizlilik Politikasi', href: '#' },
        { name: language === 'en' ? 'Terms of Service' : 'Kullanim Sartlari', href: '#' },
        { name: language === 'en' ? 'Cookie Policy' : 'Cerez Politikasi', href: '#' },
        { name: language === 'en' ? 'GDPR' : 'KVKK', href: '#' },
        { name: language === 'en' ? 'Security' : 'Guvenlik', href: '#' }
      ]
    }
  }

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'GitHub', icon: Github, href: '#' }
  ]

  return (
    <footer style={{ backgroundColor: '#0A2540' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div className="py-20 lg:py-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16 mb-16">
            {Object.values(footerSections).map((section) => (
              <div key={section.title}>
                <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-[15px] transition-colors duration-200 hover:text-[#00D4AA]"
                        style={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
              <Link href="/login" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <ModulusLogo size={56} variant="light" showText={true} />
              </Link>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Circle className="h-2 w-2" style={{ fill: '#00D4AA', color: '#00D4AA' }} />
                  <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {language === 'en' ? 'All Systems Operational' : 'Tum Sistemler Calisiyor'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {socialLinks.map((social) => {
                    const Icon = social.icon
                    return (
                      <Link
                        key={social.name}
                        href={social.href}
                        className="transition-colors duration-200 hover:text-[#00D4AA]"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                        aria-label={social.name}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 text-center lg:text-left">
              <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                &copy; 2026 Modulus Business.{' '}
                {language === 'en' ? 'All rights reserved.' : 'Tum haklari saklidir.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
