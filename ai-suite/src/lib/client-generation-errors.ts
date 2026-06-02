type Translate = (key: string) => string;

type CreditsJson = {
  credits_required?: string;
  credits_balance?: string;
};

/** Localized copy for 402 / insufficient_credits (ignores misleading raw API English). */
export function clientInsufficientCreditsMessage(t: Translate, json?: CreditsJson | null): string {
  if (json?.credits_required != null && json?.credits_balance != null) {
    return t("errors.insufficientCreditsDetail")
      .replace("{required}", String(json.credits_required))
      .replace("{balance}", String(json.credits_balance));
  }
  return t("errors.insufficientCredits");
}

/** Localized copy for alternative-version insufficient credits. */
export function clientInsufficientCreditsAltMessage(t: Translate, json?: CreditsJson | null): string {
  if (json?.credits_required != null && json?.credits_balance != null) {
    return t("errors.insufficientCreditsAltDetail")
      .replace("{required}", String(json.credits_required))
      .replace("{balance}", String(json.credits_balance));
  }
  return t("errors.insufficientCreditsAlt");
}

/** Map raw provider errors (e.g. temperature deprecated) to localized UI text. */
export function clientMapGenerationError(t: Translate, raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("temperature") && (m.includes("deprecated") || m.includes("unsupported"))) {
    return t("errors.aiTemperatureUnsupported");
  }
  if (m.includes("insufficient") && (m.includes("credit") || m.includes("balance"))) {
    return t("errors.insufficientCredits");
  }
  const trimmed = raw.trim();
  if (trimmed.length > 0 && trimmed.length <= 280) return trimmed;
  return t("errors.generationFailed");
}
