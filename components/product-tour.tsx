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
      <DialogContent className="max-w-[380px] max-h-[min(80vh,480px)] overflow-x-hidden overflow-y-auto p-0 gap-0">
        <div className="relative min-w-0">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00D4AA] to-[#00B894] transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="p-3 pt-5 overflow-y-auto overflow-x-hidden max-h-[min(80vh,460px)] min-w-0">
            <div className="text-center space-y-2 min-w-0">
              <div className="flex justify-center">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${currentStepData.gradient} flex items-center justify-center shadow-md`}>
                  <currentStepData.icon className="h-4 w-4 text-white" />
                </div>
              </div>

              <Badge variant="outline" className="text-[9px] px-1 py-0">
                {language === 'tr' ? 'Adım' : 'Step'} {currentStep + 1} / {steps.length}
              </Badge>

              <div className="space-y-1">
                <h2 className="text-sm font-bold text-gray-900 leading-tight">
                  {currentStepData.title}
                </h2>
                <p className="text-[11px] text-gray-600 leading-snug line-clamp-2">
                  {currentStepData.description}
                </p>
              </div>

              <Card className="mx-auto w-full max-w-full overflow-hidden">
                <CardContent className="p-2">
                  <div className="space-y-1 overflow-hidden">
                    {currentStepData.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-1.5 text-left min-w-0">
                        <CheckCircle2 className="h-3 w-3 text-[#00D4AA] flex-shrink-0" />
                        <span className="text-[11px] text-gray-700 break-words">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between pt-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] gap-1 px-2"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-3 w-3" />
                  {language === 'tr' ? 'Geri' : 'Prev'}
                </Button>

                <div className="flex items-center gap-[3px] shrink-0">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`rounded-full transition-all shrink-0 ${
                        index === currentStep
                          ? 'bg-[#00D4AA]'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      style={{
                        width: index === currentStep ? 5 : 3,
                        height: index === currentStep ? 5 : 3,
                        minWidth: index === currentStep ? 5 : 3,
                        minHeight: index === currentStep ? 5 : 3,
                      }}
                    />
                  ))}
                </div>

                <Button
                  size="sm"
                  className="h-7 text-[11px] bg-[#00D4AA] hover:bg-[#00B894] gap-1 px-2"
                  onClick={handleNext}
                >
                  {currentStep === steps.length - 1
                    ? (language === 'tr' ? 'Başla' : 'Start')
                    : (language === 'tr' ? 'İleri' : 'Next')}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>

              {currentStep < steps.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-600 hover:text-gray-800 text-[9px] h-5 px-2 mt-0.5 border border-gray-200 hover:bg-gray-100"
                >
                  {language === 'tr' ? 'Turu Atla' : 'Skip'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
