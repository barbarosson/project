"use client";

import { useRouter } from "next/navigation";
import type { Provider } from "@supabase/auth-js";

import { Button } from "@/components/ui/button";
import { OauthProviderMark } from "@/components/oauth-brand-icons";
import { useI18n } from "@/i18n/i18n-provider";
import { buildOAuthConnectingHref } from "@/lib/auth/oauth-connecting";
import { cn } from "@/lib/utils";

type Row = {
  provider: Provider;
  labelKey: string;
};

const OAUTH_ROWS: Row[] = [
  { provider: "apple", labelKey: "login.oauthApple" },
  { provider: "x", labelKey: "login.oauthX" },
  { provider: "linkedin_oidc", labelKey: "login.oauthLinkedin" },
  { provider: "custom:tiktok" as Provider, labelKey: "login.oauthTiktok" },
];

export function OAuthLoginButtons({ nextAfterAuth = "/" }: { nextAfterAuth?: string }) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <div className="grid gap-3">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t("login.oauthOtherTitle")}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {OAUTH_ROWS.map((row) => (
          <Button
            key={row.provider}
            type="button"
            variant="outline"
            className={cn(
              "h-11 justify-center border-white/15 bg-slate-950/40 text-sm font-semibold text-slate-100 hover:bg-slate-950/60",
              row.provider === "apple" && "border-white/20",
              row.provider === "x" && "border-sky-500/30",
              (row.provider === "linkedin_oidc" || String(row.provider).includes("tiktok")) &&
                "border-sky-600/30"
            )}
            onClick={() => router.push(buildOAuthConnectingHref(row.provider, nextAfterAuth))}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <OauthProviderMark provider={row.provider} />
              <span className="truncate">{t(row.labelKey)}</span>
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
