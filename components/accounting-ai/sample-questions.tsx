'use client'

import { Button } from '@/components/ui/button'
import { BookOpen, Scale, FileText, Calculator, Building, Landmark } from 'lucide-react'

interface SampleQuestionsProps {
  onSelect: (question: string) => void
  isTR: boolean
}

const QUESTIONS_TR = [
  { icon: BookOpen, text: 'Defteri Kebir nedir ve nasil tutulur?', category: 'Defterler' },
  { icon: Scale, text: 'TMS/TFRS ile BOBİ FRS arasinda stok degerlemesi bakimindan ne fark vardir?', category: 'Standartlar' },
  { icon: FileText, text: 'Fatura duzenleme siniri nedir ve hangi islemler icin fatura zorunludur?', category: 'Belgeler' },
  { icon: Calculator, text: 'Amortisman hesaplama yontemleri nelerdir?', category: 'Muhasebe' },
  { icon: Building, text: 'Sirketlerin bagimsiz denetim yukumlulugu sartlari nelerdir?', category: 'Denetim' },
  { icon: Landmark, text: 'KDV beyannamesi ne zaman ve nasil verilir?', category: 'Vergi' },
]

const QUESTIONS_EN = [
  { icon: BookOpen, text: 'What is a General Ledger and how is it maintained in Turkey?', category: 'Ledgers' },
  { icon: Scale, text: 'What are the differences between TMS/TFRS and BOBI FRS for inventory valuation?', category: 'Standards' },
  { icon: FileText, text: 'What is the invoice issuance threshold and when are invoices mandatory?', category: 'Documents' },
  { icon: Calculator, text: 'What are the depreciation calculation methods?', category: 'Accounting' },
  { icon: Building, text: 'What are the independent audit requirements for companies?', category: 'Audit' },
  { icon: Landmark, text: 'When and how should VAT returns be filed?', category: 'Tax' },
]

export function SampleQuestions({ onSelect, isTR }: SampleQuestionsProps) {
  const questions = isTR ? QUESTIONS_TR : QUESTIONS_EN

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {questions.map((q, i) => (
        <Button
          key={i}
          variant="outline"
          className="h-auto py-3 px-4 text-left justify-start gap-3 hover:bg-teal-50 hover:border-teal-200 transition-all group"
          onClick={() => onSelect(q.text)}
        >
          <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-teal-100 transition-colors">
            <q.icon className="h-4 w-4 text-gray-500 group-hover:text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{q.category}</p>
            <p className="text-sm truncate">{q.text}</p>
          </div>
        </Button>
      ))}
    </div>
  )
}
