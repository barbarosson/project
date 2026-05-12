import { generateText } from "ai";
import { google } from "@ai-sdk/google";

/** Model id passed to `@ai-sdk/google` when the requested Gemini hits API quota / free-tier blocks. */
export const GEMINI_FLASH_FALLBACK_ID = "gemini-2.5-flash";

/**
 * Detects Google Generative Language quota / billing errors (incl. free tier limit 0 for Pro).
 * isendai credits are unrelated — this is the upstream Gemini API account.
 */
export function messageLooksLikeGeminiApiQuotaExhausted(message: string): boolean {
  const m = message.toLowerCase();
  const looksGemini = m.includes("gemini") || m.includes("generativelanguage") || m.includes("google");
  if (!looksGemini) return false;
  return (
    m.includes("quota") ||
    m.includes("resource exhausted") ||
    m.includes("exceeded your current quota") ||
    m.includes("billing")
  );
}

type GeminiFlashFallbackArgs = {
  temperature?: number;
  system?: string;
  prompt: string;
};

/**
 * Runs `generateText` with `google(googleModelId)`. On Gemini quota errors, retries once with Flash
 * (usually available on the free tier when Pro is not).
 */
export async function generateTextGoogleWithFlashFallback(
  googleModelId: string,
  args: GeminiFlashFallbackArgs
): Promise<{ result: Awaited<ReturnType<typeof generateText>>; usedFlashFallback: boolean }> {
  const primaryId =
    googleModelId && googleModelId.trim().length > 0 ? googleModelId.trim() : GEMINI_FLASH_FALLBACK_ID;

  try {
    const result = await generateText({
      model: google(primaryId),
      temperature: args.temperature,
      system: args.system,
      prompt: args.prompt,
    });
    return { result, usedFlashFallback: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      primaryId !== GEMINI_FLASH_FALLBACK_ID &&
      messageLooksLikeGeminiApiQuotaExhausted(msg)
    ) {
      const result = await generateText({
        model: google(GEMINI_FLASH_FALLBACK_ID),
        temperature: args.temperature,
        system: args.system,
        prompt: args.prompt,
      });
      return { result, usedFlashFallback: true };
    }
    throw e;
  }
}
