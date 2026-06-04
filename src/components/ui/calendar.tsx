'use client';

import * as React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'dropdown',
  ...props
}: CalendarProps) {
  const currentYear = new Date().getFullYear();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      startMonth={props.startMonth || new Date(currentYear - 10, 0)}
      endMonth={props.endMonth || new Date(currentYear + 10, 11)}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        month_caption: 'flex justify-start items-center h-9 relative pl-1',
        caption_label: 'text-sm font-bold text-foreground',
        nav: 'flex items-center gap-1 absolute right-1 top-1 h-9',
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-7 w-7 p-0 opacity-50 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-7 w-7 p-0 opacity-50 hover:opacity-100',
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday:
          'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal rounded-full aria-selected:opacity-100 aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground aria-selected:focus:bg-primary aria-selected:focus:text-primary-foreground',
        ),
        selected: 'bg-transparent',
        today: 'bg-accent text-accent-foreground rounded-full',
        outside:
          'day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
        disabled: 'text-muted-foreground opacity-50',
        range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        hidden: 'invisible',
        dropdowns: 'flex items-center gap-1.5',
        dropdown_root: 'relative inline-flex items-center [&_span]:hidden',
        dropdown: 'rdp-dropdown h-8 bg-transparent px-2 text-sm font-semibold focus-visible:outline-none cursor-pointer hover:bg-muted/80 rounded-lg transition-colors border-0',
        dropdown_month: 'rdp-dropdown_month',
        dropdown_year: 'rdp-dropdown_year',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...props }: any) => {
          let Component = ChevronRight;
          if (orientation === 'left') Component = ChevronLeft;
          if (orientation === 'right') Component = ChevronRight;
          if (orientation === 'down') Component = ChevronDown;
          if (orientation === 'up') Component = ChevronUp;
          return <Component className={cn('h-4 w-4', className)} {...props} />;
        },
      }}
      // No disabled days, allow all dates to be picked
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
