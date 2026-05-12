import type { Metadata } from "next";

import type { Locale } from "@/i18n/dictionaries";

function baseUrl(): URL {
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
    title: "isendai | Perfect Your Message Before You Hit Send",
    description:
      "Stop overthinking. Let AI transform your angry emails, write your cover letters, and handle your communication stress in seconds. Pay per use, no subscriptions.",
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
    title: "isendai | Göndermeden önce mesajını mükemmelleştir",
    description:
      "Kafa karışıklığını bırak; yapay zekâ öfkeli e-postalarını dönüştürsün, ön yazılarını yazsın, iletişim stresini saniyeler içinde hafifletsin. Kullandıkça öde, abonelik yok.",
  },
};

export function rootMetadataForLocale(locale: Locale): Metadata {
  const { title, description } = ROOT_METADATA[locale];
  const metadataBase = baseUrl();
  return {
    metadataBase,
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "isendai",
      url: metadataBase.href,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
