import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { AuthStatus } from "@/components/auth-status";
import { CreditsNav } from "@/components/credits-nav";
import { IsendaiLogo } from "@/components/isendai-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ToolCard } from "@/components/ai-suite/tool-card";
import { getToolDefinition, isToolName, type ToolName } from "@/components/ai-suite/tools";
import { SEO_CATEGORY_TITLE } from "@/lib/seo/category-public-title";
import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";

const MAX_PREFILL_CHARS = 2000;

export const dynamic = "force-dynamic";

function parsePrefillText(raw: string | string[] | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (typeof s !== "string") return undefined;
  return s.length > MAX_PREFILL_CHARS ? s.slice(0, MAX_PREFILL_CHARS) : s;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isToolName(id)) {
    return { title: "Tool | isendai" };
  }
  const def = getToolDefinition(id);
  const categoryTitle = SEO_CATEGORY_TITLE[def.category];
  return {
    title: `${def.title} - isendai AI | ${categoryTitle}`,
    description: `${def.description} Generate professional, HR-safe, and high EQ messages instantly.`,
  };
}

export default async function ToolDeepLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ text?: string | string[] }>;
}) {
  const { id } = await params;
  if (!isToolName(id)) notFound();

  const sp = await searchParams;
  const initialText = parsePrefillText(sp.text);

  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];
  const tool = id as ToolName;

  return (
    <div className="min-h-full">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:py-5">
        <Link href="/" className="flex min-w-0 items-center">
          <IsendaiLogo
            withWordmark
            className="shrink-0 gap-2 sm:gap-3"
            iconClassName="size-10 shrink-0 sm:size-12"
            wordmarkClassName="text-xl sm:text-2xl"
          />
        </Link>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <CreditsNav />
          <AuthStatus />
          <LanguageSwitcher className="px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16">
        <p className="mb-6">
          <Link className="text-sm text-violet-300 hover:text-violet-200" href="/">
            ← {d["nav.backToHome"]}
          </Link>
        </p>
        <ToolCard tool={tool} initialText={initialText} enableMarketingFreeTrial />
      </main>
    </div>
  );
}
