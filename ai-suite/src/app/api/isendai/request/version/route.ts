import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

import { getToolDefinition, type ProviderId, type ToolPayload } from "@/components/ai-suite/tools";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { billingAddRequestVersion } from "@/lib/isendai/billing-rpc";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAnonId } from "@/lib/isendai/owner";
import { isConcreteModelId, modelMeta } from "@/models/models";
import { enforceRateLimit } from "@/lib/rate-limit";

type Body = {
  request_id?: string;
  extra?: string;
};

function providerKeyName(provider: ProviderId) {
  switch (provider) {
    case "openai":
      return "OPENAI_API_KEY";
    case "anthropic":
      return "ANTHROPIC_API_KEY";
    case "groq":
      return "GROQ_API_KEY";
    case "deepseek":
      return "DEEPSEEK_API_KEY";
    case "google":
      return "GOOGLE_GENERATIVE_AI_API_KEY";
  }
}

function hasProviderKey(provider: ProviderId) {
  const key = providerKeyName(provider);
  return typeof process.env[key] === "string" && process.env[key]!.trim().length > 0;
}

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

function modelFor(provider: ProviderId, modelId: string) {
  switch (provider) {
    case "openai":
      return openai(modelId);
    case "anthropic":
      return anthropic(modelId);
    case "groq":
      return groq(modelId);
    case "deepseek":
      return deepseek(modelId);
    case "google":
      return google(modelId);
  }
}

function rawInputFor(payload: ToolPayload) {
  const tool = payload.tool;
  if (tool === "coverletter-ai" && "jobLink" in payload && "resume" in payload) {
    return `Job posting:\n${payload.jobLink}\n\nResume:\n${payload.resume}`;
  }
  if (tool === "dating-roast") {
    return "text" in payload ? payload.text : payload.profile;
  }
  return "text" in payload ? payload.text : "";
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const requestId = body?.request_id;
  if (!requestId || typeof requestId !== "string") {
    return NextResponse.json({ error: "Missing request_id." }, { status: 400 });
  }
  const extra = typeof body?.extra === "string" ? body.extra.trim() : "";

  const rpm = Math.min(300, Math.max(10, Number(process.env.ISENDAI_VERSION_RPM ?? "90")));
  const rl = enforceRateLimit(req, "request-version", rpm, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and try again.", code: "rate_limited" },
      { status: 429, headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  // Resolve owner
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id ?? null;
  const ownerType: "user" | "anon" = userId ? "user" : "anon";
  const ownerId = userId ?? (await getOrCreateAnonId());

  const admin = createSupabaseAdminClient();
  const { data: reqRow, error: reqErr } = await admin
    .schema("isendai")
    .from("requests")
    .select("id,owner_type,owner_id,tool_id,model_id,input_json,max_versions")
    .eq("id", requestId)
    .maybeSingle();
  if (reqErr || !reqRow) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  if (reqRow.owner_type !== ownerType || reqRow.owner_id !== ownerId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Parse original payload
  const inputJson = reqRow.input_json as any;
  if (!inputJson || typeof inputJson !== "object" || typeof inputJson.tool !== "string") {
    return NextResponse.json({ error: "Stored input missing." }, { status: 500 });
  }
  const payload = inputJson as ToolPayload;
  const toolId = reqRow.tool_id as ToolPayload["tool"];
  if (payload.tool !== toolId) {
    return NextResponse.json({ error: "Stored input mismatch." }, { status: 500 });
  }

  const def = getToolDefinition(payload.tool as any);
  const modelId = String(reqRow.model_id || "");
  const provider: ProviderId =
    isConcreteModelId(modelId) ? (modelMeta(modelId as any).provider as ProviderId) : def.provider;

  if (!hasProviderKey(provider)) {
    const env = providerKeyName(provider);
    return NextResponse.json(
      {
        error: `AI is not configured: add ${env} to .env.local (or deployment secrets) and restart the dev server.`,
        code: "missing_api_key",
        provider,
        env,
      },
      { status: 503 }
    );
  }

  const base = rawInputFor(payload);
  const prompt =
    extra.length > 0 ? `${base}\n\nExtra instructions (apply on top of the tool):\n${extra}` : base;

  // Generate
  const out = await generateText({
    model: modelFor(provider, modelId || def.model || "gpt-4o-mini"),
    temperature: 0.6,
    system: def.systemPrompt,
    prompt,
  });
  const text = out.text?.trim();
  if (!text) return NextResponse.json({ error: "Empty response." }, { status: 502 });

  const { data: idx, error: addErr } = await billingAddRequestVersion(admin, {
    p_request_id: requestId,
    p_text: text,
  });
  if (addErr) {
    const msg = String(addErr.message || "");
    if (msg.includes("version_limit_reached")) {
      return NextResponse.json({ error: "Version limit reached." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to save version." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request_id: requestId, idx, text });
}

