'use client';

import { useEffect } from 'react';
import { useSiteConfig } from '@/contexts/site-config-context';
import { useLanguage } from '@/contexts/language-context';

export function DynamicSEOHead() {
  const { config } = useSiteConfig();
  const { language } = useLanguage();

  useEffect(() => {
    if (!config) return;

    const lang = language === 'tr' ? 'tr' : 'en';
    const metaTitle = lang === 'tr' ? config.meta_title_tr : config.meta_title_en;
    const metaDescription = lang === 'tr' ? config.meta_description_tr : config.meta_description_en;
    const keywords = lang === 'tr' ? config.keywords_tr : config.keywords_en;

    if (metaTitle) {
      document.title = metaTitle;
      updateMetaTag('property', 'og:title', metaTitle);
      updateMetaTag('name', 'twitter:title', metaTitle);
    }

    if (metaDescription) {
      updateMetaTag('name', 'description', metaDescription);
      updateMetaTag('property', 'og:description', metaDescription);
      updateMetaTag('name', 'twitter:description', metaDescription);
    }

    if (keywords) {
      updateMetaTag('name', 'keywords', keywords);
    }

    if (config.og_image_url) {
      updateMetaTag('property', 'og:image', config.og_image_url);
      updateMetaTag('name', 'twitter:image', config.og_image_url);
    }

    updateMetaTag('property', 'og:type', 'website');
    updateMetaTag('property', 'og:url', window.location.href);
    updateMetaTag('name', 'twitter:card', 'summary_large_image');

  }, [config, language]);

  return null;
}

function updateMetaTag(attrName: string, attrValue: string, content: string) {
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement;

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }

  element.content = content;
}
