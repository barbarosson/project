'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

type ModulusUcNoktaProps = React.ComponentProps<typeof Button>;

export const ModulusUcNoktaButton = React.forwardRef<HTMLButtonElement, ModulusUcNoktaProps>(
  ({ className, children, ...rest }, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={`h-9 w-9 rounded-full bg-white/95 text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 ${className ?? ''}`}
        aria-label={rest['aria-label'] ?? 'Islemler'}
        title={rest.title ?? 'Islemler'}
        {...rest}
      >
        {children ?? <span className="text-xl leading-none">⋮</span>}
      </Button>
    );
  }
);

ModulusUcNoktaButton.displayName = 'ModulusUcNoktaButton';

// Eski isimle de kullanmak istersek diye alias
export const CardMenuButton = ModulusUcNoktaButton;

