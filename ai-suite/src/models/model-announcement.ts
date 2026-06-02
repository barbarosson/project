import { MODELS, type ConcreteModelId } from "@/models/models";

/**
 * Single source of truth for the "new AI version" announcement.
 *
 * To roll out a new flagship and notify everyone instantly:
 *   1. Add the model to `models-catalog-base.ts` (and `salesPriceForModel` in `models.ts`).
 *   2. Point the relevant tier in `config/model-catalog.json` → `tierModels`.
 *   3. Bump `version` and update `modelId` / `releasedOn` below.
 *
 * The popup keys its "seen" state on `version`, so bumping it re-announces to
 * every user on their next load — no per-user reset needed.
 */
export type ModelAnnouncement = {
  /** Increment whenever you want to re-announce (drives the dismiss key). */
  version: string;
  /** Catalog model id this announcement is about. */
  modelId: ConcreteModelId;
  /** ISO date (display only). */
  releasedOn: string;
  /** Which user-facing tier now runs this model (for copy). */
  tier: "fast-ai" | "pro-ai" | "genius-ai";
};

export const LATEST_MODEL_ANNOUNCEMENT: ModelAnnouncement = {
  version: "2026-06-02-opus-4-8",
  modelId: "claude-opus-4-8",
  releasedOn: "2026-06-02",
  tier: "genius-ai",
};

/** Human-readable model name (without provider prefix), derived from the catalog. */
export function announcementModelName(): string {
  const found = MODELS.find((m) => m.id === LATEST_MODEL_ANNOUNCEMENT.modelId);
  const label = found?.label ?? LATEST_MODEL_ANNOUNCEMENT.modelId;
  const sep = " · ";
  const i = label.indexOf(sep);
  return i >= 0 ? label.slice(i + sep.length) : label;
}

export function modelAnnouncementStorageKey(): string {
  return `ai-suite:model-announce:${LATEST_MODEL_ANNOUNCEMENT.version}`;
}
