'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSiteConfig } from '@/contexts/site-config-context';
import { useLanguage } from '@/contexts/language-context';

function getContrastColor(hexcolor: string): string {
  if (!hexcolor) return '#0A192F';

  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;

  return brightness > 155 ? '#0A192F' : '#7DD3FC';
}

export function StickyBar() {
  const { config } = useSiteConfig();
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!config) return;

    const dismissed = sessionStorage.getItem('sticky-bar-dismissed');
    if (config.sticky_bar_enabled && !dismissed) {
      setIsVisible(true);
    }
  }, [config]);

  if (!isVisible || !config?.sticky_bar_enabled) return null;

  const text = language === 'tr' ? config.sticky_bar_text_tr : config.sticky_bar_text_en;
  const textColor = getContrastColor(config.sticky_bar_bg_color || '#3b82f6');

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('sticky-bar-dismissed', 'true');
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 shadow-md"
      style={{
        backgroundColor: config.sticky_bar_bg_color,
        color: textColor
      }}
    >
      <div className="flex-1 text-center text-sm font-medium">
        {text}
      </div>
      <button
        onClick={handleDismiss}
        className="ml-4 p-1 rounded-full transition-colors"
        style={{
          backgroundColor: `${textColor}10`,
          color: textColor
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${textColor}20`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = `${textColor}10`;
        }}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
