"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { InstagramMark } from "@/components/oauth-brand-icons";
import { useI18n } from "@/i18n/i18n-provider";
import { INSTAGRAM_OAUTH_PROVIDER } from "@/lib/auth/instagram-oauth";
import { buildOAuthConnectingHref } from "@/lib/auth/oauth-connecting";
import { cn } from "@/lib/utils";

export function InstagramSignInButton({ nextAfterAuth = "/" }: { nextAfterAuth?: string }) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-12 w-full justify-center border-white/15 bg-slate-950/40 text-sm font-semibold text-slate-100 hover:bg-slate-950/60",
        "border-fuchsia-500/35 hover:border-fuchsia-500/50"
      )}
      onClick={() =>
        router.push(buildOAuthConnectingHref(INSTAGRAM_OAUTH_PROVIDER, nextAfterAuth))
      }
    >
      <span className="inline-flex items-center justify-center gap-3">
        <InstagramMark className="size-5" />
        <span>{t("login.oauthInstagram")}</span>
      </span>
    </Button>
  );
}
