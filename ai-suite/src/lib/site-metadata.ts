import type { Metadata } from "next";

import type { Locale } from "@/i18n/dictionaries";
import { pwaMetadata } from "@/lib/pwa/metadata";

export function baseSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw && (raw.startsWith("http://") || raw.startsWith("https://"))) {
    return new URL(raw.endsWith("/") ? raw.slice(0, -1) : raw);
  }
  return new URL("https://isendai.netlify.app");
}

const ROOT_METADATA: Record<
  Locale,
  { title: string; description: string }
> = {
  en: {
    title: "isendai | Don't Send That Yet — Fix It First",
    description:
      "Paste the messy draft. Get an email, text, or cover letter you'd actually send. Viral-friendly AI micro-tools. Pay per use — no subscription trap.",
  },
  es: {
    title: "isendai | Perfecciona tu mensaje antes de enviarlo",
    description:
      "Deja de dar vueltas. Deja que la IA transforme tus correos, redacte tus cartas de presentación y alivie el estrés de comunicarte en segundos. Pago por uso, sin suscripciones.",
  },
  fr: {
    title: "isendai | Peaufinez votre message avant d’envoyer",
    description:
      "Arrêtez de trop réfléchir. Laissez l’IA transformer vos mails irrités, rédiger vos lettres de motivation et apaiser votre stress communicationnel en quelques secondes. Paiement à l’usage, sans abonnement.",
  },
  de: {
    title: "isendai | Perfektioniere deine Nachricht vor dem Absenden",
    description:
      "Hör auf zu grübeln. Lass KI verärgerte Mails umschreiben, Anschreiben formulieren und Kommunikationsstress in Sekunden lösen. Pay-per-Use, ohne Abo.",
  },
  zh: {
    title: "isendai | 发送前完善你的信息",
    description:
      "别再纠结。让 AI 秒改火药味邮件、起草求职信、缓解沟通焦虑。按次付费，无需订阅。",
  },
  tr: {
    title: "isendai | Henüz Gönderme — Önce Düzelt",
    description:
      "Dağınık taslağı yapıştır; göndermeye cesaret edeceğin mail, mesaj veya ön yazı al. Viral AI mikro araçlar. Kullandıkça öde — abonelik tuzağı yok.",
  },
};

export function rootMetadataForLocale(locale: Locale): Metadata {
  const { title, description } = ROOT_METADATA[locale];
  return pageMetadataForPath("/", title, description, locale);
}

const SEO_KEYWORDS: Record<Locale, string[]> = {
  en: [
    "AI email writer",
    "rewrite angry email",
    "cover letter AI",
    "dating bio generator",
    "professional message AI",
    "isendai",
  ],
  tr: [
    "yapay zeka mail yazarı",
    "öfkeli mail düzeltme",
    "ön yazı yapay zeka",
    "dating bio",
    "profesyonel mesaj AI",
    "isendai",
  ],
  es: ["IA correo", "carta presentación", "isendai"],
  fr: ["IA email", "lettre motivation", "isendai"],
  de: ["KI E-Mail", "Anschreiben", "isendai"],
  zh: ["AI 邮件", "求职信", "isendai"],
};

export function pageMetadataForPath(
  pathname: string,
  title: string,
  description: string,
  locale: Locale = "en"
): Metadata {
  const metadataBase = baseSiteUrl();
  const canonical = new URL(pathname.startsWith("/") ? pathname : `/${pathname}`, metadataBase);
  return {
    metadataBase,
    ...pwaMetadata(),
    title,
    description,
    keywords: SEO_KEYWORDS[locale],
    robots: { index: true, follow: true },
    alternates: { canonical: canonical.pathname },
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "isendai",
      url: canonical.href,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
