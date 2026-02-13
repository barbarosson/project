'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSiteConfig } from '@/contexts/site-config-context';
import { useLanguage } from '@/contexts/language-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function LeadPopup() {
  const { config } = useSiteConfig();
  const { language } = useLanguage();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!config?.popup_enabled) return;

    const dismissed = localStorage.getItem('lead-popup-dismissed');
    if (dismissed) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, (config.popup_delay_seconds || 5) * 1000);

    return () => clearTimeout(timer);
  }, [config]);

  if (!config?.popup_enabled) return null;

  const title = language === 'tr' ? config.popup_title_tr : config.popup_title_en;
  const content = language === 'tr' ? config.popup_content_tr : config.popup_content_en;
  const ctaText = language === 'tr' ? config.popup_cta_text_tr : config.popup_cta_text_en;

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('lead-popup-dismissed', 'true');
  };

  const handleCTA = () => {
    handleClose();
    router.push('/contact');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">{content}</p>
          <div className="flex gap-2">
            <Button onClick={handleCTA} className="flex-1">
              {ctaText}
            </Button>
            <Button onClick={handleClose} variant="outline">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
