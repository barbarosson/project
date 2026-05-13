import type { Locale } from "@/i18n/dictionaries";

/** BCP 47 tags for region names (matches app locale). */
const APP_LOCALE_TO_INTL: Record<Locale, string> = {
  en: "en-US",
  es: "es",
  fr: "fr",
  de: "de",
  zh: "zh-CN",
  tr: "tr-TR",
};

export type RegionOption = { code: string; label: string };

/** Minimal fallback if Intl.supportedValuesOf is unavailable (older runtimes). */
const FALLBACK_ALPHA2 = [
  "TR",
  "US",
  "GB",
  "DE",
  "FR",
  "ES",
  "IT",
  "NL",
  "BE",
  "CH",
  "AT",
  "PL",
  "SE",
  "NO",
  "DK",
  "FI",
  "IE",
  "PT",
  "GR",
  "CZ",
  "HU",
  "RO",
  "BG",
  "HR",
  "SI",
  "SK",
  "LT",
  "LV",
  "EE",
  "LU",
  "CY",
  "MT",
  "IS",
  "RU",
  "UA",
  "CN",
  "JP",
  "KR",
  "IN",
  "AU",
  "NZ",
  "CA",
  "MX",
  "BR",
  "AR",
  "ZA",
  "EG",
  "AE",
  "SA",
  "IL",
  "NG",
  "PK",
  "BD",
  "ID",
  "MY",
  "SG",
  "PH",
  "VN",
  "TH",
  "HK",
  "TW",
];

let cachedAlpha2: string[] | null = null;

function listAlpha2RegionCodes(): string[] {
  if (cachedAlpha2) return cachedAlpha2;
  try {
    const supportedValuesOf = (
      Intl as unknown as { supportedValuesOf?(type: string): string[] }
    ).supportedValuesOf;
    if (typeof supportedValuesOf === "function") {
      const all = supportedValuesOf.call(Intl, "region");
      const two = all.filter((c) => /^[A-Z]{2}$/.test(c));
      if (two.length >= 100) {
        cachedAlpha2 = two;
        return two;
      }
    }
  } catch {
    /* ignore */
  }
  cachedAlpha2 = FALLBACK_ALPHA2;
  return cachedAlpha2;
}

export function getSortedRegionOptions(locale: Locale): RegionOption[] {
  const codes = listAlpha2RegionCodes();
  const intlTag = APP_LOCALE_TO_INTL[locale];
  const dn = new Intl.DisplayNames([intlTag], { type: "region" });
  const opts = codes.map((code) => ({
    code,
    label: dn.of(code) ?? code,
  }));
  opts.sort((a, b) =>
    a.label.localeCompare(b.label, intlTag, { sensitivity: "base" })
  );
  return opts;
}

/** Map stored value to ISO alpha-2: already a code, or legacy localized country name. */
export function legacyCountryToCode(raw: string | undefined, locale: Locale): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  if (/^[a-z]{2}$/i.test(s)) {
    const up = s.toUpperCase();
    if (listAlpha2RegionCodes().includes(up)) return up;
  }
  const codes = listAlpha2RegionCodes();
  const intlTag = APP_LOCALE_TO_INTL[locale];
  const lower = s.toLowerCase();
  const dn = new Intl.DisplayNames([intlTag], { type: "region" });
  for (const code of codes) {
    const label = dn.of(code);
    if (label && label.toLowerCase() === lower) return code;
  }
  const dnEn = new Intl.DisplayNames(["en"], { type: "region" });
  for (const code of codes) {
    const label = dnEn.of(code);
    if (label && label.toLowerCase() === lower) return code;
  }
  return "";
}
