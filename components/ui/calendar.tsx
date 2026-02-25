'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const CELL = 26;
const CAPTION_HEIGHT = 28;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className={cn('rdp-compact', className)}>
      <style>{`
        .rdp-compact .rdp {
          --rdp-cell-size: ${CELL}px;
        }
        .rdp-compact .rdp-months {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rdp-compact .rdp-month {
          width: ${CELL * 7}px;
        }
        .rdp-compact .rdp-caption {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: ${CAPTION_HEIGHT}px;
          padding: 0 4px;
          margin-bottom: 4px;
        }
        .rdp-compact .rdp-caption_label {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.2;
        }
        .rdp-compact .rdp-nav {
          display: flex;
          gap: 2px;
          flex-shrink: 0;
          width: auto;
        }
        .rdp-compact .rdp-nav_button,
        .rdp-compact button.rdp-nav_button {
          width: 20px !important;
          height: 20px !important;
          min-width: 20px !important;
          min-height: 20px !important;
          max-width: 20px !important;
          max-height: 20px !important;
          padding: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #374151;
          cursor: pointer;
          font-size: 12px;
          line-height: 1;
        }
        .rdp-compact .rdp-nav_button:hover {
          background: #f3f4f6;
        }
        .rdp-compact .rdp-nav_button svg {
          width: 10px !important;
          height: 10px !important;
        }
        .rdp-compact button.rdp-button.rdp-nav_button {
          width: 20px !important;
          height: 20px !important;
          min-width: 20px !important;
          min-height: 20px !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          font-size: 12px !important;
        }
        .rdp-compact .rdp-table {
          width: ${CELL * 7}px;
          max-width: ${CELL * 7}px;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .rdp-compact .rdp-tbody tr {
          display: table-row !important;
        }
        .rdp-compact .rdp-tbody td {
          display: table-cell !important;
        }
        .rdp-compact .rdp-head_cell {
          width: ${CELL}px !important;
          max-width: ${CELL}px !important;
          font-size: 10px;
          color: #6b7280;
          font-weight: 500;
          padding: 2px 0;
          text-align: center;
          box-sizing: border-box !important;
        }
        .rdp-compact .rdp-cell {
          width: ${CELL}px !important;
          max-width: ${CELL}px !important;
          height: ${CELL}px !important;
          min-width: ${CELL}px !important;
          padding: 0 !important;
          text-align: center;
          vertical-align: middle;
          box-sizing: border-box !important;
        }
        .rdp-compact .rdp-day,
        .rdp-compact button.rdp-day {
          width: ${CELL}px !important;
          height: ${CELL}px !important;
          min-width: ${CELL}px !important;
          min-height: ${CELL}px !important;
          max-width: ${CELL}px !important;
          max-height: ${CELL}px !important;
          padding: 0 !important;
          font-size: 11px !important;
          border-radius: 4px;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer;
          border: none;
          background: transparent;
          color: inherit;
          box-sizing: border-box !important;
        }
        .rdp-compact .rdp-day:hover:not([disabled]) {
          background: #f3f4f6;
        }
        .rdp-compact .rdp-day_selected {
          background: #18181b;
          color: #fff;
        }
        .rdp-compact .rdp-day_today:not(.rdp-day_selected) {
          background: #e5e7eb;
        }
        .rdp-compact .rdp-day_outside {
          color: #9ca3af;
        }
        .rdp-compact .rdp-day_disabled {
          color: #d1d5db;
          cursor: default;
        }
      `}</style>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className="p-2"
        classNames={{
          months: 'rdp-months',
          month: 'rdp-month',
          caption: 'rdp-caption',
          caption_label: 'rdp-caption_label',
          nav: 'rdp-nav',
          nav_button: 'rdp-nav_button',
          nav_button_previous: 'rdp-nav_button_previous',
          nav_button_next: 'rdp-nav_button_next',
          table: 'rdp-table',
          head_row: 'rdp-head_row',
          head_cell: 'rdp-head_cell',
          row: 'rdp-row',
          cell: 'rdp-cell',
          day: 'rdp-day',
          day_range_end: 'day-range-end',
          day_selected: 'rdp-day_selected',
          day_today: 'rdp-day_today',
          day_outside: 'rdp-day_outside',
          day_disabled: 'rdp-day_disabled',
          day_range_middle: 'day-range-middle',
          day_hidden: 'invisible',
          ...classNames,
        }}
        components={{
          IconLeft: () => <span aria-hidden style={{ lineHeight: 1, fontSize: 12 }}>&#60;</span>,
          IconRight: () => <span aria-hidden style={{ lineHeight: 1, fontSize: 12 }}>&#62;</span>,
        }}
        {...props}
      />
    </div>
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
