"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import type { ReactNode } from "react";

import { AuthStatus } from "@/components/auth-status";
import { CreditsNav } from "@/components/credits-nav";
import { ReferralRewardsNav } from "@/components/referrals/referral-rewards-nav";
import { HeaderOverflowMenu } from "@/components/mobile/header-overflow-menu";
import { MobileBottomNav } from "@/components/mobile/bottom-nav";
import { IsendaiLogo } from "@/components/isendai-logo";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { SiteLocaleToolbar } from "@/components/site-locale-toolbar";
import { useI18n } from "@/i18n/i18n-provider";
import { MODULUS_SITE_URL } from "@/lib/modulus-site";
import { getModulusLinkedInUrl } from "@/lib/social-links";
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
    <div className="flex min-h-full min-w-0 flex-col overflow-x-clip pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <SiteSecurityStrip />
      <SitePageFooter />
      <MobileBottomNav />
    </div>
  );
}

function SiteSecurityStrip() {
  const { t } = useI18n();

  return (
    <aside
      className="mt-auto border-t border-white/[0.06] bg-white/[0.03] backdrop-blur-md light:border-slate-300/60 light:bg-slate-50/80"
      aria-label="Security"
    >
      <div className={siteContainer("py-3 sm:py-3.5")}>
        <p className="text-pretty text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          {t("footer.security")}
        </p>
      </div>
    </aside>
  );
}

function FooterDot() {
  return <span className="shrink-0 text-[10px] text-white/25 light:text-slate-400" aria-hidden>·</span>;
}

export function SitePageFooter() {
  const { t } = useI18n();
  const supportEmail = getPublicSupportEmail();
  const modulusLinkedInUrl = getModulusLinkedInUrl();

  const navLink =
    "shrink-0 whitespace-nowrap text-[11px] font-medium text-foreground/85 transition-colors hover:text-foreground sm:text-xs xl:text-sm";
  const navLinkMuted =
    "shrink-0 whitespace-nowrap text-[11px] text-muted-foreground transition-colors hover:text-foreground sm:text-xs xl:text-sm";

  return (
    <footer className="mt-auto border-t border-white/[0.08] bg-white/[0.02] backdrop-blur-xl light:border-slate-300/70 light:bg-white/60">
      <div className={cn(siteContainer("py-4 sm:py-5"), "lg:hidden")}>
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          {t("footer.copyright")}
        </p>
        <nav
          className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]"
          aria-label="Footer"
        >
          <Link className={navLinkMuted} href="/faq">
            {t("nav.faq")}
          </Link>
          <Link className={navLinkMuted} href="/contact">
            {t("nav.contact")}
          </Link>
          <Link className={navLinkMuted} href="/privacy">
            {t("nav.privacy")}
          </Link>
          <Link className={navLinkMuted} href="/terms">
            {t("nav.terms")}
          </Link>
        </nav>
      </div>

      <div className={cn(siteContainer("py-5 max-lg:hidden sm:py-6"))}>
        <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-3">
          <div className="min-w-0 max-w-[min(100%,14rem)] shrink space-y-0.5 sm:max-w-[min(100%,18rem)] md:max-w-[min(100%,22rem)]">
            <p className="truncate text-[11px] leading-snug text-muted-foreground sm:text-xs">
              {t("footer.copyright")}
            </p>
            <p className="flex min-w-0 items-baseline gap-x-1 truncate text-[11px] leading-snug text-muted-foreground sm:text-xs">
              <span className="truncate">{t("footer.modulusLead")}</span>
              <a
                href={MODULUS_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 font-semibold text-violet-200 underline-offset-2 transition-colors hover:text-white hover:underline light:text-violet-800 light:hover:text-fuchsia-700"
              >
                modulusaas.com
              </a>
            </p>
          </div>

          <nav className="min-w-0 shrink" aria-label="Footer">
            <div className="flex flex-nowrap items-center justify-end gap-x-1 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:gap-x-1.5 [&::-webkit-scrollbar]:hidden">
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
              <a className={navLinkMuted} href={`mailto:${supportEmail}`} title={supportEmail}>
                <span className="2xl:hidden">Email</span>
                <span className="hidden 2xl:inline">{supportEmail}</span>
              </a>
              <FooterDot />
              <Link className={navLinkMuted} href="/privacy">
                {t("nav.privacy")}
              </Link>
              <FooterDot />
              <Link className={navLinkMuted} href="/terms">
                {t("nav.terms")}
              </Link>
              {modulusLinkedInUrl ? (
                <>
                  <FooterDot />
                  <a
                    className={navLinkMuted}
                    href={modulusLinkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                </>
              ) : null}
            </div>
          </nav>
        </div>

        <p className="mt-3 border-t border-white/[0.06] pt-3 text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs md:text-left light:border-slate-300/60">
          {t("footer.trust")}
        </p>
      </div>
    </footer>
  );
}

function HeaderLogoLink({ wordmarkClassName }: { wordmarkClassName?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "relative z-10 inline-flex shrink-0 items-center rounded-xl",
        "bg-white/90 px-2 py-1 shadow-[0_2px_14px_rgba(30,27,75,0.08)]",
        "ring-1 ring-violet-200/70 backdrop-blur-sm",
        "transition-shadow hover:bg-white hover:shadow-[0_4px_18px_rgba(109,40,217,0.12)]",
        "sm:px-2.5 sm:py-1.5"
      )}
      aria-label="isendai"
    >
      <IsendaiLogo
        withWordmark
        iconClassName="size-7 shrink-0 sm:size-8"
        wordmarkClassName={cn(
          "whitespace-nowrap text-sm sm:text-base md:text-lg",
          wordmarkClassName
        )}
      />
    </Link>
  );
}

