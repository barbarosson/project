"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FacebookMark } from "@/components/oauth-brand-icons";
import { useI18n } from "@/i18n/i18n-provider";
import { buildOAuthConnectingHref } from "@/lib/auth/oauth-connecting";
import { cn } from "@/lib/utils";

export function FacebookSignInButton({ nextAfterAuth = "/" }: { nextAfterAuth?: string }) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-12 w-full justify-center border-white/15 bg-slate-950/40 text-sm font-semibold text-slate-100 hover:bg-slate-950/60",
        "border-[#1877F2]/35 hover:border-[#1877F2]/50"
      )}
      onClick={() => router.push(buildOAuthConnectingHref("facebook", nextAfterAuth))}
    >
      <span className="inline-flex items-center justify-center gap-3">
        <FacebookMark className="size-5" />
        <span>{t("login.oauthFacebook")}</span>
      </span>
    </Button>
  );
}
