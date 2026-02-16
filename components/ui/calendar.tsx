'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'relative flex items-center justify-center w-full min-w-[260px] h-10 pt-1 pb-1',
        caption_label: 'absolute left-1/2 -translate-x-1/2 text-sm font-medium text-center max-w-[140px] truncate pointer-events-none z-10',
        nav: 'absolute inset-0 flex items-center justify-between px-0 pointer-events-none [&_button]:pointer-events-auto [&_button]:z-0',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-8 w-8 shrink-0 rounded-md bg-gray-100 border border-gray-300 text-gray-800 hover:bg-gray-200 hover:text-gray-900 p-0 inline-flex items-center justify-center [&_svg]:shrink-0 [&_svg]:text-gray-800'
        ),
        nav_button_previous: 'absolute left-0',
        nav_button_next: 'absolute right-0',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell:
          'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4 text-gray-800 shrink-0" aria-hidden />,
        IconRight: () => <ChevronRight className="h-4 w-4 text-gray-800 shrink-0" aria-hidden />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
