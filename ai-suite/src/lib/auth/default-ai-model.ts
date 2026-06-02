import {
  DEFAULT_MODEL,
  isModelId,
  normalizeUserModelId,
  type ModelId,
} from "@/models/models";

/** Supabase Auth `user_metadata` key for membership default AI tier. */
export const DEFAULT_AI_MODEL_METADATA_KEY = "default_ai_model";

export function readDefaultAiModelFromMetadata(meta: unknown): ModelId {
  if (!meta || typeof meta !== "object") return DEFAULT_MODEL;
  const raw = (meta as Record<string, unknown>)[DEFAULT_AI_MODEL_METADATA_KEY];
  if (typeof raw !== "string" || !raw.trim()) return DEFAULT_MODEL;
  const normalized = normalizeUserModelId(raw.trim());
  return isModelId(normalized) ? normalized : DEFAULT_MODEL;
}

/** Per-tool localStorage wins; otherwise use membership profile default. */
export function resolveToolModelPreference(
  storedRaw: string | null | undefined,
  profileDefault: ModelId
): ModelId {
  if (storedRaw && storedRaw.trim()) {
    const normalized = normalizeUserModelId(storedRaw.trim());
    return isModelId(normalized) ? normalized : profileDefault;
  }
  return profileDefault;
}
