import Link from "next/link";

import { cn } from "@/lib/utils";

const linkClass =
  "text-slate-400 underline-offset-2 transition-colors hover:text-violet-200 hover:underline";

export function SeoBreadcrumbs({
  currentTitle,
  className,
}: {
  currentTitle: string;
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-6 min-w-0", className)}>
      <ol
        className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-400 sm:text-sm"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
          <Link href="/" itemProp="item">
            <span itemProp="name">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>
        <li aria-hidden className="text-white/25">
          /
        </li>
        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
          <Link href="/#home-tools" itemProp="item">
            <span itemProp="name">Tools</span>
          </Link>
          <meta itemProp="position" content="2" />
        </li>
        <li aria-hidden className="text-white/25">
          /
        </li>
        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          className="min-w-0 max-w-full font-medium text-slate-200"
          aria-current="page"
        >
          <span itemProp="name" className="line-clamp-2 sm:line-clamp-1">
            {currentTitle}
          </span>
          <meta itemProp="position" content="3" />
        </li>
      </ol>
    </nav>
  );
}
