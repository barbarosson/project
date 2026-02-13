/**
 * Turkish Industries/Sectors (Sektörler)
 */

export const TURKISH_INDUSTRIES = [
  { value: 'tarim', label: 'Tarım ve Hayvancılık', labelEn: 'Agriculture and Livestock' },
  { value: 'gida', label: 'Gıda ve İçecek', labelEn: 'Food and Beverage' },
  { value: 'tekstil', label: 'Tekstil ve Hazır Giyim', labelEn: 'Textile and Apparel' },
  { value: 'insaat', label: 'İnşaat', labelEn: 'Construction' },
  { value: 'enerji', label: 'Enerji ve Madencilik', labelEn: 'Energy and Mining' },
  { value: 'kimya', label: 'Kimya ve Petrokimya', labelEn: 'Chemistry and Petrochemicals' },
  { value: 'otomotiv', label: 'Otomotiv', labelEn: 'Automotive' },
  { value: 'makine', label: 'Makine ve Teçhizat', labelEn: 'Machinery and Equipment' },
  { value: 'elektronik', label: 'Elektronik ve Elektrik', labelEn: 'Electronics and Electrical' },
  { value: 'bilisim', label: 'Bilişim ve Teknoloji', labelEn: 'IT and Technology' },
  { value: 'telekomünikasyon', label: 'Telekomünikasyon', labelEn: 'Telecommunications' },
  { value: 'finans', label: 'Finans ve Bankacılık', labelEn: 'Finance and Banking' },
  { value: 'sigorta', label: 'Sigorta', labelEn: 'Insurance' },
  { value: 'gayrimenkul', label: 'Gayrimenkul', labelEn: 'Real Estate' },
  { value: 'perakende', label: 'Perakende ve Toptan Ticaret', labelEn: 'Retail and Wholesale' },
  { value: 'lojistik', label: 'Lojistik ve Ulaştırma', labelEn: 'Logistics and Transportation' },
  { value: 'turizm', label: 'Turizm ve Otelcilik', labelEn: 'Tourism and Hospitality' },
  { value: 'saglik', label: 'Sağlık ve İlaç', labelEn: 'Healthcare and Pharmaceuticals' },
  { value: 'egitim', label: 'Eğitim', labelEn: 'Education' },
  { value: 'medya', label: 'Medya ve Yayıncılık', labelEn: 'Media and Publishing' },
  { value: 'reklam', label: 'Reklam ve Pazarlama', labelEn: 'Advertising and Marketing' },
  { value: 'hukuk', label: 'Hukuk ve Danışmanlık', labelEn: 'Legal and Consulting' },
  { value: 'muhendislik', label: 'Mühendislik ve Mimarlık', labelEn: 'Engineering and Architecture' },
  { value: 'mobilya', label: 'Mobilya ve Dekorasyon', labelEn: 'Furniture and Decoration' },
  { value: 'kuyumculuk', label: 'Kuyumculuk ve Değerli Madenler', labelEn: 'Jewelry and Precious Metals' },
  { value: 'cam-seramik', label: 'Cam ve Seramik', labelEn: 'Glass and Ceramics' },
  { value: 'kagit', label: 'Kağıt ve Orman Ürünleri', labelEn: 'Paper and Forest Products' },
  { value: 'plastik-kaucuk', label: 'Plastik ve Kauçuk', labelEn: 'Plastics and Rubber' },
  { value: 'metal', label: 'Metal İşleme', labelEn: 'Metal Processing' },
  { value: 'savunma', label: 'Savunma Sanayi', labelEn: 'Defense Industry' },
  { value: 'havacılık', label: 'Havacılık ve Uzay', labelEn: 'Aviation and Aerospace' },
  { value: 'denizcilik', label: 'Denizcilik ve Gemi İnşa', labelEn: 'Maritime and Shipbuilding' },
  { value: 'cevre', label: 'Çevre ve Geri Dönüşüm', labelEn: 'Environment and Recycling' },
  { value: 'tanitim', label: 'Tanıtım ve Etkinlik', labelEn: 'Promotion and Events' },
  { value: 'spor', label: 'Spor ve Rekreasyon', labelEn: 'Sports and Recreation' },
  { value: 'kultur-sanat', label: 'Kültür ve Sanat', labelEn: 'Culture and Arts' },
  { value: 'guvenlık', label: 'Güvenlik Hizmetleri', labelEn: 'Security Services' },
  { value: 'temizlik', label: 'Temizlik Hizmetleri', labelEn: 'Cleaning Services' },
  { value: 'diger', label: 'Diğer', labelEn: 'Other' }
]

export function getIndustryLabel(value: string, language: 'tr' | 'en' = 'tr'): string {
  const industry = TURKISH_INDUSTRIES.find(ind => ind.value === value)
  if (!industry) return value
  return language === 'tr' ? industry.label : industry.labelEn
}

export function getIndustryOptions(language: 'tr' | 'en' = 'tr'): Array<{ value: string; label: string }> {
  return TURKISH_INDUSTRIES.map(ind => ({
    value: ind.value,
    label: language === 'tr' ? ind.label : ind.labelEn
  }))
}
