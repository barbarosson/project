"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AuthStatus } from "@/components/auth-status";
import { CreditsNav } from "@/components/credits-nav";
import { ReferralRewardsNav } from "@/components/referrals/referral-rewards-nav";
import { IsendaiLogo } from "@/components/isendai-logo";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { SiteLocaleToolbar } from "@/components/site-locale-toolbar";
import { useI18n } from "@/i18n/i18n-provider";
import { MODULUS_SITE_URL } from "@/lib/modulus-site";
import { getPublicSupportEmail } from "@/lib/support-email";
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
  return (
    <div className="flex min-h-full min-w-0 flex-col overflow-x-clip">
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <SitePageFooter />
    </div>
  );
}

function FooterDot() {
  return <span className="hidden shrink-0 text-white/25 sm:inline" aria-hidden>·</span>;
}

export function SitePageFooter() {
  const { t } = useI18n();
  const supportEmail = getPublicSupportEmail();

  const navLink =
    "shrink-0 whitespace-nowrap text-xs font-medium text-foreground/85 transition-colors hover:text-foreground sm:text-sm";
  const navLinkMuted =
    "shrink-0 whitespace-nowrap text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm";

  return (
    <footer className="mt-auto border-t border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
      <div className={siteContainer("py-6 sm:py-8")}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="min-w-0 max-w-xl shrink-0 space-y-1">
            <p className="text-pretty text-xs leading-snug text-muted-foreground sm:text-sm">
              {t("footer.copyright")}
            </p>
            <p className="flex min-w-0 flex-wrap items-baseline gap-x-1 gap-y-0.5 text-pretty text-xs leading-snug text-muted-foreground sm:text-sm">
              <span>{t("footer.modulusLead")}</span>
              <a
                href={MODULUS_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-violet-200 underline-offset-2 transition-colors hover:text-white hover:underline"
              >
                modulusaas.com
              </a>
            </p>
          </div>

          <nav
            className="min-w-0 lg:flex-1 lg:justify-end"
            aria-label="Footer"
          >
            <div className="-mx-1 flex min-w-0 items-center gap-x-2 gap-y-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 lg:justify-end [&::-webkit-scrollbar]:hidden">
              <Link className={navLink} href="/login">
                {t("nav.login")}
              </Link>
              <FooterDot />
              <Link className={navLinkMuted} href="/account">
                {t("nav.account")}
              </Link>
              <FooterDot />
              <Link className={navLinkMuted} href="/pricing">
                {t("nav.pricing")}
              </Link>
              <FooterDot />
              <Link className={navLinkMuted} href="/faq">
                {t("nav.faq")}
              </Link>
              <FooterDot />
              <Link className={navLinkMuted} href="/contact">
                {t("nav.contact")}
              </Link>
              <FooterDot />
              <a className={navLinkMuted} href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>
              <FooterDot />
              <Link className={navLinkMuted} href="/privacy">
                {t("nav.privacy")}
              </Link>
              <FooterDot />
              <Link className={navLinkMuted} href="/terms">
                {t("nav.terms")}
              </Link>
            </div>
          </nav>
        </div>

        <p className="mt-4 border-t border-white/[0.06] pt-4 text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs lg:text-left">
          {t("footer.trust")}
        </p>
      </div>
    </footer>
  );
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
        <SiteLocaleToolbar />
        <InstallAppButton variant="header" />
        <ReferralRewardsNav />
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
