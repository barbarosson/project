'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, Sparkles, AlertCircle, Loader2 } from 'lucide-react'
import { analyzeScenario, type ScenarioAnalysis } from '@/lib/finance-robot'

interface ScenarioAnalysisPanelProps {
  context?: {
    revenue?: number
    expenses?: number
    cashOnHand?: number
    customers?: number
  }
  language?: 'en' | 'tr'
}

export function ScenarioAnalysisPanel({ context, language = 'en' }: ScenarioAnalysisPanelProps) {
  const [scenario, setScenario] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<ScenarioAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tr = language === 'tr'

  const handleAnalyze = async () => {
    if (!scenario.trim()) return

    setAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const analysis = await analyzeScenario(scenario, context)

      if (analysis) {
        setResult(analysis)
      } else {
        setError(tr
          ? 'Analiz yapılamadı. Lütfen tekrar deneyin.'
          : 'Analysis failed. Please try again.'
        )
      }
    } catch (err) {
      setError(tr
        ? 'Bir hata oluştu. Lütfen tekrar deneyin.'
        : 'An error occurred. Please try again.'
      )
    } finally {
      setAnalyzing(false)
    }
  }

  const exampleScenarios = tr ? [
    'Büyük bir müşterinin 3 ay sonra ödeme yapması durumunda nakit pozisyonumuz nasıl olur?',
    'Yeni bir yatırımın finansmanını nasıl sağlayabilirim?',
    'Gelecek çeyrekte nakit akışımı nasıl iyileştirebilirim?',
  ] : [
    'What happens to our cash position if a major customer pays in 3 months?',
    'How can I finance a new investment?',
    'How can I improve my cash flow next quarter?',
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-purple-600" />
          <CardTitle className="text-base">
            {tr ? 'AI Senaryo Analizi' : 'AI Scenario Analysis'}
          </CardTitle>
          <Sparkles size={16} className="text-purple-400" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {tr ? 'Finansal senaryonuzu yazın:' : 'Describe your financial scenario:'}
          </label>
          <Textarea
            placeholder={tr
              ? 'Örnek: "Gelecek ay büyük bir ödeme yapacağım ve nakit sıkıntısı yaşayabilirim. Ne yapmalıyım?"'
              : 'Example: "I have a large payment next month and might face cash shortage. What should I do?"'
            }
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">{tr ? 'Örnek senaryolar:' : 'Example scenarios:'}</span>
          {exampleScenarios.map((ex, i) => (
            <button
              key={i}
              onClick={() => setScenario(ex)}
              className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
            >
              {ex.substring(0, 40)}...
            </button>
          ))}
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={!scenario.trim() || analyzing}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tr ? 'Analiz ediliyor...' : 'Analyzing...'}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {tr ? 'AI ile Analiz Et' : 'Analyze with AI'}
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Brain size={16} className="text-purple-600" />
              {tr ? 'AI Analiz Sonucu:' : 'AI Analysis Result:'}
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {result.analysis}
              </div>
            </div>
            <div className="text-xs text-gray-400 text-right">
              {tr ? 'Oluşturulma: ' : 'Generated: '}
              {new Date(result.timestamp).toLocaleString(tr ? 'tr-TR' : 'en-US')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
