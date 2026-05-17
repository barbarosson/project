import type { Locale } from "@/i18n/dictionaries";

import { TermsDeBody } from "@/app/legal/terms-de-body";
import { TermsEnBody } from "@/app/legal/terms-en-body";
import { TermsEsBody } from "@/app/legal/terms-es-body";
import { TermsFrBody } from "@/app/legal/terms-fr-body";
import { TermsTrBody } from "@/app/legal/terms-tr-body";
import { TermsZhBody } from "@/app/legal/terms-zh-body";

export function TermsBody({ locale }: { locale: Locale }) {
  switch (locale) {
    case "tr":
      return <TermsTrBody />;
    case "es":
      return <TermsEsBody />;
    case "fr":
      return <TermsFrBody />;
    case "de":
      return <TermsDeBody />;
    case "zh":
      return <TermsZhBody />;
    default:
      return <TermsEnBody />;
  }
}
