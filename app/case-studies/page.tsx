'use client'

import { MarketingLayout } from '@/components/marketing/marketing-layout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingDown, TrendingUp, Clock, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function CaseStudiesPage() {
  const caseStudies = [
    {
      company: 'TechFlow Industries',
      industry: 'Manufacturing',
      size: '250+ employees',
      location: 'Istanbul, Turkey',
      challenge: 'TechFlow was struggling with manual inventory tracking across three warehouses. Stockouts were costing them thousands daily, while excess inventory tied up valuable capital. Their spreadsheet-based system couldn\'t keep up with growing demand.',
      solution: 'We implemented Modulus Business\'s real-time inventory management system with automated reordering thresholds and demand forecasting algorithms. The system integrated seamlessly with their existing POS and accounting software.',
      implementation: '2 weeks from kickoff to full deployment, including data migration and team training.',
      results: [
        { label: 'Inventory costs reduced', value: '35%', icon: TrendingDown },
        { label: 'Fulfillment speed increased', value: '2x', icon: TrendingUp },
        { label: 'Weekly time saved', value: '20hrs', icon: Clock },
        { label: 'Stockout incidents', value: '-90%', icon: TrendingDown },
      ],
      testimonial: {
        quote: 'Modulus Business completely transformed our operations. The ROI was clear within the first quarter, and we\'ve seen consistent improvements ever since. The team\'s support throughout implementation was exceptional.',
        author: 'Ahmet Yılmaz',
        title: 'Operations Director',
      },
      keyFeatures: [
        'Real-time inventory tracking across multiple locations',
        'Automated reorder point calculations',
        'Demand forecasting based on historical data',
        'Mobile app for warehouse staff',
      ],
    },
    {
      company: 'RetailHub Solutions',
      industry: 'E-commerce & Retail',
      size: '150+ employees',
      location: 'Ankara, Turkey',
      challenge: 'RetailHub operated both online and physical stores but lacked a unified system. Inventory discrepancies between channels led to overselling online and disappointed customers. Order processing was slow and error-prone.',
      solution: 'We deployed an omnichannel platform that synchronized inventory in real-time across all sales channels. Automated order routing ensured efficient fulfillment from the nearest location, whether warehouse or store.',
      implementation: '3 weeks including integration with their e-commerce platform, POS systems, and existing warehouse management.',
      results: [
        { label: 'Order accuracy', value: '99.8%', icon: TrendingUp },
        { label: 'Processing time reduced', value: '65%', icon: TrendingDown },
        { label: 'Customer satisfaction', value: '+45%', icon: TrendingUp },
        { label: 'Return rate decreased', value: '28%', icon: TrendingDown },
      ],
      testimonial: {
        quote: 'The integration was seamless, and the impact on our customer satisfaction has been remarkable. We can now promise and deliver accurate ETAs, which has significantly boosted our repeat purchase rate.',
        author: 'Elif Demir',
        title: 'CEO',
      },
      keyFeatures: [
        'Unified inventory across all channels',
        'Intelligent order routing',
        'Real-time stock synchronization',
        'Customer-facing order tracking',
      ],
    },
    {
      company: 'GreenLogistics Co.',
      industry: 'Distribution & Logistics',
      size: '300+ employees',
      location: 'Izmir, Turkey',
      challenge: 'Managing a fleet of 50+ vehicles and coordinating deliveries across 5 warehouses was overwhelming. Route planning was inefficient, leading to high fuel costs and late deliveries. Customer complaints were increasing.',
      solution: 'Implemented comprehensive logistics management with AI-powered route optimization, real-time vehicle tracking, and automated dispatch. Integrated with their existing accounting and customer communication systems.',
      implementation: '4 weeks including GPS hardware installation, driver training, and system integration.',
      results: [
        { label: 'Fuel costs reduced', value: '42%', icon: TrendingDown },
        { label: 'On-time deliveries', value: '96%', icon: TrendingUp },
        { label: 'Daily deliveries increased', value: '+35%', icon: TrendingUp },
        { label: 'Customer complaints', value: '-78%', icon: TrendingDown },
      ],
      testimonial: {
        quote: 'The ROI exceeded our expectations. Not only did we cut costs significantly, but our delivery reliability has made us the preferred partner for major retailers. The system practically runs itself now.',
        author: 'Mehmet Kaya',
        title: 'Logistics Manager',
      },
      keyFeatures: [
        'AI-powered route optimization',
        'Real-time fleet tracking',
        'Automated dispatch and scheduling',
        'Driver mobile app with navigation',
      ],
    },
  ]

  return (
    <MarketingLayout>
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="container-marketing">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#00D4AA' }}>
                Case Studies
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" style={{ color: '#0A2540' }}>
              Real businesses, real results
            </h1>
            <p className="text-xl" style={{ color: '#425466' }}>
              See how companies across different industries achieved measurable success with Modulus Business
            </p>
          </div>

          <div className="space-y-16">
            {caseStudies.map((study, index) => (
              <Card key={index} className="overflow-hidden bg-white">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 p-8 lg:p-12 space-y-8">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <h2 className="text-3xl font-bold" style={{ color: '#0A2540' }}>{study.company}</h2>
                        <Badge variant="secondary" className="text-base" style={{ backgroundColor: '#00D4AA20', color: '#0A2540' }}>
                          {study.industry}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm" style={{ color: '#425466' }}>
                        <span>{study.size}</span>
                        <span>•</span>
                        <span>{study.location}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold uppercase tracking-wide text-sm mb-3" style={{ color: '#EF4444' }}>
                        The Challenge
                      </h3>
                      <p className="text-lg leading-relaxed" style={{ color: '#425466' }}>
                        {study.challenge}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold uppercase tracking-wide text-sm mb-3" style={{ color: '#00D4AA' }}>
                        The Solution
                      </h3>
                      <p className="text-lg leading-relaxed mb-4" style={{ color: '#425466' }}>
                        {study.solution}
                      </p>
                      <div className="rounded-lg p-4" style={{ backgroundColor: '#00D4AA10' }}>
                        <p className="text-sm font-medium" style={{ color: '#0A2540' }}>
                          ⏱️ Implementation: {study.implementation}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold uppercase tracking-wide text-sm mb-4" style={{ color: '#0A2540' }}>
                        Key Features Deployed
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {study.keyFeatures.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#00D4AA' }} />
                            <span className="text-sm" style={{ color: '#425466' }}>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t" style={{ borderColor: '#E6EBF1' }}>
                      <blockquote className="relative">
                        <div className="text-4xl absolute -top-2 -left-2" style={{ color: '#00D4AA40' }}>"</div>
                        <p className="text-lg italic pl-6 mb-4" style={{ color: '#0A2540' }}>
                          {study.testimonial.quote}
                        </p>
                        <footer className="flex items-center gap-3 pl-6">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                            style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0D3158 100%)' }}
                          >
                            {study.testimonial.author.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-semibold" style={{ color: '#0A2540' }}>{study.testimonial.author}</div>
                            <div className="text-sm" style={{ color: '#425466' }}>
                              {study.testimonial.title}, {study.company}
                            </div>
                          </div>
                        </footer>
                      </blockquote>
                    </div>
                  </div>

                  <div className="p-8 lg:p-12" style={{ background: 'linear-gradient(135deg, #F6F9FC 0%, #E6EBF1 100%)' }}>
                    <h3 className="font-semibold uppercase tracking-wide text-sm mb-6" style={{ color: '#0A2540' }}>
                      Measurable Results
                    </h3>
                    <div className="space-y-4">
                      {study.results.map((result, i) => {
                        const Icon = result.icon
                        return (
                          <div key={i} className="bg-white rounded-xl p-6 shadow-sm" style={{ borderLeft: '3px solid #00D4AA' }}>
                            <div className="flex items-center gap-3 mb-2">
                              <Icon className="h-6 w-6" style={{ color: '#00D4AA' }} />
                              <span className="text-3xl font-bold" style={{ color: '#0A2540' }}>{result.value}</span>
                            </div>
                            <p className="text-sm" style={{ color: '#425466' }}>{result.label}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center p-12 rounded-3xl" style={{ background: 'linear-gradient(135deg, #F6F9FC 0%, #E6EBF1 100%)' }}>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#0A2540' }}>Ready to write your success story?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#425466' }}>
              Join these companies and hundreds more who have transformed their operations with Modulus Business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="gap-2" style={{ backgroundColor: '#0A2540', color: '#ffffff' }}>
                  Book a Demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/landing#pricing">
                <Button size="lg" variant="outline" style={{ borderColor: '#0A2540', color: '#0A2540' }}>
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
