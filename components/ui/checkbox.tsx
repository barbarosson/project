'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const CHECKBOX_SM_SIZE = 10;

type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  size?: 'default' | 'sm';
  /** Nokta (yuvarlak) stil: daire cerceve + icinde nokta */
  variant?: 'default' | 'round';
};

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, size = 'default', variant = 'default', style, ...props }, ref) => {
  const isSmall = size === 'sm' || (typeof className === 'string' && (className.includes('h-2.5') || /\bh-2\b/.test(className)));
  const sizeStyle = size === 'sm' ? { width: CHECKBOX_SM_SIZE, height: CHECKBOX_SM_SIZE, minWidth: CHECKBOX_SM_SIZE, minHeight: CHECKBOX_SM_SIZE } : undefined;
  const isRound = variant === 'round';
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      data-size={size === 'sm' ? 'sm' : undefined}
      data-variant={isRound ? 'round' : undefined}
      style={{ ...sizeStyle, ...style }}
      className={cn(
        'peer flex shrink-0 border border-primary ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 p-0 box-border appearance-none inline-flex items-center justify-center leading-none',
        !isRound && 'rounded-[2px] data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground',
        isRound &&
          'rounded-full h-4 w-4 min-w-4 min-h-4 group border-2 border-muted-foreground/50 data-[state=checked]:border-primary data-[state=indeterminate]:border-primary',
        size === 'default' && !isRound && 'h-3 w-3 min-w-0 min-h-0',
        size === 'sm' && !isRound && 'rounded-[2px]',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn('flex items-center justify-center', !isRound && 'text-current')}
      >
        {isRound ? (
          <>
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 hidden group-data-[state=checked]:block" />
            <span className="h-0.5 w-2.5 rounded-sm bg-primary shrink-0 hidden group-data-[state=indeterminate]:block" />
          </>
        ) : (
          <Check className={isSmall ? 'h-1.5 w-1.5 stroke-[2px]' : 'h-2 w-2 stroke-[2.5px]'} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
