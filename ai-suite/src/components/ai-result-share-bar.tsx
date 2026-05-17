"use client";

import * as React from "react";
import { Check, Copy, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCopyFeedback } from "@/components/copy-output-button";
import {
  FacebookMark,
  InstagramMark,
  LinkedInMark,
  TikTokMark,
  XMark,
} from "@/components/oauth-brand-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildSocialShareClipboardBody,
  buildTweetIntentUrl,
  copyTextForSocialShare,
  publicSiteUrl,
} from "@/lib/share/social-share";
import { useI18n } from "@/i18n/i18n-provider";

type AiResultShareBarProps = {
  text: string;
  onCopied?: () => void;
};

type SocialPlatform = "linkedin" | "facebook" | "instagram" | "tiktok";

const PLATFORM_URL: Record<SocialPlatform, string> = {
  linkedin: "https://www.linkedin.com/feed/?shareActive=true",
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/upload",
};

const TOAST_KEY: Record<SocialPlatform, string> = {
  linkedin: "success.shareLinkedInToast",
  facebook: "success.shareFacebookToast",
  instagram: "success.shareInstagramToast",
  tiktok: "success.shareTikTokToast",
};

const FAIL_KEY: Record<SocialPlatform, string> = {
  linkedin: "success.shareLinkedInCopyFailed",
  facebook: "success.shareCopyFailed",
  instagram: "success.shareCopyFailed",
  tiktok: "success.shareCopyFailed",
};

/**
 * Share actions for AI result blocks: copy, X, LinkedIn, Facebook, Instagram, TikTok, image download.
 */
export function AiResultShareBar({ text, onCopied }: AiResultShareBarProps) {
  const { t } = useI18n();
  const { isCopied, copyText } = useCopyFeedback(onCopied);
  const captureRef = React.useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = React.useState(false);

  const shareDisabled = text.trim().length === 0;
  const siteUrl = publicSiteUrl();

  function shareOnX() {
    if (shareDisabled) return;
    window.open(buildTweetIntentUrl(text, siteUrl), "_blank", "noopener,noreferrer");
  }

  async function shareViaClipboard(platform: SocialPlatform) {
    if (shareDisabled) return;
    const payload = buildSocialShareClipboardBody(text, siteUrl);
    try {
      await copyTextForSocialShare(payload);
      toast.success(t(TOAST_KEY[platform]));
      window.open(PLATFORM_URL[platform], "_blank", "noopener,noreferrer");
    } catch {
      toast.error(t(FAIL_KEY[platform]));
    }
  }

  async function downloadShareCard() {
    const node = captureRef.current;
    if (!node || shareDisabled) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#0f172a",
      });
      const a = document.createElement("a");
      a.download = `isendai-share-${Date.now()}.png`;
      a.href = canvas.toDataURL("image/png");
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(t("success.downloadSocialToast"));
    } catch {
      toast.error(t("success.downloadSocialFailed"));
    } finally {
      setDownloading(false);
    }
  }

  const roundBtn =
    "size-9 shrink-0 rounded-full p-0 transition-all duration-300 ease-out active:scale-95 sm:size-10";

  return (
    <>
      <div
        ref={captureRef}
        className="pointer-events-none fixed left-[-10000px] top-0 z-0 w-[390px] font-sans"
        aria-hidden
      >
        <div className="relative rounded-[28px] bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 p-8 pb-14 shadow-2xl ring-1 ring-white/10">
          <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 shadow-inner backdrop-blur-xl">
            <p
              className={cn(
                "whitespace-pre-wrap leading-relaxed text-white/95",
                text.length > 1600 ? "text-xs" : text.length > 800 ? "text-sm" : "text-[15px]"
              )}
            >
              {text}
            </p>
          </div>
          <p className="absolute bottom-5 right-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
            isendai.com
          </p>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.08] bg-black/20 px-3 py-2.5 sm:gap-2 sm:px-4"
        role="toolbar"
        aria-label={t("success.shareToolbarAria")}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(roundBtn, "border-white/[0.14] bg-white/[0.06] backdrop-blur-xl")}
          onClick={() => void copyText(text)}
          aria-label={isCopied ? t("ui.copied") : t("success.copy")}
          title={t("success.copy")}
        >
          {isCopied ? (
            <Check className="size-4 text-emerald-400" strokeWidth={1.5} aria-hidden />
          ) : (
            <Copy className="size-4 text-indigo-200" aria-hidden />
          )}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={shareDisabled}
          className={cn(roundBtn, "border border-zinc-800 bg-black text-white hover:bg-zinc-950")}
          onClick={shareOnX}
          aria-label={t("success.shareOnXAria")}
          title={t("success.shareOnX")}
        >
          <XMark className="size-4 fill-white sm:size-[18px]" />
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={shareDisabled}
          className={cn(roundBtn, "border-0 bg-[#0A66C2] text-white hover:bg-[#004182]")}
          onClick={() => void shareViaClipboard("linkedin")}
          aria-label={t("success.shareOnLinkedInAria")}
          title={t("success.shareOnLinkedIn")}
        >
          <LinkedInMark className="size-[18px] shrink-0 sm:size-5 [&_path]:!fill-white" />
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={shareDisabled}
          className={cn(roundBtn, "border-0 bg-[#1877F2] p-0 hover:bg-[#166fe5]")}
          onClick={() => void shareViaClipboard("facebook")}
          aria-label={t("success.shareOnFacebookAria")}
          title={t("success.shareOnFacebook")}
        >
          <FacebookMark className="size-[18px] sm:size-5" />
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={shareDisabled}
          className={cn(
            roundBtn,
            "border-0 bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] p-0"
          )}
          onClick={() => void shareViaClipboard("instagram")}
          aria-label={t("success.shareOnInstagramAria")}
          title={t("success.shareOnInstagram")}
        >
          <InstagramMark className="size-[18px] sm:size-5" />
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={shareDisabled}
          className={cn(roundBtn, "border border-white/20 bg-black hover:bg-zinc-900")}
          onClick={() => void shareViaClipboard("tiktok")}
          aria-label={t("success.shareOnTikTokAria")}
          title={t("success.shareOnTikTok")}
        >
          <TikTokMark className="size-4 sm:size-[18px]" />
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={downloading || shareDisabled}
          className={cn(
            roundBtn,
            "border-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
          )}
          onClick={() => void downloadShareCard()}
          aria-label={t("success.downloadSocialAria")}
          title={t("success.downloadSocial")}
        >
          {downloading ? (
            <Loader2 className="size-4 animate-spin text-white" aria-hidden />
          ) : (
            <Download className="size-4 text-white" aria-hidden />
          )}
        </Button>
      </div>
    </>
  );
}
