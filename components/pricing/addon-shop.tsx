'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/hooks/use-currency'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import * as LucideIcons from 'lucide-react'

interface Addon {
  id: string
  name_en: string
  name_tr: string
  description_en: string
  description_tr: string
  price_tl: number
  price_usd: number
  category: string
  icon: string
}

interface AddonShopProps {
  selectedAddons: string[]
  onAddonsChange: (addons: string[]) => void
}

export function AddonShop({ selectedAddons, onAddonsChange }: AddonShopProps) {
  const { language } = useLanguage()
  const { currency, formatCurrency } = useCurrency()
  const [addons, setAddons] = useState<Addon[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchAddons()
  }, [])

  async function fetchAddons() {
    try {
      const { data, error } = await supabase
        .from('pricing_addons')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (data) {
        setAddons(data as Addon[])
      }
    } catch (error) {
      console.error('Error fetching addons:', error)
    } finally {
      setLoading(false)
    }
  }

  function toggleAddon(addonId: string) {
    if (selectedAddons.includes(addonId)) {
      onAddonsChange(selectedAddons.filter(id => id !== addonId))
    } else {
      onAddonsChange([...selectedAddons, addonId])
    }
  }

  function calculateTotal() {
    return selectedAddons.reduce((total, addonId) => {
      const addon = addons.find(a => a.id === addonId)
      if (addon) {
        return total + (currency === 'TRY' ? addon.price_tl : addon.price_usd)
      }
      return total
    }, 0)
  }

  function getIcon(iconName: string) {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Package
    return <Icon className="h-6 w-6" />
  }

  const categories = ['all', 'integration', 'module', 'feature', 'support']
  const categoryLabels: Record<string, { en: string; tr: string }> = {
    all: { en: 'All Add-ons', tr: 'Tüm Eklentiler' },
    integration: { en: 'Integrations', tr: 'Entegrasyonlar' },
    module: { en: 'Modules', tr: 'Modüller' },
    feature: { en: 'Features', tr: 'Özellikler' },
    support: { en: 'Support', tr: 'Destek' }
  }

  const filteredAddons = filter === 'all'
    ? addons
    : addons.filter(addon => addon.category === filter)

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Category Filter */}
      <div className="mb-8 overflow-x-auto">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="inline-flex">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {categoryLabels[cat][language]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Add-ons Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredAddons.map((addon) => {
          const isSelected = selectedAddons.includes(addon.id)
          const price = currency === 'TRY' ? addon.price_tl : addon.price_usd

          return (
            <Card
              key={addon.id}
              className={`p-6 cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'border-2 border-blue-600 bg-blue-50 shadow-lg'
                  : 'border hover:border-blue-200 hover:shadow-md'
              }`}
              onClick={() => toggleAddon(addon.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleAddon(addon.id)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getIcon(addon.icon)}
                    </div>
                    <Badge variant={isSelected ? 'default' : 'secondary'}>
                      {formatCurrency(price)}/
                      {language === 'en' ? 'mo' : 'ay'}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-base mb-2">
                    {language === 'en' ? addon.name_en : addon.name_tr}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? addon.description_en : addon.description_tr}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Selected Summary */}
      {selectedAddons.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1">
                {language === 'en'
                  ? `${selectedAddons.length} Add-on${selectedAddons.length > 1 ? 's' : ''} Selected`
                  : `${selectedAddons.length} Eklenti Seçildi`
                }
              </h3>
              <p className="text-blue-100 text-sm">
                {language === 'en'
                  ? 'These will be added to your chosen plan'
                  : 'Bunlar seçtiğiniz plana eklenecek'
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100 mb-1">
                {language === 'en' ? 'Total Add-ons Cost' : 'Toplam Eklenti Maliyeti'}
              </p>
              <p className="text-3xl font-bold">
                {formatCurrency(calculateTotal())}
                <span className="text-lg font-normal text-blue-100">
                  /{language === 'en' ? 'month' : 'ay'}
                </span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {selectedAddons.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <p className="text-muted-foreground">
            {language === 'en'
              ? 'Select add-ons to see your customized pricing'
              : 'Özelleştirilmiş fiyatlandırmanızı görmek için eklentileri seçin'
            }
          </p>
        </Card>
      )}
    </div>
  )
}
