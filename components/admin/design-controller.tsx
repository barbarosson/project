'use client'

import { useState, useRef, useCallback } from 'react'
import { useUIStyles } from '@/hooks/use-ui-styles'
import { useLanguage } from '@/contexts/language-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/loading-spinner'
import { toast } from 'sonner'
import { Palette, Type, Maximize, Layout, Eye, EyeOff } from 'lucide-react'

export function DesignController() {
  const { t } = useLanguage()
  const { styles, colors, toggles, loading, updateStyle, updateColor, updateToggle } = useUIStyles()
  const [savingId, setSavingId] = useState<string | null>(null)
  const updateTimers = useRef<Record<string, NodeJS.Timeout>>({})

  const handleStyleChange = useCallback((id: string, value: number) => {
    const style = styles.find(s => s.id === id)
    if (!style) return

    const varName = `--${style.element_name}-${style.property.replace(/_/g, '-')}`
    document.documentElement.style.setProperty(varName, `${value}${style.unit}`)

    if (updateTimers.current[id]) {
      clearTimeout(updateTimers.current[id])
    }

    updateTimers.current[id] = setTimeout(async () => {
      try {
        await updateStyle(id, value)
      } catch (error) {
        toast.error(t.designController.failedToUpdate)
      }
    }, 500)
  }, [styles, updateStyle, t])

  const handleColorChange = useCallback((id: string, value: string) => {
    const color = colors.find(c => c.id === id)
    if (!color) return

    const varName = `--${color.element_name}-${color.property.replace(/_/g, '-')}`
    document.documentElement.style.setProperty(varName, value)

    if (updateTimers.current[id]) {
      clearTimeout(updateTimers.current[id])
    }

    updateTimers.current[id] = setTimeout(async () => {
      try {
        await updateColor(id, value)
      } catch (error) {
        toast.error(t.designController.failedToUpdate)
      }
    }, 500)
  }, [colors, updateColor, t])

  const handleToggleChange = async (id: string, enabled: boolean) => {
    try {
      setSavingId(id)
      await updateToggle(id, enabled)
      toast.success(enabled ? t.designController.showingSection : t.designController.hidingSection)
    } catch (error) {
      toast.error(t.designController.failedToUpdate)
    } finally {
      setSavingId(null)
    }
  }

  const groupedStyles = styles.reduce((acc, style) => {
    if (!acc[style.category]) {
      acc[style.category] = []
    }
    acc[style.category].push(style)
    return acc
  }, {} as Record<string, typeof styles>)

  const groupedColors = colors.reduce((acc, color) => {
    if (!acc[color.category]) {
      acc[color.category] = []
    }
    acc[color.category].push(color)
    return acc
  }, {} as Record<string, typeof colors>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    )
  }

  const categoryIcons: Record<string, any> = {
    logo: Layout,
    typography: Type,
    spacing: Maximize,
    layout: Layout,
    brand: Palette,
    sections: Palette,
    text: Type,
    buttons: Layout,
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5 text-blue-600" />
            {t.designController.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t.designController.description}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Layout className="h-5 w-5" />
            {t.designController.stylesSpacing}
          </h3>

        {Object.entries(groupedStyles).map(([category, categoryStyles]) => {
          const Icon = categoryIcons[category] || Layout
          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="capitalize text-lg">{category}</CardTitle>
                </div>
                <CardDescription>
                  {t.designController.adjustProperties.replace('{category}', category)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {categoryStyles.map((style) => (
                  <div key={style.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={style.id} className="text-sm font-medium">
                        {style.label}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={style.value}
                          onChange={(e) => handleStyleChange(style.id, Number(e.target.value))}
                          className="w-20 h-8 text-sm"
                          min={style.min_value}
                          max={style.max_value}
                        />
                        <Badge variant="outline" className="text-xs">
                          {style.unit}
                        </Badge>
                      </div>
                    </div>
                    <Slider
                      id={style.id}
                      value={[style.value]}
                      onValueChange={([value]) => handleStyleChange(style.id, value)}
                      min={style.min_value}
                      max={style.max_value}
                      step={1}
                      className="w-full"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}

        <h3 className="text-xl font-bold flex items-center gap-2 mt-8">
          <Palette className="h-5 w-5" />
          {t.designController.colors}
        </h3>

        {Object.entries(groupedColors).map(([category, categoryColors]) => {
          const Icon = categoryIcons[category] || Palette
          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="capitalize text-lg">{category}</CardTitle>
                </div>
                <CardDescription>
                  {t.designController.adjustColors.replace('{category}', category)}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                {categoryColors.map((color) => (
                  <div key={color.id} className="space-y-2">
                    <Label htmlFor={color.id} className="text-sm font-medium">
                      {color.label}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={color.id}
                        type="color"
                        value={color.value}
                        onChange={(e) => handleColorChange(color.id, e.target.value)}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={color.value}
                        onChange={(e) => handleColorChange(color.id, e.target.value)}
                        className="flex-1 h-10 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}

        <h3 className="text-xl font-bold flex items-center gap-2 mt-8">
          <Eye className="h-5 w-5" />
          {t.designController.sectionVisibility}
        </h3>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.designController.showHideSections}</CardTitle>
            <CardDescription>
              {t.designController.toggleDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {toggles.map((toggle) => (
              <div key={toggle.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  {toggle.enabled ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                  <div>
                    <Label htmlFor={toggle.id} className="text-sm font-medium cursor-pointer">
                      {toggle.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {toggle.enabled ? t.designController.visible : t.designController.hidden}
                    </p>
                  </div>
                </div>
                <Switch
                  id={toggle.id}
                  checked={toggle.enabled}
                  onCheckedChange={(checked) => handleToggleChange(toggle.id, checked)}
                  disabled={savingId === toggle.id}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
