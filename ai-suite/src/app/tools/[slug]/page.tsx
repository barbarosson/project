import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { ToolCard } from "@/components/ai-suite/tool-card";
import { getToolDefinition } from "@/components/ai-suite/tools";
import { SeoBreadcrumbs } from "@/components/seo/seo-breadcrumbs";
import { SeoLandingHero } from "@/components/seo/seo-landing-hero";
import {
  getAllSeoTemplateSlugs,
  getSeoTemplateBySlug,
} from "@/data/seo-templates";
import type { Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";
import { programmaticSeoMetadata } from "@/lib/seo/programmatic-page-metadata";
import {
  SitePageChrome,
  SitePageHeader,
  SitePageMain,
} from "@/components/site-page-layout";

export function generateStaticParams() {
  return getAllSeoTemplateSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ text?: string | string[] }>;
};

const MAX_PREFILL_CHARS = 2000;

function parsePrefillText(raw: string | string[] | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (typeof s !== "string") return undefined;
  return s.length > MAX_PREFILL_CHARS ? s.slice(0, MAX_PREFILL_CHARS) : s;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = getSeoTemplateBySlug(slug);
  if (!template) {
    return { title: "Tool | isendai", robots: { index: false, follow: false } };
  }
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  return programmaticSeoMetadata(template, locale);
}

export default async function ProgrammaticSeoToolPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const template = getSeoTemplateBySlug(slug);
  if (!template) notFound();

  const sp = await searchParams;
  const initialText = parsePrefillText(sp.text);
  const authSnapshot = await readServerAuthSnapshot();
  const toolDef = getToolDefinition(template.toolId);

  const breadcrumbTitle =
    template.title.replace(/\s*\|\s*isendai\s*$/i, "").trim() || template.h1;

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="content" className="pb-16">
        <SeoBreadcrumbs currentTitle={breadcrumbTitle} />
        <SeoLandingHero h1={template.h1} paragraph={template.paragraph} />
        <section aria-labelledby="seo-tool-workspace" className="scroll-mt-24">
          <h2 id="seo-tool-workspace" className="sr-only">
            {toolDef.title}
          </h2>
          <ToolCard tool={template.toolId} initialText={initialText} />
        </section>
      </SitePageMain>
    </SitePageChrome>
  );
}
