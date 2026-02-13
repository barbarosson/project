'use client'

import { Star, Quote } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'

export function SocialProofSection() {
  const { t, language } = useLanguage()
  const { config } = useSiteConfig()

  const testimonials = [
    {
      quote: "ModulusTech transformed our operations completely. We reduced manual work by 60% and increased productivity across all departments.",
      author: "Sarah Johnson",
      title: "Operations Director",
      company: "TechCorp International",
      rating: 5,
    },
    {
      quote: "The ROI was immediate. Within the first month, we streamlined our invoicing process and improved cash flow visibility dramatically.",
      author: "Michael Chen",
      title: "CFO",
      company: "Growth Ventures Ltd",
      rating: 5,
    },
    {
      quote: "Outstanding support and an intuitive interface. Our team was up and running in days, not weeks. Highly recommended for growing businesses.",
      author: "Emma Williams",
      title: "CEO",
      company: "Innovate Solutions",
      rating: 5,
    },
  ]

  return (
    <section className="section-spacing bg-gray-50">
      <div className="container-marketing">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              {t.marketing.socialProof.eyebrow}
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {config ? (language === 'en' ? config.social_proof_title_en : config.social_proof_title_tr) : t.marketing.socialProof.title}
          </h2>
          <p className="text-lg text-auto-contrast-muted-light max-w-2xl mx-auto">
            {config ? (language === 'en' ? config.social_proof_subtitle_en : config.social_proof_subtitle_tr) : t.marketing.socialProof.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-8 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <Quote className="h-8 w-8 text-primary/20 mb-4" />

              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold">
                  {testimonial.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-sm">{testimonial.author}</div>
                  <div className="text-xs text-auto-contrast-muted-light">
                    {testimonial.title}, {testimonial.company}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-8 p-6 bg-white rounded-2xl shadow-sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-auto-contrast-muted-light">{t.marketing.socialProof.activeUsers}</div>
            </div>
            <div className="w-px h-12 bg-border"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">98%</div>
              <div className="text-sm text-auto-contrast-muted-light">{t.marketing.socialProof.satisfactionRate}</div>
            </div>
            <div className="w-px h-12 bg-border"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50M+</div>
              <div className="text-sm text-auto-contrast-muted-light">{t.marketing.socialProof.transactions}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
