"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift, HelpCircle, LogOut, Mail, MoreHorizontal, Shield, X } from "lucide-react";

import { InstallAppButton } from "@/components/pwa/install-app-button";
import { SiteLocaleToolbar } from "@/components/site-locale-toolbar";
import { ReferralRewardsNav } from "@/components/referrals/referral-rewards-nav";
import { useI18n } from "@/i18n/i18n-provider";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";
import { getPublicSupportEmail } from "@/lib/support-email";
import { glassSurface } from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

type Props = {
  /** Initial hint from server render; menu also checks live session. */
  signedIn?: boolean;
  className?: string;
};

export function HeaderOverflowMenu({ signedIn: initialSignedIn = false, className }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [signedIn, setSignedIn] = React.useState(initialSignedIn);
  const supportEmail = getPublicSupportEmail();

  React.useEffect(() => {
    setSignedIn(initialSignedIn);
  }, [initialSignedIn]);

  React.useEffect(() => {
    if (!isSupabaseBrowserConfigured(runtime)) return;
    const supabase = createSupabaseBrowserClient(runtime);
    if (!supabase) return;

    function applySession(
      session: { user?: { id?: string } } | null
    ) {
      if (session?.user?.id) setSignedIn(true);
      else if (!initialSignedIn) setSignedIn(false);
    }

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));

    void fetch("/api/me/wallet", { cache: "no-store", credentials: "same-origin" })
      .then((r) => r.json() as Promise<{ signed_in?: boolean }>)
      .then((body) => {
        if (body.signed_in) setSignedIn(true);
      })
      .catch(() => {
        /* ignore */
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, [runtime, initialSignedIn]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function signOut() {
    if (!isSupabaseBrowserConfigured(runtime)) return;
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient(runtime);
      if (!supabase) return;
      await supabase.auth.signOut();
      setOpen(false);
      router.refresh();
      router.push("/");
    } finally {
      setBusy(false);
    }
  }

  const linkClass =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-violet-50";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-300/80 bg-white/90 text-slate-800 shadow-sm backdrop-blur-sm",
          "hover:border-violet-400/50 hover:bg-white",
          className
        )}
        aria-label={t("header.menu")}
        title={t("header.menu")}
      >
        <MoreHorizontal className="size-5" strokeWidth={1.75} aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            aria-label={t("header.menuClose")}
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="header-menu-title"
            className={cn(
              "relative z-[81] w-full max-w-sm rounded-2xl p-4 shadow-2xl",
              glassSurface
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="header-menu-title" className="text-sm font-semibold text-slate-900">
                {t("header.menuTitle")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label={t("header.menuClose")}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <SiteLocaleToolbar compact />
              <InstallAppButton variant="header" />
              <ReferralRewardsNav compact />
            </div>

            <nav className="grid gap-0.5" aria-label={t("header.menuTitle")}>
              <Link href="/faq" className={linkClass} onClick={() => setOpen(false)}>
                <HelpCircle className="size-4 shrink-0 text-violet-700" aria-hidden />
                {t("nav.faq")}
              </Link>
              <Link href="/contact" className={linkClass} onClick={() => setOpen(false)}>
                <Mail className="size-4 shrink-0 text-violet-700" aria-hidden />
                {t("nav.contact")}
              </Link>
              <Link href="/privacy" className={linkClass} onClick={() => setOpen(false)}>
                <Shield className="size-4 shrink-0 text-violet-700" aria-hidden />
                {t("nav.privacy")}
              </Link>
              <Link href="/terms" className={linkClass} onClick={() => setOpen(false)}>
                <Shield className="size-4 shrink-0 text-violet-700" aria-hidden />
                {t("nav.terms")}
              </Link>
              <Link href="/dashboard/rewards" className={linkClass} onClick={() => setOpen(false)}>
                <Gift className="size-4 shrink-0 text-violet-700" aria-hidden />
                {t("referrals.navLabel")}
              </Link>
              <a href={`mailto:${supportEmail}`} className={linkClass}>
                <Mail className="size-4 shrink-0 text-violet-700" aria-hidden />
                {supportEmail}
              </a>
              {signedIn ? (
                <button
                  type="button"
                  className={cn(linkClass, "text-rose-800 hover:bg-rose-50")}
                  disabled={busy}
                  onClick={() => void signOut()}
                >
                  <LogOut className="size-4 shrink-0" aria-hidden />
                  {t("nav.logout")}
                </button>
              ) : null}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
