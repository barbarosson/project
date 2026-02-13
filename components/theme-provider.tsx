'use client';

import { useEffect } from 'react';
import { useSiteConfig } from '@/contexts/site-config-context';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { config } = useSiteConfig();

  useEffect(() => {
    if (!config) return

    const root = document.documentElement

    if (config.primary_color) {
      root.style.setProperty('--color-primary', config.primary_color);
    }

    if (config.secondary_color) {
      root.style.setProperty('--color-secondary', config.secondary_color);
    }

    if (config.accent_color) {
      root.style.setProperty('--color-accent', config.accent_color);
    }

    if (config.success_color) {
      root.style.setProperty('--color-success', config.success_color);
    }

    if (config.warning_color) {
      root.style.setProperty('--color-warning', config.warning_color);
    }

    if (config.error_color) {
      root.style.setProperty('--color-error', config.error_color);
    }

    if (config.info_color) {
      root.style.setProperty('--color-info', config.info_color);
    }

    if (config.text_color) {
      root.style.setProperty('--color-text', config.text_color);
    }

    if (config.text_color_secondary) {
      root.style.setProperty('--color-text-secondary', config.text_color_secondary);
    }

    if (config.background_color) {
      root.style.setProperty('--color-background', config.background_color);
    }

    if (config.card_background) {
      root.style.setProperty('--color-card-background', config.card_background);
    }

    if (config.heading_font) {
      root.style.setProperty('--font-heading', config.heading_font);
    }

    if (config.body_font) {
      root.style.setProperty('--font-body', config.body_font);
    }

    if (config.font_size_base) {
      root.style.setProperty('--font-size-base', config.font_size_base);
    }

    if (config.border_radius) {
      root.style.setProperty('--border-radius', config.border_radius);
    }

    if (config.button_radius) {
      root.style.setProperty('--button-radius', config.button_radius);
    }

    if (config.custom_css) {
      let styleElement = document.getElementById('custom-site-css');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-site-css';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = config.custom_css;
    }
    window.dispatchEvent(new Event('site-config-applied'));
  }, [config]);

  return <>{children}</>;
}
