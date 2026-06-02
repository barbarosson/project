import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

import {
  getToolDefinition,
  isToolName,
  type ProviderId,
  type ToolPayload,
} from "@/components/ai-suite/tools";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { billingAddRequestVersion, billingDeductCredits } from "@/lib/isendai/billing-rpc";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  creditsForGeneration,
  modelMeta,
  parseRequestedModelId,
  resolveConcreteModelId,
} from "@/models/models";
import { formatCreditsFromTenths } from "@/lib/credits-units";
import { appendExtraInstructions, extraLengthError, normalizeExtra } from "@/lib/ai/extra-instructions";
import { EXTRA_INSTRUCTIONS_MAX_CHARS } from "@/lib/constants/input-limits";
import { enforceRateLimit } from "@/lib/rate-limit";
import { generateTextGoogleWithFlashFallback } from "@/lib/ai/gemini-flash-fallback";
import {
  messageLooksLikeTemperatureUnsupported,
  withOptionalTemperature,
} from "@/lib/ai/generation-sampling";
import { buildExpertSystemPrompt } from "@/lib/ai/expert-system-prompt";
import {
  insufficientCreditsError,
  mapAiProviderError,
  parseApiLocale,
} from "@/lib/api-error-messages";

type Body = {
  request_id?: string;
  extra?: string;
  /** Optional user-facing tier override for this alternative (fast-ai | pro-ai | genius-ai). */
  model?: string;
  locale?: string;
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
  const extra = normalizeExtra(body?.extra);
  const requestedModel = typeof body?.model === "string" ? body.model.trim() : "";
  const locale = parseApiLocale(body?.locale);

  if (extraLengthError(extra)) {
    return NextResponse.json(
      {
        error: `Extra instructions must be at most ${EXTRA_INSTRUCTIONS_MAX_CHARS} characters.`,
        code: "extra_too_long",
      },
      { status: 400 }
    );
  }

  const rpm = Math.min(300, Math.max(10, Number(process.env.ISENDAI_VERSION_RPM ?? "90")));
  const rl = await enforceRateLimit(req, "request-version", rpm, 60_000);
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
  if (!userId) {
    return NextResponse.json({ error: "Sign in required.", code: "auth_required" }, { status: 401 });
  }
  const ownerType = "user" as const;
  const ownerId = userId;

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
  const rawInput = reqRow.input_json as unknown;
  if (!rawInput || typeof rawInput !== "object" || rawInput === null) {
    return NextResponse.json({ error: "Stored input missing." }, { status: 500 });
  }
  const toolField = (rawInput as Record<string, unknown>).tool;
  if (typeof toolField !== "string" || !isToolName(toolField)) {
    return NextResponse.json({ error: "Stored input missing." }, { status: 500 });
  }
  const payload = rawInput as ToolPayload;
  const toolId = reqRow.tool_id as ToolPayload["tool"];
  if (payload.tool !== toolId) {
    return NextResponse.json({ error: "Stored input mismatch." }, { status: 500 });
  }

  const def = getToolDefinition(toolField);
  // Prefer the model the user picked for this alternative; fall back to the original request's model.
  const modelId = requestedModel || String(reqRow.model_id || "");
  const concreteForRun = resolveConcreteModelId(parseRequestedModelId(modelId));
  const provider: ProviderId = modelMeta(concreteForRun).provider as ProviderId;

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
  const prompt = appendExtraInstructions(base, extra);
  const system = buildExpertSystemPrompt(toolField, def.systemPrompt, {
    locale,
    userText: prompt,
  });

  const creditCost = creditsForGeneration(concreteForRun, prompt.length);

  const { error: deductErr } = await billingDeductCredits(admin, {
    p_owner_type: ownerType,
    p_owner_id: ownerId,
    p_amount: creditCost,
  });
  if (deductErr) {
    const msg = String(deductErr.message || "");
    if (msg.includes("insufficient_credits")) {
      const { data: balRow } = await admin
        .schema("isendai")
        .from("entitlements")
        .select("credits_balance")
        .eq("owner_type", ownerType)
        .eq("owner_id", ownerId)
        .maybeSingle();
      const required = formatCreditsFromTenths(creditCost);
      const balance = formatCreditsFromTenths(balRow?.credits_balance ?? 0);
      return NextResponse.json(
        {
          error: insufficientCreditsError(locale, "version", { required, balance }),
          code: "insufficient_credits",
          credits_required: required,
          credits_balance: balance,
        },
        { status: 402 }
      );
    }
    return NextResponse.json({ error: "Billing error." }, { status: 503 });
  }

  let out: Awaited<ReturnType<typeof generateText>>;
  try {
    if (provider === "google") {
      const mid = concreteForRun;
      const { result } = await generateTextGoogleWithFlashFallback(mid, {
        temperature: 0.85,
        system,
        prompt,
      });
      out = result;
    } else {
      try {
        out = await generateText({
          model: modelFor(provider, concreteForRun),
          ...withOptionalTemperature(concreteForRun, 0.85),
          system,
          prompt,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!messageLooksLikeTemperatureUnsupported(msg)) throw e;
        out = await generateText({
          model: modelFor(provider, concreteForRun),
          system,
          prompt,
        });
      }
    }
  } catch (e) {
    const raw = e instanceof Error ? e.message : "AI request failed.";
    return NextResponse.json(
      { error: mapAiProviderError(locale, raw), code: "ai_failed" },
      { status: 502 }
    );
  }
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

