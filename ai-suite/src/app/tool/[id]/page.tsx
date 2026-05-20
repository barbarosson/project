import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";
import { ToolCard } from "@/components/ai-suite/tool-card";
import { isToolName, type ToolName } from "@/components/ai-suite/tools";
import { DICTS } from "@/i18n/dictionaries";
import {
  SitePageBackNav,
  SitePageChrome,
  SitePageHeader,
  SitePageMain,
} from "@/components/site-page-layout";
import type { Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { toolPageMetadata } from "@/lib/seo/tool-page-metadata";

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
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  return toolPageMetadata(locale, id);
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
  const authSnapshot = await readServerAuthSnapshot();

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="narrow" className="pb-16">
        <SitePageBackNav>{d["nav.backToHome"]}</SitePageBackNav>
        <ToolCard tool={tool} initialText={initialText} />
      </SitePageMain>
    </SitePageChrome>
  );
}
