'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'

export function FAQSection() {
  const { t, language } = useLanguage()
  const { config } = useSiteConfig()
  const faqs = [
    {
      question: 'How long does implementation take?',
      answer: 'Most businesses are up and running within 2-3 days. Our team handles data migration, system configuration, and provides comprehensive training to ensure a smooth transition.',
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'All plans include email support with response times under 24 hours. Advanced and Enterprise plans get priority support, live chat, and phone support. Enterprise customers also get a dedicated account manager.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use bank-level encryption (AES-256), maintain SOC 2 compliance, and store all data in secure, redundant servers. We also provide complete audit trails and role-based access control.',
    },
    {
      question: 'Can I integrate with my existing tools?',
      answer: 'Yes! We offer native integrations with popular accounting software, payment gateways, and business tools. Advanced and Enterprise plans also include API access for custom integrations.',
    },
    {
      question: 'What if I need to migrate from another system?',
      answer: 'We provide free data migration assistance for all new customers. Our team will help you export data from your current system and import it into ModulusTech without any data loss.',
    },
    {
      question: 'Can I cancel or change my plan anytime?',
      answer: 'Yes, you can upgrade, downgrade, or cancel your subscription at any time. There are no long-term contracts or cancellation fees. You only pay for what you use.',
    },
    {
      question: 'Do you offer training for my team?',
      answer: 'Yes! All plans include comprehensive onboarding documentation and video tutorials. Advanced and Enterprise plans include personalized training sessions for your team.',
    },
    {
      question: 'What happens during the free trial?',
      answer: 'You get full access to all features of your chosen plan for 14 days, completely free. No credit card required to start. You can cancel anytime during the trial with no obligations.',
    },
  ]

  return (
    <section id="faq" className="section-spacing bg-gray-50">
      <div className="container-marketing">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              {t.marketing.faq.eyebrow}
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {config ? (language === 'en' ? config.faq_title_en : config.faq_title_tr) : t.marketing.faq.title}
          </h2>
          <p className="text-lg text-auto-contrast-muted-light max-w-2xl mx-auto">
            {config ? (language === 'en' ? config.faq_subtitle_en : config.faq_subtitle_tr) : t.marketing.faq.subtitle}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white border rounded-lg px-6 shadow-sm"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-auto-contrast-muted-light pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center p-8 bg-white rounded-2xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-2">{t.marketing.faq.stillQuestions}</h3>
            <p className="text-auto-contrast-muted-light mb-4">
              {t.marketing.faq.stillQuestionsDesc}
            </p>
            <a
              href="/contact"
              className="text-primary font-medium hover:underline"
            >
              {t.marketing.faq.contactSupport} →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
