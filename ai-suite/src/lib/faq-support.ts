import type { Locale } from "@/i18n/dictionaries";
import { DEFAULT_SUPPORT_EMAIL } from "@/lib/support-email";

const SUPPORT_BY_LOCALE: Record<Locale, { help: string; delete: string }> = {
  en: {
    help: `Persistent issues may be rate limits or provider outages — email ${DEFAULT_SUPPORT_EMAIL} or use the /contact form.`,
    delete: `Delete your account from Account settings, or email ${DEFAULT_SUPPORT_EMAIL} / use /contact. We aim to remove requested data within a reasonable time, subject to legal and operational requirements.`,
  },
  tr: {
    help: `Sorun sürerse oran sınırı veya sağlayıcı kesintisi olabilir — ${DEFAULT_SUPPORT_EMAIL} veya /contact formu.`,
    delete: `Hesabınızı Hesap ayarlarından silebilir veya ${DEFAULT_SUPPORT_EMAIL} / /contact üzerinden yazabilirsiniz. Talep edilen verileri makul sürede silmeyi hedefleriz; yasal ve operasyonel gereklilikler geçerlidir.`,
  },
  es: {
    help: `Si persiste, puede ser límite de tasa o caída del proveedor — escribe a ${DEFAULT_SUPPORT_EMAIL} o usa /contact.`,
    delete: `Elimina tu cuenta en Ajustes de cuenta o escribe a ${DEFAULT_SUPPORT_EMAIL} / /contact. Intentamos borrar los datos solicitados en un plazo razonable, con los límites legales y operativos.`,
  },
  fr: {
    help: `Si le problème continue : limite de débit ou panne fournisseur — ${DEFAULT_SUPPORT_EMAIL} ou formulaire /contact.`,
    delete: `Supprimez votre compte dans Paramètres du compte ou écrivez à ${DEFAULT_SUPPORT_EMAIL} / /contact. Nous visons à supprimer les données demandées dans un délai raisonnable, sous réserve des obligations légales.`,
  },
  de: {
    help: `Bei anhaltenden Problemen: Rate-Limit oder Anbieterausfall — ${DEFAULT_SUPPORT_EMAIL} oder /contact.`,
    delete: `Konto unter Kontoeinstellungen löschen oder ${DEFAULT_SUPPORT_EMAIL} / /contact. Wir streben eine Löschung innerhalb angemessener Frist an, vorbehaltlich rechtlicher Anforderungen.`,
  },
  zh: {
    help: `若仍失败，可能是限流或服务商故障 — 请发邮件至 ${DEFAULT_SUPPORT_EMAIL} 或使用 /contact。`,
    delete: `可在账户设置中删除账户，或发信至 ${DEFAULT_SUPPORT_EMAIL} / 使用 /contact。我们将在合理期限内删除所请求的数据，受法律与运营要求约束。`,
  },
};

export function faqSupportAnswers(locale: Locale): { help: string; delete: string } {
  return SUPPORT_BY_LOCALE[locale] ?? SUPPORT_BY_LOCALE.en;
}
