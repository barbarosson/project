import type { ToolPayload } from "@/components/ai-suite/tools";

const STRIP_KEYS = new Set(["extra", "model", "locale", "leadEmail", "marketingFreeTrial"]);

/** Persist only tool input fields — never store prompt-injection `extra` or client model picks. */
export function sanitizeStoredRequestInput(payload: ToolPayload): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(payload as Record<string, unknown>) };
  for (const key of STRIP_KEYS) {
    delete out[key];
  }
  return out;
}
