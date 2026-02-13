'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function UIStyleInjector() {
  useEffect(() => {
    const applyStyles = async () => {
      try {
        const stylesRes = await supabase.from('ui_styles').select('*')

        const root = document.documentElement

        if (stylesRes.data) {
          stylesRes.data.forEach((style: any) => {
            if (!style.property || !style.element_name) return
            const varName = `--${style.element_name}-${style.property.replace(/_/g, '-')}`
            const value = `${style.value}${style.unit || ''}`
            root.style.setProperty(varName, value)
          })

          // Apply typography styles
          const typographyStyles = stylesRes.data.filter((s: any) => s.category === 'typography')
          applyTypographyStyles(typographyStyles)

          // Apply button layout styles
          const buttonStyles = stylesRes.data.filter((s: any) =>
            s.element_name === 'button' && (s.category === 'buttons' || s.category === 'layout')
          )
          applyButtonStyles(buttonStyles)
        }

        requestAnimationFrame(() => {
          document.body.style.display = 'block'
        })
      } catch (error) {
        console.error('❌ Error applying styles:', error)
      }
    }

    const applyButtonStyles = (styles: any[]) => {
      if (!styles.length) return

      // Create or update style element
      let styleElement = document.getElementById('button-styles')
      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = 'button-styles'
        document.head.appendChild(styleElement)
      }

      // Collect button properties
      const buttonProps: any = {}
      styles.forEach((style: any) => {
        const prop = style.property.replace(/_/g, '-')
        buttonProps[prop] = `${style.value}${style.unit || ''}`
      })

      // Generate CSS rules with high specificity
      const properties: string[] = []

      // Handle both padding-x and padding_x formats
      const paddingX = buttonProps['padding-x'] || buttonProps['padding_x']
      const paddingY = buttonProps['padding-y'] || buttonProps['padding_y']
      const borderRadius = buttonProps['border-radius'] || buttonProps['border_radius']

      if (paddingX) {
        properties.push(`padding-left: ${paddingX} !important;`)
        properties.push(`padding-right: ${paddingX} !important;`)
      }
      if (paddingY) {
        properties.push(`padding-top: ${paddingY} !important;`)
        properties.push(`padding-bottom: ${paddingY} !important;`)
      }
      if (borderRadius) {
        properties.push(`border-radius: ${borderRadius} !important;`)
      }

      const cssRule = `
        button,
        .btn,
        [role="button"],
        a > button,
        button.inline-flex,
        Link > button {
          ${properties.join('\n          ')}
        }
      `

      styleElement.textContent = cssRule
    }

    const applyTypographyStyles = (styles: any[]) => {
      if (!styles.length) return

      // Create or update style element
      let styleElement = document.getElementById('typography-styles')
      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = 'typography-styles'
        document.head.appendChild(styleElement)
      }

      // Generate CSS rules
      const cssRules = styles.map((style: any) => {
        const {
          element_name,
          font_family,
          font_size_text,
          font_weight,
          font_color,
          line_height_value,
          letter_spacing_value,
          text_transform,
          text_decoration
        } = style

        let selector = element_name

        // Map element names to CSS selectors
        if (element_name === 'body') {
          selector = 'body, .body-text'
        } else if (element_name.startsWith('h')) {
          selector = `${element_name}, .${element_name}`
        } else if (element_name === 'button') {
          selector = 'button, .btn, [role="button"], a > button, button.inline-flex'
        } else if (element_name === 'input') {
          selector = 'input, textarea, select, .input'
        } else if (element_name === 'label') {
          selector = 'label, .label'
        } else if (element_name === 'caption') {
          selector = 'caption, .caption'
        } else if (element_name === 'small') {
          selector = 'small, .small, .text-sm'
        } else if (element_name === 'code') {
          selector = 'code, pre, .code'
        } else if (element_name === 'link') {
          selector = 'a, .link'
        }

        const properties: string[] = []
        if (font_family) properties.push(`font-family: ${font_family} !important;`)
        if (font_size_text) properties.push(`font-size: ${font_size_text} !important;`)
        if (font_weight) properties.push(`font-weight: ${font_weight} !important;`)
        if (font_color) properties.push(`color: ${font_color};`)
        if (line_height_value) properties.push(`line-height: ${line_height_value} !important;`)
        if (letter_spacing_value) properties.push(`letter-spacing: ${letter_spacing_value} !important;`)
        if (text_transform) properties.push(`text-transform: ${text_transform};`)
        if (text_decoration) properties.push(`text-decoration: ${text_decoration};`)

        return `${selector} { ${properties.join(' ')} }`
      }).join('\n')

      styleElement.textContent = cssRules
    }

    applyStyles()

    // Listen for custom typography update events
    const handleTypographyUpdate = () => {
      applyStyles()
    }
    window.addEventListener('typography-updated', handleTypographyUpdate)

    const stylesChannel = supabase
      .channel('ui_styles_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ui_styles' }, (payload) => {
        const style = payload.new as any
        if (!style.property || !style.element_name) return
        const varName = `--${style.element_name}-${style.property.replace(/_/g, '-')}`
        const value = `${style.value}${style.unit || ''}`
        document.documentElement.style.setProperty(varName, value)

        // Reapply button styles if button property changed
        if (style.element_name === 'button' && (style.category === 'buttons' || style.category === 'layout')) {
          applyStyles()
        }
      })
      .subscribe()

    return () => {
      stylesChannel.unsubscribe()
      window.removeEventListener('typography-updated', handleTypographyUpdate)
    }
  }, [])

  return null
}
