import type { Locale } from "@/i18n/dictionaries";

import { PrivacyDeBody } from "@/app/legal/privacy-de-body";
import { PrivacyEnBody } from "@/app/legal/privacy-en-body";
import { PrivacyEsBody } from "@/app/legal/privacy-es-body";
import { PrivacyFrBody } from "@/app/legal/privacy-fr-body";
import { PrivacyTrBody } from "@/app/legal/privacy-tr-body";
import { PrivacyZhBody } from "@/app/legal/privacy-zh-body";

export function PrivacyBody({ locale }: { locale: Locale }) {
  switch (locale) {
    case "tr":
      return <PrivacyTrBody />;
    case "es":
      return <PrivacyEsBody />;
    case "fr":
      return <PrivacyFrBody />;
    case "de":
      return <PrivacyDeBody />;
    case "zh":
      return <PrivacyZhBody />;
    default:
      return <PrivacyEnBody />;
  }
}
