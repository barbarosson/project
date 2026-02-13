'use client'

import Image from 'next/image'
import { useLanguage } from '@/contexts/language-context'
import { Laptop, Smartphone, Mail, Phone, MapPin, Twitter, Linkedin, Facebook } from 'lucide-react'
import { ModulusLogo } from '@/components/modulus-logo'

export function PublicFooter() {
  const { language } = useLanguage()

  const footerLinks = {
    product: {
      title: language === 'tr' ? 'Ürün' : 'Product',
      links: [
        { label: language === 'tr' ? 'Özellikler' : 'Features', href: '#features' },
        { label: language === 'tr' ? 'Fiyatlandırma' : 'Pricing', href: '#pricing' },
        { label: language === 'tr' ? 'Güvenlik' : 'Security', href: '#' },
        { label: language === 'tr' ? 'Yol Haritası' : 'Roadmap', href: '#' }
      ]
    },
    company: {
      title: language === 'tr' ? 'Şirket' : 'Company',
      links: [
        { label: language === 'tr' ? 'Hakkımızda' : 'About Us', href: '#' },
        { label: language === 'tr' ? 'Blog' : 'Blog', href: '#' },
        { label: language === 'tr' ? 'Kariyer' : 'Careers', href: '#' },
        { label: language === 'tr' ? 'İletişim' : 'Contact', href: '#' },
        { label: 'Admin', href: '/admin/login' }
      ]
    },
    legal: {
      title: language === 'tr' ? 'Yasal' : 'Legal',
      links: [
        { label: language === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy', href: '#' },
        { label: language === 'tr' ? 'Kullanım Şartları' : 'Terms of Service', href: '#' },
        { label: language === 'tr' ? 'Çerez Politikası' : 'Cookie Policy', href: '#' },
        { label: language === 'tr' ? 'KVKK' : 'GDPR', href: '#' }
      ]
    },
    support: {
      title: language === 'tr' ? 'Destek' : 'Support',
      links: [
        { label: language === 'tr' ? 'Yardım Merkezi' : 'Help Center', href: '#' },
        { label: language === 'tr' ? 'Dokümantasyon' : 'Documentation', href: '#' },
        { label: language === 'tr' ? 'API' : 'API', href: '#' },
        { label: language === 'tr' ? 'Durum' : 'Status', href: '#' }
      ]
    }
  }

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <ModulusLogo size={38} variant="light" />
            </div>
            <p className="text-gray-400 mb-4 text-sm">
              {language === 'tr'
                ? 'Finansal yönetimini basitleştir. Modulus ile akıllı kararlar al, sağlam temeller üzerine büyü.'
                : 'Simplify financial management. Make smart decisions and build on solid foundations with Modulus.'}
            </p>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Smartphone className="h-4 w-4" />
              <Laptop className="h-4 w-4" />
              <span>{language === 'tr' ? 'Web & Mobil Uyumlu' : 'Web & Mobile Compatible'}</span>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-[#00D4AA] text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact & Social */}
        <div className="border-t border-slate-800 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-4">
                {language === 'tr' ? 'İletişim' : 'Contact'}
              </h3>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:info@modulus.app" className="hover:text-[#00D4AA]">
                    info@modulus.app
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href="tel:+902121234567" className="hover:text-[#00D4AA]">
                    +90 212 123 45 67
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <span>
                    {language === 'tr'
                      ? 'Maslak Mahallesi, Büyükdere Caddesi No:123, Sarıyer/İstanbul'
                      : 'Maslak District, Büyükdere Street No:123, Sarıyer/Istanbul'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">
                {language === 'tr' ? 'Bizi Takip Edin' : 'Follow Us'}
              </h3>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-[#00D4AA] flex items-center justify-center transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-[#00D4AA] flex items-center justify-center transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-[#00D4AA] flex items-center justify-center transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>
            &copy; 2026 MODULUS. {language === 'tr' ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}
          </p>
          <p className="text-xs">
            {language === 'tr'
              ? 'AI destekli işletme yönetim platformu'
              : 'AI-powered business management platform'}
          </p>
        </div>
      </div>
    </footer>
  )
}
