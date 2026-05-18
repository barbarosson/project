import {
  DEFAULT_MODEL,
  isModelId,
  isUserFacingModelId,
  normalizeUserModelId,
  type ModelId,
  type UserFacingModelId,
} from "@/models/models";

/** Supabase Auth `user_metadata` key for membership default AI tier. */
export const DEFAULT_AI_MODEL_METADATA_KEY = "default_ai_model";

export function readDefaultAiModelFromMetadata(meta: unknown): UserFacingModelId {
  if (!meta || typeof meta !== "object") return DEFAULT_MODEL as UserFacingModelId;
  const raw = (meta as Record<string, unknown>)[DEFAULT_AI_MODEL_METADATA_KEY];
  if (typeof raw !== "string" || !raw.trim()) return DEFAULT_MODEL as UserFacingModelId;
  const normalized = normalizeUserModelId(raw.trim());
  return isUserFacingModelId(normalized) ? normalized : (DEFAULT_MODEL as UserFacingModelId);
}

/** Per-tool localStorage wins; otherwise use membership profile default. */
export function resolveToolModelPreference(
  storedRaw: string | null | undefined,
  profileDefault: UserFacingModelId
): ModelId {
  if (storedRaw && storedRaw.trim()) {
    const normalized = normalizeUserModelId(storedRaw.trim());
    return isModelId(normalized) ? normalized : profileDefault;
  }
  return profileDefault;
}
