import { cookies } from "next/headers";
import type { Metadata } from "next";

import { ContactPageBody } from "@/app/contact/contact-page-body";
import type { Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { pageMetadataForPath } from "@/lib/site-metadata";

const CONTACT_META: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Contact | isendai",
    description: "Get help with billing, accounts, or product questions.",
  },
  es: {
    title: "Contacto | isendai",
    description: "Ayuda con facturación, cuenta o el producto.",
  },
  fr: {
    title: "Contact | isendai",
    description: "Aide facturation, compte ou produit.",
  },
  de: {
    title: "Kontakt | isendai",
    description: "Hilfe zu Abrechnung, Konto oder Produkt.",
  },
  zh: {
    title: "联系我们 | isendai",
    description: "账单、账户或产品问题支持。",
  },
  tr: {
    title: "İletişim | isendai",
    description: "Fatura, hesap veya ürün soruları için destek.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const { title, description } = CONTACT_META[locale];
  return pageMetadataForPath("/contact", title, description);
}

export default function ContactPage() {
  return <ContactPageBody />;
}
