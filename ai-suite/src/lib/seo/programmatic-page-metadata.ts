import type { Metadata } from "next";

import type { SeoTemplate } from "@/data/seo-templates";
import type { Locale } from "@/i18n/dictionaries";
import { pageMetadataForPath } from "@/lib/site-metadata";

export function programmaticSeoMetadata(
  template: SeoTemplate,
  locale: Locale = "en"
): Metadata {
  const path = `/tools/${template.slug}`;
  const description =
    template.description.length > 160
      ? `${template.description.slice(0, 157)}…`
      : template.description;

  return pageMetadataForPath(path, template.title, description, locale);
}
