'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  ArrowLeft,
  Bot,
  Camera,
  MessageCircle,
  BarChart3,
  FileText,
  Users,
  Package,
  DollarSign,
  CheckCircle2
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface ProductTourProps {
  open: boolean
  onClose: () => void
}

export function ProductTour({ open, onClose }: ProductTourProps) {
  const { language } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: Bot,
      gradient: 'from-blue-500 to-cyan-500',
      title: language === 'tr' ? 'AI CFO Asistanınız' : 'Your AI CFO Assistant',
      description: language === 'tr'
        ? 'Yapay zeka destekli finansal danışmanınız 7/24 yanınızda. Raporlar isteyin, analiz alın, sorularınıza anında cevap bulun.'
        : 'Your AI-powered financial advisor is available 24/7. Request reports, get analysis, and find instant answers.',
      features: language === 'tr'
        ? ['Anlık finansal raporlar', 'Akıllı öneriler', 'Tahmin ve öngörüler']
        : ['Instant financial reports', 'Smart recommendations', 'Forecasts and predictions']
    },
    {
      icon: FileText,
      gradient: 'from-green-500 to-emerald-500',
      title: language === 'tr' ? 'Fatura & Teklif Yönetimi' : 'Invoice & Proposal Management',
      description: language === 'tr'
        ? 'Profesyonel fatura ve teklifler oluşturun, gönderin ve takip edin. E-fatura entegrasyonu ile yasal süreçleri kolaylaştırın.'
        : 'Create, send, and track professional invoices and proposals. Simplify legal processes with e-invoice integration.',
      features: language === 'tr'
        ? ['Hızlı fatura oluşturma', 'Ödeme takibi', 'Otomatik hatırlatmalar']
        : ['Quick invoice creation', 'Payment tracking', 'Automatic reminders']
    },
    {
      icon: Camera,
      gradient: 'from-purple-500 to-pink-500',
      title: language === 'tr' ? 'OCR Gider Okuyucu' : 'OCR Expense Reader',
      description: language === 'tr'
        ? 'Fatura ve makbuzlarınızı fotoğraflayın, yapay zeka otomatik olarak okuyor ve sisteme kaydediyor. Artık manuel giriş yok!'
        : 'Take photos of invoices and receipts, AI reads and records them automatically. No more manual entry!',
      features: language === 'tr'
        ? ['Otomatik fatura okuma', 'Anlık kayıt', 'Kategori tanıma']
        : ['Automatic invoice reading', 'Instant recording', 'Category recognition']
    },
    {
      icon: MessageCircle,
      gradient: 'from-orange-500 to-red-500',
      title: language === 'tr' ? 'Hibrit Canlı Destek' : 'Hybrid Live Support',
      description: language === 'tr'
        ? 'Müşterilerinizle gerçek zamanlı sohbet edin. AI ilk yanıtı veriyor, gerektiğinde siz devreye giriyorsunuz.'
        : 'Chat with customers in real-time. AI provides first response, you take over when needed.',
      features: language === 'tr'
        ? ['Gerçek zamanlı chat', 'AI + İnsan desteği', 'Sohbet geçmişi']
        : ['Real-time chat', 'AI + Human support', 'Chat history']
    },
    {
      icon: Users,
      gradient: 'from-indigo-500 to-purple-500',
      title: language === 'tr' ? 'Müşteri & Stok Yönetimi' : 'Customer & Inventory Management',
      description: language === 'tr'
        ? 'Tüm müşterilerinizi ve ürünlerinizi tek yerden yönetin. Stok takibi, düşük stok uyarıları ve detaylı raporlar.'
        : 'Manage all customers and products from one place. Stock tracking, low stock alerts, and detailed reports.',
      features: language === 'tr'
        ? ['Müşteri profilleri', 'Stok takibi', 'Otomatik uyarılar']
        : ['Customer profiles', 'Stock tracking', 'Automatic alerts']
    },
    {
      icon: BarChart3,
      gradient: 'from-yellow-500 to-orange-500',
      title: language === 'tr' ? 'Raporlar & Analizler' : 'Reports & Analytics',
      description: language === 'tr'
        ? 'Gerçek zamanlı finansal raporlar, nakit akışı analizi ve tahminler. İşletmenizin nabzını hissedin.'
        : 'Real-time financial reports, cash flow analysis, and forecasts. Feel the pulse of your business.',
      features: language === 'tr'
        ? ['Nakit akışı grafiği', 'Gelir-gider analizi', 'Özelleştirilebilir raporlar']
        : ['Cash flow chart', 'Income-expense analysis', 'Customizable reports']
    }
  ]

  const currentStepData = steps[currentStep]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="p-5 pt-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${currentStepData.gradient} flex items-center justify-center shadow-lg`}>
                  <currentStepData.icon className="h-7 w-7 text-white" />
                </div>
              </div>

              <Badge variant="outline" className="text-xs">
                {language === 'tr' ? 'Adım' : 'Step'} {currentStep + 1} / {steps.length}
              </Badge>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentStepData.title}
                </h2>
                <p className="text-sm text-gray-600">
                  {currentStepData.description}
                </p>
              </div>

              <Card className="mx-auto">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {currentStepData.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2.5 text-left">
                        <CheckCircle2 className="h-4 w-4 text-[#2ECC71] flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {language === 'tr' ? 'Geri' : 'Previous'}
                </Button>

                <div className="flex gap-1">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentStep
                          ? 'bg-[#2ECC71] w-5'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-[#2ECC71] hover:bg-[#27AE60] gap-1.5"
                >
                  {currentStep === steps.length - 1
                    ? (language === 'tr' ? 'Başla' : 'Get Started')
                    : (language === 'tr' ? 'İleri' : 'Next')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {currentStep < steps.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 text-xs"
                >
                  {language === 'tr' ? 'Turu Atla' : 'Skip Tour'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
