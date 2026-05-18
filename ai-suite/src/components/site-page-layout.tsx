"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AuthStatus } from "@/components/auth-status";
import { CreditsNav } from "@/components/credits-nav";
import { IsendaiLogo } from "@/components/isendai-logo";
import { siteContainer, type PageShellVariant } from "@/lib/page-layout";
import {
  pageBackLink,
  pageContentSection,
  pageMeta,
  pageSubtitle,
  pageTitle,
} from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

const innerWidth: Record<PageShellVariant, string> = {
  auth: "max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
  content: "max-w-4xl lg:max-w-5xl xl:max-w-6xl",
  narrow: "max-w-3xl lg:max-w-4xl",
  legal: "max-w-3xl lg:max-w-4xl",
};

export function SitePageChrome({ children }: { children: ReactNode }) {
  return <div className="min-h-full min-w-0 overflow-x-clip">{children}</div>;
}

export function SitePageHeader({
  initialSignedInLabel = null,
}: {
  initialSignedInLabel?: string | null;
}) {
  return (
    <header
      className={siteContainer(
        "flex flex-wrap items-start justify-between gap-3 py-4 sm:items-center sm:py-5"
      )}
    >
      <Link href="/" className="flex min-w-0 max-w-[min(100%,20rem)] flex-1 items-center sm:max-w-none">
        <IsendaiLogo
          withWordmark
          className="min-w-0 max-w-full gap-1.5 sm:gap-2 md:gap-3"
          iconClassName="size-9 shrink-0 sm:size-10 md:size-12 lg:size-14"
          wordmarkClassName="truncate text-xl sm:text-2xl md:text-3xl lg:text-4xl"
        />
      </Link>
      <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-1.5 sm:w-auto sm:gap-2">
        <CreditsNav />
        <AuthStatus className="shrink-0" initialSignedInLabel={initialSignedInLabel} />
      </div>
    </header>
  );
}

export function SitePageMain({
  width = "content",
  className,
  children,
}: {
  width?: PageShellVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <main className={siteContainer(cn("min-w-0 pb-10 sm:pb-12 md:pb-14", className))}>
      <div className={cn("mx-auto w-full min-w-0", innerWidth[width])}>{children}</div>
    </main>
  );
}

export function SitePageBackNav({
  href = "/",
  children,
  className,
}: {
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      <Link href={href} className={pageBackLink}>
        ← {children}
      </Link>
    </div>
  );
}

export function SitePageTitleBlock({
  title,
  subtitle,
  meta,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0 flex-1">
        <h1 className={pageTitle}>{title}</h1>
        {subtitle ? <p className={cn(pageSubtitle, "mt-2 max-w-3xl")}>{subtitle}</p> : null}
        {meta ? <p className={cn(pageMeta, "mt-2")}>{meta}</p> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function SitePageSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn(pageContentSection, "mt-6", className)}>{children}</section>;
}