export function SitePageHeader({
  initialSignedInLabel = null,
}: {
  initialSignedInLabel?: string | null;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const showHomeNav = pathname !== "/";
  const signedIn = Boolean(initialSignedInLabel);

  const headerToolClass = "relative z-10 shrink-0 touch-manipulation";

  return (
    <>
      {/* Compact shell: phone + tablet (< lg) */}
      <header className="relative z-30 safe-area-top pb-2 lg:hidden">
        <div className={siteContainer("flex items-center gap-2")}>
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {showHomeNav ? (
              <Link
                href="/"
                className={cn(
                  pageBackLink,
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-300/70 bg-white/90"
                )}
                aria-label={t("nav.backToHome")}
              >
                <Home className="size-4 shrink-0" aria-hidden />
              </Link>
            ) : null}
            <HeaderLogoLink wordmarkClassName="inline" />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <CreditsNav className={headerToolClass} />
            <AuthStatus
              iconOnly
              className={headerToolClass}
              initialSignedInLabel={initialSignedInLabel}
            />
            <HeaderOverflowMenu signedIn={signedIn} className={headerToolClass} />
          </div>
        </div>
      </header>

      {/* Desktop shell (≥ lg) */}
      <header className="relative z-30 max-lg:hidden safe-area-top pb-3 sm:pb-4">
        <div className={siteContainer("flex flex-nowrap items-center gap-2 sm:gap-3 md:gap-4")}>
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {showHomeNav ? (
              <Link
                href="/"
                className={cn(
                  pageBackLink,
                  "inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-1.5 py-1",
                  "light:border-slate-300/70 light:bg-white/80",
                  "sm:px-2 sm:py-1.5"
                )}
                aria-label={t("nav.backToHome")}
                title={t("nav.backToHome")}
              >
                <Home className="size-4 shrink-0" aria-hidden />
                <span className="hidden xl:inline">{t("nav.backToHome")}</span>
              </Link>
            ) : null}
            <HeaderLogoLink wordmarkClassName="hidden sm:inline" />
          </div>
          <div
            role="toolbar"
            aria-label="Header"
            className="ml-auto flex min-w-0 flex-nowrap items-center justify-end gap-1 overflow-x-auto [scrollbar-width:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden"
          >
            <SiteLocaleToolbar compact />
            <InstallAppButton variant="header" className={headerToolClass} />
            <ReferralRewardsNav compact className={headerToolClass} />
            <CreditsNav className={cn(headerToolClass, "flex-nowrap")} />
            <AuthStatus
              compact
              className={headerToolClass}
              initialSignedInLabel={initialSignedInLabel}
            />
          </div>
        </div>
      </header>
    </>
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
