'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroBanner {
  image_url: string;
  title_en: string;
  subtitle_en: string;
  button_text?: string;
  button_link?: string;
}

interface HeroCarouselProps {
  banners: HeroBanner[];
  autoplayDelay?: number;
  backgroundPattern?: string;
  backgroundPatternOpacity?: number;
}

export function HeroCarousel({
  banners = [],
  autoplayDelay = 5000,
  backgroundPattern,
  backgroundPatternOpacity = 0.1,
}: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Autoplay functionality
  useEffect(() => {
    if (!emblaApi || !isPlaying || banners.length <= 1) return;

    const intervalId = setInterval(() => {
      emblaApi.scrollNext();
    }, autoplayDelay);

    return () => {
      clearInterval(intervalId);
    };
  }, [emblaApi, isPlaying, autoplayDelay, banners.length]);

  // Pause autoplay on interaction
  useEffect(() => {
    if (!emblaApi) return;

    const stopAutoplay = () => setIsPlaying(false);
    const startAutoplay = () => setIsPlaying(true);

    emblaApi.on('pointerDown', stopAutoplay);

    const timer = setTimeout(() => {
      emblaApi.off('pointerDown', stopAutoplay);
    }, 5000);

    return () => {
      clearTimeout(timer);
      emblaApi.off('pointerDown', stopAutoplay);
    };
  }, [emblaApi]);

  // Fallback if no banners
  if (!banners || banners.length === 0) {
    return (
      <section className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="container-marketing text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Welcome to Modulus ERP</h1>
          <p className="text-xl mb-8">Complete Business Management Solution</p>
          <Button size="lg" variant="secondary">
            Get Started
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden">
      {/* Background Pattern Overlay */}
      {backgroundPattern && backgroundPattern !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: `url(${backgroundPattern})`,
            opacity: backgroundPatternOpacity,
            backgroundRepeat: 'repeat',
          }}
        />
      )}

      {/* Embla Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0">
              <div
                className="relative min-h-[600px] flex items-center justify-center bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${banner.image_url})`,
                }}
              >
                <div className="container-marketing text-center text-white relative z-20 px-4">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg animate-fade-in">
                    {banner.title_en}
                  </h1>
                  <p className="text-lg md:text-xl lg:text-2xl mb-8 drop-shadow-md max-w-3xl mx-auto animate-fade-in-delay">
                    {banner.subtitle_en}
                  </p>
                  {banner.button_text && banner.button_link && (
                    <Button
                      size="lg"
                      variant="secondary"
                      className="animate-fade-in-delay-2"
                      asChild
                    >
                      <a href={banner.button_link}>{banner.button_text}</a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            onClick={scrollPrev}
            disabled={!canScrollPrev && !emblaApi?.canScrollPrev()}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            onClick={scrollNext}
            disabled={!canScrollNext && !emblaApi?.canScrollNext()}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Dots Navigation */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-3 h-3 rounded-full transition-all duration-300',
                index === selectedIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              )}
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
