import { ChevronDown } from "lucide-react";

import type { FaqItem } from "@/i18n/faq-content";
import { glassInteractive } from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

type FaqListProps = {
  items: FaqItem[];
};

export function FaqList({ items }: FaqListProps) {
  return (
    <div className="mt-8 space-y-3">
      {items.map((item, index) => (
        <details
          key={index}
          className={cn(
            "group rounded-xl",
            glassInteractive,
            "open:border-violet-500/40"
          )}
        >
          <summary
            className={cn(
              "flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4",
              "text-sm font-semibold text-white sm:text-base marker:content-none",
              "[&::-webkit-details-marker]:hidden"
            )}
          >
            <span className="text-pretty pr-1">
              <span className="mr-2 text-violet-400/90">{index + 1}.</span>
              {item.question}
            </span>
            <ChevronDown
              className="mt-0.5 size-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="border-t border-white/[0.08] px-4 pb-4 pt-3 text-sm leading-relaxed text-slate-200 sm:px-5 sm:text-base">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
