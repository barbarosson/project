"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GoogleMark } from "@/components/oauth-brand-icons";
import { useI18n } from "@/i18n/i18n-provider";
import { buildOAuthConnectingHref } from "@/lib/auth/oauth-connecting";
import { hasInvalidGoogleOAuthClientIdEnv } from "@/lib/auth/google-gis";
import { cn } from "@/lib/utils";

export function GoogleSignInButton({ nextAfterAuth = "/" }: { nextAfterAuth?: string }) {
  const { t } = useI18n();
  const router = useRouter();

  function handleClick() {
    if (hasInvalidGoogleOAuthClientIdEnv()) {
      toast.error(t("login.oauthGoogleClientIdInvalid"));
    }
    router.push(buildOAuthConnectingHref("google", nextAfterAuth));
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-12 w-full justify-center border-white/15 bg-slate-950/40 text-sm font-semibold text-slate-100 hover:bg-slate-950/60",
        "border-emerald-500/25"
      )}
      onClick={handleClick}
    >
      <span className="inline-flex items-center justify-center gap-3">
        <GoogleMark className="size-5" />
        <span>{t("login.oauthGoogle")}</span>
      </span>
    </Button>
  );
}
