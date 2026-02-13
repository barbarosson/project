import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, TrendingDown, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

export function CaseStudiesSection() {
  const caseStudies = [
    {
      company: 'TechFlow Industries',
      industry: 'Manufacturing',
      problem: 'Manual inventory tracking causing frequent stockouts and overstock situations, resulting in lost revenue and tied-up capital.',
      solution: 'Implemented real-time inventory management with automated reordering and demand forecasting.',
      results: [
        { label: 'Reduced inventory costs', value: '35%', icon: TrendingDown, trend: 'down' },
        { label: 'Increased fulfillment speed', value: '2x', icon: TrendingUp, trend: 'up' },
        { label: 'Time saved weekly', value: '20hrs', icon: Clock, trend: 'neutral' },
      ],
      testimonial: 'Modulus Business completely transformed our operations. The ROI was clear within the first quarter.',
    },
    {
      company: 'RetailHub Solutions',
      industry: 'E-commerce',
      problem: 'Disconnected systems for online and offline sales leading to inventory discrepancies and poor customer experience.',
      solution: 'Unified omnichannel platform with real-time sync across all sales channels and automated order routing.',
      results: [
        { label: 'Order accuracy improved', value: '99.8%', icon: TrendingUp, trend: 'up' },
        { label: 'Processing time reduced', value: '65%', icon: TrendingDown, trend: 'down' },
        { label: 'Customer satisfaction', value: '+45%', icon: TrendingUp, trend: 'up' },
      ],
      testimonial: 'The integration was seamless, and the impact on our customer satisfaction has been remarkable.',
    },
  ]

  return (
    <section id="case-studies" className="section-spacing bg-gray-50">
      <div className="container-marketing">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              Case Studies
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Real results from real businesses
          </h2>
          <p className="text-lg text-auto-contrast-muted-light max-w-2xl mx-auto">
            See how companies like yours achieved measurable success with Modulus Business
          </p>
        </div>

        <div className="space-y-8 max-w-5xl mx-auto">
          {caseStudies.map((study, index) => (
            <Card key={index} className="p-8 lg:p-12 bg-white hover:shadow-xl transition-shadow">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-2xl font-semibold">{study.company}</h3>
                      <Badge variant="secondary">{study.industry}</Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-red-600 uppercase tracking-wide mb-2">
                      Challenge
                    </h4>
                    <p className="text-auto-contrast-muted-light">{study.problem}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-primary uppercase tracking-wide mb-2">
                      Solution
                    </h4>
                    <p className="text-auto-contrast-muted-light">{study.solution}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="italic text-foreground">"{study.testimonial}"</p>
                  </div>
                </div>

                <div className="lg:w-80 flex-shrink-0">
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 space-y-4">
                    <h4 className="font-semibold text-sm uppercase tracking-wide mb-4">
                      Key Results
                    </h4>
                    {study.results.map((result, i) => {
                      const Icon = result.icon
                      return (
                        <div key={i} className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-1">
                            <Icon className={`h-5 w-5 ${
                              result.trend === 'up' ? 'text-green-600' :
                              result.trend === 'down' ? 'text-green-600' :
                              'text-primary'
                            }`} />
                            <span className="text-2xl font-bold">{result.value}</span>
                          </div>
                          <p className="text-sm text-auto-contrast-muted-light">{result.label}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/case-studies">
            <Button variant="outline" size="lg" className="gap-2">
              View All Case Studies
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
