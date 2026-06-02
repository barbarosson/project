import { NextResponse } from "next/server";

import { isToolName } from "@/components/ai-suite/tools";
import { saveAiFeedback, type FeedbackRating } from "@/lib/feedback/save-feedback";
import { enforceRateLimit } from "@/lib/rate-limit";
import { TOOL_INPUT_MAX_CHARS } from "@/lib/constants/input-limits";
import { feedbackRequiresAuth } from "@/lib/security/feedback-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  toolId?: string;
  originalText?: string;
  aiResponse?: string;
  rating?: string;
  modelUsed?: string;
  requestId?: string;
};

function isRating(value: string): value is FeedbackRating {
  return value === "up" || value === "down";
}

function clipField(value: string, max: number): string | null {
  const t = value.trim();
  if (!t) return null;
  return t.length <= max ? t : t.slice(0, max);
}

const FEEDBACK_TEXT_MAX = TOOL_INPUT_MAX_CHARS * 2;

export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, "feedback", 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many feedback submissions. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) } }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const toolId = typeof body.toolId === "string" ? body.toolId.trim() : "";
  if (!toolId || !isToolName(toolId)) {
    return NextResponse.json({ error: "Invalid or missing toolId." }, { status: 400 });
  }

  const ratingRaw = typeof body.rating === "string" ? body.rating.trim().toLowerCase() : "";
  if (!isRating(ratingRaw)) {
    return NextResponse.json({ error: "rating must be 'up' or 'down'." }, { status: 400 });
  }

  const originalText = clipField(
    typeof body.originalText === "string" ? body.originalText : "",
    FEEDBACK_TEXT_MAX
  );
  const aiResponse = clipField(typeof body.aiResponse === "string" ? body.aiResponse : "", FEEDBACK_TEXT_MAX);
  const modelUsed = clipField(typeof body.modelUsed === "string" ? body.modelUsed : "", 128);

  if (!originalText || !aiResponse || !modelUsed) {
    return NextResponse.json({ error: "originalText, aiResponse, and modelUsed are required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id ?? null;

  if (feedbackRequiresAuth() && !userId) {
    return NextResponse.json({ error: "Sign in to submit feedback.", code: "auth_required" }, { status: 401 });
  }

  const ownerType = userId ? ("user" as const) : null;
  const ownerId = userId;

  const requestId =
    typeof body.requestId === "string" && body.requestId.length >= 10 ? body.requestId.trim() : null;

  if (requestId && userId) {
    const admin = createSupabaseAdminClient();
    const { data: reqRow } = await admin
      .schema("isendai")
      .from("requests")
      .select("owner_type,owner_id")
      .eq("id", requestId)
      .maybeSingle();
    if (!reqRow || reqRow.owner_type !== "user" || reqRow.owner_id !== userId) {
      return NextResponse.json({ error: "Invalid request reference.", code: "forbidden" }, { status: 403 });
    }
  } else if (requestId && !userId) {
    return NextResponse.json({ error: "Sign in to link feedback to a request.", code: "auth_required" }, { status: 401 });
  }

  const result = await saveAiFeedback({
    toolId,
    originalText,
    aiResponse,
    rating: ratingRaw,
    modelUsed,
    ownerType,
    ownerId,
    requestId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
