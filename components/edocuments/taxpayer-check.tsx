'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { checkTaxpayer } from '@/lib/nes-api'
import { toast } from 'sonner'
import { Loader2, Search, CheckCircle2, XCircle, Building2 } from 'lucide-react'

interface TaxpayerCheckProps {
  tenantId: string
  language: 'en' | 'tr'
  translations: Record<string, string>
}

interface TaxpayerResult {
  isRegistered: boolean
  title?: string
  alias?: string
  type?: string
  registerDate?: string
}

export function TaxpayerCheck({ tenantId, language, translations: t }: TaxpayerCheckProps) {
  const [vkn, setVkn] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<TaxpayerResult | null>(null)

  async function handleCheck() {
    if (!vkn.trim()) return

    setChecking(true)
    setResult(null)
    try {
      const data = await checkTaxpayer(tenantId, vkn.trim())

      const res = data?.Result
      if (res?.CustomerList && res.CustomerList.length > 0) {
        const customer = res.CustomerList[0]
        setResult({
          isRegistered: true,
          title: customer.Title,
          alias: customer.Alias,
          type: customer.Type,
          registerDate: customer.RegisterDate,
        })
      } else {
        setResult({ isRegistered: false })
      }
    } catch (error: any) {
      const msg = error.message || ''
      if (msg.includes('baglantilamadi') || msg.includes('dns error') || msg.includes('Name or service not known')) {
        toast.error(language === 'tr'
          ? 'NES API sunucusuna ulasilamiyor. API adresini kontrol edin veya daha sonra tekrar deneyin.'
          : 'Cannot reach NES API server. Check the API address or try again later.')
      } else {
        toast.error(msg)
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#0D1B2A]">
            <Building2 className="h-5 w-5 text-[#B8E6FF]" />
          </div>
          <div>
            <CardTitle className="text-lg">{t.checkTaxpayer}</CardTitle>
            <CardDescription>
              {language === 'tr'
                ? 'Bir firma/kişinin e-fatura mükellefi olup olmadığını sorgulayın'
                : 'Check if a company/person is registered as e-invoice taxpayer'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Input
            value={vkn}
            onChange={(e) => setVkn(e.target.value)}
            placeholder={language === 'tr' ? 'VKN veya TCKN girin' : 'Enter VKN or TCKN'}
            maxLength={11}
            className="max-w-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          />
          <Button onClick={handleCheck} disabled={checking || !vkn.trim()} className="bg-[#0D1B2A] hover:bg-[#132d46]">
            {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            {t.checkTaxpayer}
          </Button>
        </div>

        {result && (
          <div className="p-4 rounded-lg border">
            {result.isRegistered ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700">
                    {language === 'tr' ? 'E-Fatura Mükellefi' : 'E-Invoice Registered'}
                  </span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                    {result.type || 'Active'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {result.title && (
                    <div>
                      <p className="text-xs text-muted-foreground">{language === 'tr' ? 'Unvan' : 'Title'}</p>
                      <p className="font-medium">{result.title}</p>
                    </div>
                  )}
                  {result.alias && (
                    <div>
                      <p className="text-xs text-muted-foreground">{language === 'tr' ? 'Etiket' : 'Alias'}</p>
                      <p className="font-medium">{result.alias}</p>
                    </div>
                  )}
                  {result.registerDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">{language === 'tr' ? 'Kayıt Tarihi' : 'Register Date'}</p>
                      <p className="font-medium">{new Date(result.registerDate).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-600 font-medium">
                  {language === 'tr' ? 'E-Fatura mükellefi değil' : 'Not an e-invoice taxpayer'}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
