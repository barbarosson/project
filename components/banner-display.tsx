'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';

interface Banner {
  id: string;
  title_en: string;
  title_tr: string;
  description_en?: string;
  description_tr?: string;
  cta_text_en?: string;
  cta_text_tr?: string;
  cta_link?: string;
  image_url?: string;
  background_color: string;
  background_pattern?: string;
  text_color: string;
  position: string;
  page_slug: string;
  order_index: number;
  language: 'tr' | 'en' | 'all';
  layout_type?: 'compact' | 'full-width' | 'hero' | 'custom';
  height?: string;
  content_alignment?: 'left' | 'center' | 'right';
  image_position?: 'left' | 'right' | 'background' | 'none';
  overlay_opacity?: number;
  full_width_image?: boolean;
}

interface BannerDisplayProps {
  position: 'hero' | 'top' | 'middle' | 'bottom' | 'sidebar' | 'popup';
  pageSlug: string;
}

export function BannerDisplay({ position, pageSlug }: BannerDisplayProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([]);
  const { language } = useLanguage();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  useEffect(() => {
    fetchBanners();
    const dismissed = localStorage.getItem('dismissedBanners');
    if (dismissed) {
      setDismissedBanners(JSON.parse(dismissed));
    }
  }, [position, pageSlug, language]);

  useEffect(() => {
    if (!emblaApi || banners.length <= 1) return;

    const intervalId = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [emblaApi, banners]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cms_banners')
        .select('*')
        .eq('is_active', true)
        .eq('position', position)
        .in('page_slug', [pageSlug, 'all'])
        .in('language', [language, 'all'])
        .order('order_index', { ascending: true });

      if (error) throw error;

      const now = new Date();
      const activeBanners = (data || []).filter(banner => {
        if (banner.start_date && new Date(banner.start_date) > now) return false;
        if (banner.end_date && new Date(banner.end_date) < now) return false;
        return true;
      });

      setBanners(activeBanners);
    } catch (error: any) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (bannerId: string) => {
    const newDismissed = [...dismissedBanners, bannerId];
    setDismissedBanners(newDismissed);
    localStorage.setItem('dismissedBanners', JSON.stringify(newDismissed));
  };

  if (loading || banners.length === 0) {
    return null;
  }

  const visibleBanners = banners.filter(b => !dismissedBanners.includes(b.id));

  if (visibleBanners.length === 0) {
    return null;
  }

  const renderBannerContent = (banner: Banner) => {
    const title = language === 'en' ? banner.title_en : banner.title_tr;
    const description = language === 'en' ? banner.description_en : banner.description_tr;
    const ctaText = language === 'en' ? banner.cta_text_en : banner.cta_text_tr;

    const getPatternStyle = () => {
      if (!banner.background_pattern || banner.background_pattern === 'none') {
        return {};
      }

      const patternMap: Record<string, string> = {
        dots: '/patterns/micro-dots.svg',
        grid: '/patterns/circuit-grid.svg',
        waves: '/patterns/soft-waves.svg',
      };

      const patternUrl = patternMap[banner.background_pattern];
      if (patternUrl) {
        return {
          backgroundImage: `url(${patternUrl})`,
          backgroundSize: banner.background_pattern === 'dots' ? '20px 20px' : (banner.background_pattern === 'grid' ? '60px 60px' : 'cover'),
          backgroundRepeat: banner.background_pattern === 'waves' ? 'no-repeat' : 'repeat',
        };
      }
      return {};
    };

    const layoutType = banner.layout_type || 'compact';
    const imagePosition = banner.image_position || 'left';
    const contentAlignment = banner.content_alignment || 'center';
    const overlayOpacity = banner.overlay_opacity || 50;
    const fullWidthImage = banner.full_width_image || false;

    const getContainerClasses = () => {
      const baseClasses = 'relative overflow-hidden';
      const marginClass = layoutType === 'compact' ? ' mb-4' : '';

      switch (layoutType) {
        case 'hero':
          return `${baseClasses} min-h-screen flex items-center justify-center${marginClass}`;
        case 'full-width':
          return `${baseClasses} w-full min-h-[60vh] flex items-center justify-center${marginClass}`;
        case 'custom':
          return `${baseClasses} flex items-center justify-center${marginClass}`;
        case 'compact':
        default:
          return `${baseClasses} rounded-lg${marginClass}`;
      }
    };

    const getContainerStyle = () => {
      const style: React.CSSProperties = {
        backgroundColor: banner.background_color,
        color: banner.text_color,
      };

      if (layoutType === 'custom' && banner.height) {
        style.minHeight = banner.height;
      }

      if ((imagePosition === 'background' || fullWidthImage) && banner.image_url) {
        style.backgroundImage = `url(${banner.image_url})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
      }

      return style;
    };

    const getContentAlignment = () => {
      switch (contentAlignment) {
        case 'left':
          return 'text-left justify-start';
        case 'right':
          return 'text-right justify-end';
        case 'center':
        default:
          return 'text-center justify-center';
      }
    };

    return (
      <div
        className={getContainerClasses()}
        style={getContainerStyle()}
      >
            {/* Background Image Overlay */}
            {(imagePosition === 'background' || fullWidthImage) && banner.image_url && (
              <div
                className="absolute inset-0 bg-black pointer-events-none"
                style={{ opacity: overlayOpacity / 100 }}
              />
            )}

            {/* Pattern Overlay */}
            {banner.background_pattern && banner.background_pattern !== 'none' && (
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={getPatternStyle()}
              />
            )}

            {position === 'popup' && (
              <button
                onClick={() => handleDismiss(banner.id)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors z-10"
                aria-label="Close banner"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            <div
              className={`relative z-10 w-full ${
                layoutType === 'compact'
                  ? 'max-w-7xl mx-auto px-8 py-8'
                  : imagePosition === 'background' || fullWidthImage
                  ? 'px-8 py-16 md:px-16'
                  : 'max-w-7xl mx-auto px-8 py-16 md:px-16'
              }`}
            >
              <div className={`flex flex-col md:flex-row items-center gap-8 ${getContentAlignment()}`}>
                {/* Image - Left or Right Position (not rendered if background or full_width_image) */}
                {banner.image_url && imagePosition !== 'background' && imagePosition !== 'none' && !fullWidthImage && (
                  <div
                    className={`flex-shrink-0 ${
                      imagePosition === 'right' ? 'md:order-2' : ''
                    } ${
                      layoutType === 'hero' || layoutType === 'full-width'
                        ? 'w-full md:w-1/2 lg:w-2/5'
                        : 'w-full md:w-auto md:max-w-md'
                    }`}
                  >
                    <img
                      src={banner.image_url}
                      alt={title}
                      className={`w-full h-auto ${
                        layoutType === 'hero' || layoutType === 'full-width'
                          ? 'max-h-[70vh] object-cover rounded-2xl shadow-2xl'
                          : 'max-h-96 object-contain rounded-lg'
                      }`}
                    />
                  </div>
                )}

                {/* Content */}
                <div className={`flex-1 ${
                  layoutType === 'hero' || layoutType === 'full-width'
                    ? 'space-y-6'
                    : 'space-y-4'
                } ${
                  imagePosition === 'background' || fullWidthImage
                    ? `${getContentAlignment()} w-full`
                    : contentAlignment === 'center' ? 'text-center md:text-left' : getContentAlignment()
                }`}>
                  <h2 className={`font-bold ${
                    layoutType === 'hero'
                      ? 'text-4xl md:text-6xl lg:text-7xl'
                      : layoutType === 'full-width'
                      ? 'text-3xl md:text-5xl lg:text-6xl'
                      : 'text-2xl md:text-3xl'
                  }`}>
                    {title}
                  </h2>

                  {description && (
                    <p className={`opacity-90 ${
                      layoutType === 'hero' || layoutType === 'full-width'
                        ? 'text-xl md:text-2xl max-w-3xl'
                        : 'text-lg'
                    } ${
                      imagePosition === 'background' && contentAlignment === 'center' ? 'mx-auto' : ''
                    }`}>
                      {description}
                    </p>
                  )}

                  {ctaText && banner.cta_link && (
                    <div className={imagePosition === 'background' && contentAlignment === 'center' ? 'flex justify-center' : ''}>
                      <Link href={banner.cta_link}>
                        <Button
                          size={layoutType === 'hero' || layoutType === 'full-width' ? 'lg' : 'default'}
                          className={`mt-2 ${
                            layoutType === 'hero' || layoutType === 'full-width'
                              ? 'text-lg px-8 py-6 h-auto'
                              : ''
                          }`}
                          style={{
                            backgroundColor: banner.text_color,
                            color: banner.background_color,
                          }}
                        >
                          {ctaText}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
      </div>
    );
  };

  if (visibleBanners.length === 1) {
    return (
      <div className={`banner-container banner-position-${position}`}>
        {renderBannerContent(visibleBanners[0])}
      </div>
    );
  }

  return (
    <div className={`banner-container banner-position-${position}`}>
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {visibleBanners.map((banner) => (
            <div key={banner.id} className="embla__slide flex-[0_0_100%] min-w-0">
              {renderBannerContent(banner)}
            </div>
          ))}
        </div>
      </div>

      {visibleBanners.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {visibleBanners.map((_, index) => (
            <button
              key={index}
              className="w-2 h-2 rounded-full bg-gray-300 hover:bg-gray-500 transition-colors"
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
