'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/language-context'

interface TurkishBankSelectProps {
  value: string
  onValueChange: (value: string) => void
  allowCustom?: boolean
  placeholder?: string
}

const depositBanks = [
  'AKBANK T.A.Ş.',
  'ALTERNATİFBANK A.Ş.',
  'ANADOLUBANK A.Ş.',
  'ARAP TÜRK BANKASI A.Ş.',
  'BANK MELLAT',
  'BANK OF CHINA TURKEY A.Ş.',
  'BURGAN BANK A.Ş.',
  'CITIBANK A.Ş.',
  'COLENDİ BANK A.Ş.',
  'DENİZBANK A.Ş.',
  'DEUTSCHE BANK A.Ş.',
  'ENPARA BANK A.Ş.',
  'FİBABANKA A.Ş.',
  'FUPS BANK A.Ş.',
  'HABIB BANK LIMITED',
  'HSBC BANK A.Ş.',
  'ICBC TURKEY BANK A.Ş.',
  'ING BANK A.Ş.',
  'INTESA SANPAOLO S.P.A.',
  'JP MORGAN CHASE BANK',
  'MUFG BANK TURKEY A.Ş.',
  'ODEA BANK A.Ş.',
  'QNB BANK A.Ş.',
  'RABOBANK A.Ş.',
  'SOCIETE GENERALE S.A.',
  'ŞEKERBANK T.A.Ş.',
  'T.C. ZİRAAT BANKASI A.Ş.',
  'TURKISH BANK A.Ş.',
  'TURKLAND BANK A.Ş.',
  'TÜRK EKONOMİ BANKASI A.Ş.',
  'TÜRK TİCARET BANKASI A.Ş.',
  'TÜRKİYE GARANTİ BANKASI A.Ş.',
  'TÜRKİYE HALK BANKASI A.Ş.',
  'TÜRKİYE İŞ BANKASI A.Ş.',
  'TÜRKİYE VAKIFLAR BANKASI T.A.O.',
  'YAPI VE KREDİ BANKASI A.Ş.',
  'ZİRAAT DİNAMİK BANKA A.Ş.'
]

const developmentBanks = [
  'AKTİF YATIRIM BANKASI A.Ş.',
  'AYTEMİZ YATIRIM BANKASI A.Ş.',
  'BANK OF AMERICA YATIRIM BANK A.Ş.',
  'BANKPOZİTİF KREDİ VE KALKINMA BANKASI A.Ş.',
  'D YATIRIM BANKASI A.Ş.',
  'DESTEK YATIRIM BANKASI A.Ş.',
  'DİLER YATIRIM BANKASI A.Ş.',
  'GOLDEN GLOBAL YATIRIM BANKASI A.Ş.',
  'GSD YATIRIM BANKASI A.Ş.',
  'HEDEF YATIRIM BANKASI A.Ş.',
  'İLLER BANKASI A.Ş.',
  'İSTANBUL TAKAS VE SAKLAMA BANKASI A.Ş.',
  'MİSYON YATIRIM BANKASI A.Ş.',
  'NUROL YATIRIM BANKASI A.Ş.',
  'PASHA YATIRIM BANKASI A.Ş.',
  'Q YATIRIM BANKASI A.Ş.',
  'STANDARD CHARTERED YATIRIM BANKASI TÜRK A.Ş.',
  'TERA YATIRIM BANKASI A.Ş.',
  'TÜRKİYE İHRACAT KREDİ BANKASI A.Ş.',
  'TÜRKİYE KALKINMA VE YATIRIM BANKASI A.Ş.',
  'TÜRKİYE SINAİ KALKINMA BANKASI A.Ş.'
]

const participationBanks = [
  'ALBARAKA TÜRK KATILIM BANKASI A.Ş.',
  'DÜNYA KATILIM BANKASI A.Ş.',
  'HAYAT FİNANS KATILIM BANKASI A.Ş.',
  'KUVEYT TÜRK KATILIM BANKASI A.Ş.',
  'T.O.M. KATILIM BANKASI A.Ş.',
  'TÜRKİYE EMLAK KATILIM BANKASI A.Ş.',
  'TÜRKİYE FİNANS KATILIM BANKASI A.Ş.',
  'VAKIF KATILIM BANKASI A.Ş.',
  'ZİRAAT KATILIM BANKASI A.Ş.'
]

export function TurkishBankSelect({
  value,
  onValueChange,
  allowCustom = true,
  placeholder
}: TurkishBankSelectProps) {
  const { language } = useLanguage()
  const [isCustom, setIsCustom] = useState(false)

  const allBanks = [...depositBanks, ...developmentBanks, ...participationBanks]
  const isInList = allBanks.includes(value)

  if (isCustom && allowCustom) {
    return (
      <div className="space-y-2">
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={language === 'tr' ? 'Banka adı girin' : 'Enter bank name'}
        />
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => {
            setIsCustom(false)
            onValueChange('')
          }}
        >
          {language === 'tr' ? 'Listeden seç' : 'Select from list'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || (language === 'tr' ? 'Banka seçin' : 'Select a bank')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{language === 'tr' ? 'Mevduat Bankaları' : 'Deposit Banks'}</SelectLabel>
            {depositBanks.map((bank) => (
              <SelectItem key={bank} value={bank}>
                {bank}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>{language === 'tr' ? 'Kalkınma ve Yatırım Bankaları' : 'Development & Investment Banks'}</SelectLabel>
            {developmentBanks.map((bank) => (
              <SelectItem key={bank} value={bank}>
                {bank}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>{language === 'tr' ? 'Katılım Bankaları' : 'Participation Banks'}</SelectLabel>
            {participationBanks.map((bank) => (
              <SelectItem key={bank} value={bank}>
                {bank}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {allowCustom && !isInList && value && (
        <div className="text-sm text-gray-500">
          {language === 'tr' ? 'Özel banka adı kullanılıyor' : 'Using custom bank name'}
        </div>
      )}
      {allowCustom && (
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => setIsCustom(true)}
        >
          {language === 'tr' ? 'Özel banka adı gir' : 'Enter custom bank name'}
        </button>
      )}
    </div>
  )
}
