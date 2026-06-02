import { DICTS, type Locale } from "@/i18n/dictionaries";
import { resolveToolTitle } from "@/i18n/tool-copy-resolve";
import type { ToolName } from "@/components/ai-suite/tools";

const LOCALES: Locale[] = ["en", "tr", "es", "fr", "de", "zh"];

export function parseApiLocale(raw: unknown): Locale {
  if (typeof raw === "string" && (LOCALES as string[]).includes(raw)) return raw as Locale;
  return "en";
}

function dict(locale: Locale): Record<string, string> {
  return DICTS[locale] ?? DICTS.en;
}

function fill(template: string, vars: Record<string, string>): string {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{${k}}`).join(v);
  }
  return s;
}

export function generateOutOfScopeError(
  locale: Locale,
  tool: ToolName,
  opts?: { suggestedTool?: ToolName; giftMismatch?: boolean }
): string {
  const d = dict(locale);
  const toolName = resolveToolTitle(locale, tool);
  const reason =
    opts?.giftMismatch === true
      ? (d["errors.outOfScopeReason.gift"] ?? d["errors.outOfScopeReason.generic"] ?? "")
      : (d["errors.outOfScopeReason.generic"] ?? "");

  let msg = fill(d["errors.outOfScope"] ?? "Out of scope for {tool}. {reason}", {
    tool: toolName,
    reason,
  });

  if (opts?.suggestedTool && opts.suggestedTool !== "unknown") {
    const suggestedName = resolveToolTitle(locale, opts.suggestedTool);
    msg += ` ${fill(d["errors.outOfScopeTryTool"] ?? "Try {toolName}.", { toolName: suggestedName })}`;
  }

  return msg.trim();
}

export function conciergeError(locale: Locale, key: string): string {
  const d = dict(locale);
  return d[key] ?? DICTS.en[key] ?? key;
}

export type InsufficientCreditsKind = "generate" | "version";

export function insufficientCreditsError(
  locale: Locale,
  kind: InsufficientCreditsKind,
  vars?: { required?: string; balance?: string }
): string {
  const d = dict(locale);
  if (vars?.required != null && vars?.balance != null) {
    const detailKey =
      kind === "version"
        ? "errors.insufficientCreditsAltDetail"
        : "errors.insufficientCreditsDetail";
    const template = d[detailKey] ?? DICTS.en[detailKey] ?? "";
    return fill(template, { required: vars.required, balance: vars.balance });
  }
  const key = kind === "version" ? "errors.insufficientCreditsAlt" : "errors.insufficientCredits";
  return d[key] ?? DICTS.en[key] ?? key;
}

/** Map raw provider / SDK messages to localized user-facing copy. */
export function mapAiProviderError(locale: Locale, raw: string): string {
  const d = dict(locale);
  const m = raw.toLowerCase();

  if (m.includes("temperature") && (m.includes("deprecated") || m.includes("unsupported") || m.includes("not supported"))) {
    return d["errors.aiTemperatureUnsupported"] ?? DICTS.en["errors.aiTemperatureUnsupported"] ?? raw;
  }

  if (
    m.includes("insufficient") &&
    (m.includes("credit") || m.includes("balance") || m.includes("quota"))
  ) {
    return d["errors.insufficientCredits"] ?? DICTS.en["errors.insufficientCredits"] ?? raw;
  }

  const trimmed = raw.trim();
  if (trimmed.length > 0 && trimmed.length <= 280) return trimmed;
  return d["errors.generationFailed"] ?? DICTS.en["errors.generationFailed"] ?? "Generation failed.";
}
