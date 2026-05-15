import { NextResponse } from "next/server";

import { isToolName } from "@/components/ai-suite/tools";
import { saveAiFeedback, type FeedbackRating } from "@/lib/feedback/save-feedback";
import { enforceRateLimit } from "@/lib/rate-limit";
import { TOOL_INPUT_MAX_CHARS } from "@/lib/constants/input-limits";
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

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "feedback", 40, 60_000);
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

  const originalText = clipField(typeof body.originalText === "string" ? body.originalText : "", TOOL_INPUT_MAX_CHARS * 4);
  const aiResponse = clipField(typeof body.aiResponse === "string" ? body.aiResponse : "", TOOL_INPUT_MAX_CHARS * 4);
  const modelUsed = clipField(typeof body.modelUsed === "string" ? body.modelUsed : "", 128);

  if (!originalText || !aiResponse || !modelUsed) {
    return NextResponse.json({ error: "originalText, aiResponse, and modelUsed are required." }, { status: 400 });
  }

  let ownerType: "user" | "anon" | null = null;
  let ownerId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user?.id) {
      ownerType = "user";
      ownerId = data.user.id;
    }
  } catch {
    /* anonymous feedback is allowed */
  }

  const requestId =
    typeof body.requestId === "string" && body.requestId.length >= 10 ? body.requestId.trim() : null;

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
