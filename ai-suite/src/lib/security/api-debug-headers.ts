/** Response headers for generation routes — omit provider/model in production unless explicitly enabled. */
export function generationDebugHeaders(opts: {
  provider: string;
  model: string;
  creditsRequired: string;
  extra?: Record<string, string>;
}): Record<string, string> {
  const base: Record<string, string> = { "cache-control": "no-store" };
  const verbose =
    process.env.NODE_ENV !== "production" || process.env.ISENDAI_DEBUG_HEADERS === "1";
  if (!verbose) {
    return { ...base, ...opts.extra };
  }
  return {
    ...base,
    "x-ai-provider": opts.provider,
    "x-ai-model": opts.model,
    "x-credits-required": opts.creditsRequired,
    ...opts.extra,
  };
}
