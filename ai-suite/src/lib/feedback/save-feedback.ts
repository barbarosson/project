import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export type FeedbackRating = "up" | "down";

export type SaveFeedbackInput = {
  toolId: string;
  originalText: string;
  aiResponse: string;
  rating: FeedbackRating;
  modelUsed: string;
  ownerType?: "user" | "anon" | null;
  ownerId?: string | null;
  requestId?: string | null;
};

const MAX_TEXT = 50_000;

function clip(s: string): string {
  const t = s.trim();
  if (t.length <= MAX_TEXT) return t;
  return t.slice(0, MAX_TEXT);
}

async function insertWithAdmin(
  admin: SupabaseClient,
  row: Record<string, unknown>
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data, error } = await admin
    .schema("isendai")
    .from("ai_feedback")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[feedback] Supabase insert failed:", error.message);
    }
    return { ok: false, error: error.message };
  }

  const id = typeof data?.id === "string" ? data.id : "";
  return { ok: true, id };
}

/**
 * Persists thumbs-up/down feedback for the AI feedback loop.
 * Falls back to structured console logging when DB/admin is unavailable.
 */
export async function saveAiFeedback(input: SaveFeedbackInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = {
    tool_id: input.toolId.trim(),
    original_text: clip(input.originalText),
    ai_response: clip(input.aiResponse),
    rating: input.rating,
    model_used: input.modelUsed.trim().slice(0, 128),
    owner_type: input.ownerType ?? null,
    owner_id: input.ownerId ?? null,
    request_id: input.requestId ?? null,
  };

  const admin = createSupabaseAdminClientOrNull();
  if (!admin) {
    // TODO: Remove stub once SUPABASE_SERVICE_ROLE_KEY is set in all environments.
    console.log("[feedback stub]", JSON.stringify({ ...row, saved: false, reason: "no_admin_client" }));
    return { ok: true };
  }

  const result = await insertWithAdmin(admin, row);
  if (result.ok) return { ok: true };

  // Table may not exist until migration is applied — log for ops, don't block UX.
  console.log("[feedback stub]", JSON.stringify({ ...row, saved: false, dbError: result.error }));
  return { ok: true };
}
