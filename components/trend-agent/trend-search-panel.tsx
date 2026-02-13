'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Globe, MapPin, Tag, Calendar, Search, Loader2, ChevronRight
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface Region {
  id: number
  name: string
  code: string
  level: string
  parent_code: string | null
  currency: string
}

interface Category {
  id: number
  name: string
  slug: string
  parent_id: number | null
  icon: string
  sort_order: number
}

interface TrendSearchPanelProps {
  regions: Region[]
  categories: Category[]
  onSearch: (params: {
    regionCode: string
    categorySlug: string
    subcategorySlug: string | null
    forecastDays: number
  }) => void
  isSearching: boolean
}

export function TrendSearchPanel({ regions, categories, onSearch, isSearching }: TrendSearchPanelProps) {
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const [regionCode, setRegionCode] = useState('GLOBAL')
  const [categorySlug, setCategorySlug] = useState('')
  const [subcategorySlug, setSubcategorySlug] = useState('')
  const [forecastDays, setForecastDays] = useState([30])

  const continents = regions.filter(r => r.level === 'continent' || r.level === 'global')
  const countries = regions.filter(r => r.level === 'country')
  const cities = regions.filter(r => r.level === 'city')

  const selectedRegion = regions.find(r => r.code === regionCode)
  const regionLevel = selectedRegion?.level || 'global'

  const filteredCountries = regionLevel === 'continent'
    ? countries.filter(c => c.parent_code === regionCode)
    : countries

  const filteredCities = countries.some(c => c.code === regionCode)
    ? cities.filter(c => c.parent_code === regionCode)
    : cities

  const mainCategories = categories.filter(c => c.parent_id === null)
  const selectedCategory = categories.find(c => c.slug === categorySlug)
  const subcategories = selectedCategory
    ? categories.filter(c => c.parent_id === selectedCategory.id)
    : []

  useEffect(() => {
    setSubcategorySlug('')
  }, [categorySlug])

  const handleSearch = () => {
    if (!categorySlug) return
    onSearch({
      regionCode,
      categorySlug,
      subcategorySlug: subcategorySlug || null,
      forecastDays: forecastDays[0],
    })
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-[#0A192F]">
          {isTR ? 'Trend Analizi' : 'Trend Analysis'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-teal-600" />
              {isTR ? 'Bolge / Ulke' : 'Region / Country'}
            </Label>
            <Select value={regionCode} onValueChange={setRegionCode}>
              <SelectTrigger>
                <SelectValue placeholder={isTR ? 'Bolge secin...' : 'Select region...'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">
                  <span className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" /> Global
                  </span>
                </SelectItem>
                {continents.filter(c => c.code !== 'GLOBAL').map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-medium">{c.name}</span>
                  </SelectItem>
                ))}
                {countries.length > 0 && (
                  <>
                    {countries.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </>
                )}
                {cities.length > 0 && (
                  <>
                    {cities.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            {selectedRegion && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{selectedRegion.level}</Badge>
                <span>{selectedRegion.currency}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-teal-600" />
              {isTR ? 'Kategori' : 'Category'}
            </Label>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger>
                <SelectValue placeholder={isTR ? 'Kategori secin...' : 'Select category...'} />
              </SelectTrigger>
              <SelectContent>
                {mainCategories.map(c => (
                  <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {subcategories.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-teal-600" />
              {isTR ? 'Alt Kategori' : 'Subcategory'}
            </Label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={!subcategorySlug ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${!subcategorySlug ? 'bg-teal-600 hover:bg-teal-700' : 'hover:bg-muted'}`}
                onClick={() => setSubcategorySlug('')}
              >
                {isTR ? 'Tumu' : 'All'}
              </Badge>
              {subcategories.map(sc => (
                <Badge
                  key={sc.slug}
                  variant={subcategorySlug === sc.slug ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${subcategorySlug === sc.slug ? 'bg-teal-600 hover:bg-teal-700' : 'hover:bg-muted'}`}
                  onClick={() => setSubcategorySlug(sc.slug)}
                >
                  {sc.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-teal-600" />
            {isTR ? 'Tahmin Suresi' : 'Forecast Period'}
            <span className="text-teal-600 font-semibold ml-1">{forecastDays[0]} {isTR ? 'gun' : 'days'}</span>
          </Label>
          <Slider
            value={forecastDays}
            onValueChange={setForecastDays}
            min={7}
            max={90}
            step={7}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>7 {isTR ? 'gun' : 'days'}</span>
            <span>30 {isTR ? 'gun' : 'days'}</span>
            <span>60 {isTR ? 'gun' : 'days'}</span>
            <span>90 {isTR ? 'gun' : 'days'}</span>
          </div>
        </div>

        <Button
          onClick={handleSearch}
          disabled={!categorySlug || isSearching}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          size="lg"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isTR ? 'Analiz ediliyor...' : 'Analyzing...'}
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              {isTR ? 'Trendleri Analiz Et' : 'Analyze Trends'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
