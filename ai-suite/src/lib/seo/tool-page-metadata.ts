import type { Metadata } from "next";

import type { ToolName } from "@/components/ai-suite/tools";
import { resolveToolDescription, resolveToolTitle } from "@/i18n/tool-copy-resolve";
import type { Locale } from "@/i18n/dictionaries";
import { getToolDefinition } from "@/components/ai-suite/tools";
import { SEO_CATEGORY_TITLE } from "@/lib/seo/category-public-title";

import { pageMetadataForPath } from "../site-metadata";

export function toolPageMetadata(locale: Locale, tool: ToolName): Metadata {
  const title = resolveToolTitle(locale, tool);
  const description = resolveToolDescription(locale, tool);
  const category = SEO_CATEGORY_TITLE[getToolDefinition(tool).category];
  const pageTitle = `${title} | isendai — ${category}`;
  const metaDescription =
    description.length > 155 ? `${description.slice(0, 152)}…` : description;

  return pageMetadataForPath(`/tool/${tool}`, pageTitle, metaDescription, locale);
}
