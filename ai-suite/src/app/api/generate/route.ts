import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  billingAddRequestVersion,
  billingChargeAndCreateRequest,
  billingEnsureEntitlement,
} from "@/lib/isendai/billing-rpc";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";

import {
  TOOLS,
  getToolDefinition,
  type ProviderId,
  type ToolName,
  type ToolPayload,
} from "@/components/ai-suite/tools";
import {
  creditsForGeneration,
  modelMeta,
  defaultConcreteModelForProvider,
  parseRequestedModelId,
  resolveConcreteModelId,
} from "@/models/models";
import { EXTRA_INSTRUCTIONS_MAX_CHARS, TOOL_INPUT_MAX_CHARS } from "@/lib/constants/input-limits";
import {
  appendExtraInstructions,
  extraLengthError,
  normalizeExtra,
} from "@/lib/ai/extra-instructions";
import { generateTextGoogleWithFlashFallback } from "@/lib/ai/gemini-flash-fallback";
import {
  messageLooksLikeTemperatureUnsupported,
  withOptionalTemperature,
} from "@/lib/ai/generation-sampling";
import { buildExpertSystemPrompt } from "@/lib/ai/expert-system-prompt";
import { formatCreditsFromTenths } from "@/lib/credits-units";
import {
  generateOutOfScopeError,
  insufficientCreditsError,
  mapAiProviderError,
  parseApiLocale,
} from "@/lib/api-error-messages";
import { DICTS } from "@/i18n/dictionaries";
import { generationDebugHeaders } from "@/lib/security/api-debug-headers";
import { scopeByHeuristicsOnly } from "@/lib/security/scope-heuristics";
import { sanitizeStoredRequestInput } from "@/lib/security/stored-request-sanitize";
import {
  isDefineRelationshipIntent,
  isGiftMessageIntent,
  rankToolsForUserIntent,
} from "@/lib/intent-tool-routing";

type RequestBody = ToolPayload & { model?: string; extra?: string; locale?: string };

type ScopeResult = {
  in_scope: boolean;
  reason?: string;
  suggested_tool?: ToolName | "unknown";
};

function isToolName(value: string): value is ToolName {
  return TOOLS.some((t) => t.tool === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isToolPayload(value: unknown): value is RequestBody {
  if (!isRecord(value)) return false;
  const tool = value.tool;
  if (tool === "coverletter-ai")
    return typeof value.jobLink === "string" && typeof value.resume === "string";
  if (tool === "dating-roast")
    return typeof value.text === "string" || typeof value.profile === "string";
  // all other tools: require `text`
  return typeof value.text === "string";
}

function payloadLengthError(payload: ToolPayload): string | null {
  if (payload.tool === "coverletter-ai") {
    const p = payload as Extract<ToolPayload, { tool: "coverletter-ai" }>;
    if (p.jobLink.length > TOOL_INPUT_MAX_CHARS || p.resume.length > TOOL_INPUT_MAX_CHARS) {
      return `Each field must be at most ${TOOL_INPUT_MAX_CHARS} characters.`;
    }
  } else if (payload.tool === "dating-roast") {
    const s = "text" in payload ? payload.text : payload.profile;
    if (s.length > TOOL_INPUT_MAX_CHARS) {
      return `Input must be at most ${TOOL_INPUT_MAX_CHARS} characters.`;
    }
  } else if ("text" in payload && typeof payload.text === "string") {
    if (payload.text.length > TOOL_INPUT_MAX_CHARS) {
      return `Input must be at most ${TOOL_INPUT_MAX_CHARS} characters.`;
    }
  }
  return null;
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

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

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

function resolveModelOverride(
  body: RequestBody
):
  | { provider: ProviderId; client: typeof openai; model: string }
  | { provider: ProviderId; client: typeof anthropic; model: string }
  | { provider: ProviderId; client: ReturnType<typeof createOpenAI>; model: string }
  | { provider: ProviderId; client: typeof google; model: string }
  | null {
  if (typeof body.model !== "string") return null;
  const requested = parseRequestedModelId(body.model);
  if (requested === "auto") return null;
  const concrete = resolveConcreteModelId(requested);
  const meta = modelMeta(concrete);
  switch (meta.provider) {
    case "openai":
      return { provider: "openai", client: openai, model: meta.id };
    case "anthropic":
      return { provider: "anthropic", client: anthropic, model: meta.id };
    case "groq":
      return { provider: "groq", client: groq, model: meta.id };
    case "deepseek":
      return { provider: "deepseek", client: deepseek, model: meta.id };
    case "google":
      return { provider: "google", client: google, model: meta.id };
  }
}

function modelForProvider(provider: ProviderId) {
  const modelId = defaultConcreteModelForProvider(provider);
  switch (provider) {
    case "openai":
      return { client: openai, model: modelId };
    case "anthropic":
      return { client: anthropic, model: modelId };
    case "groq":
      return { client: groq, model: modelId };
    case "deepseek":
      return { client: deepseek, model: modelId };
    case "google":
      return { client: google, model: modelId };
  }
}

function pickProvider(payload: ToolPayload): ProviderId {
  return getToolDefinition(payload.tool).provider;
}

async function checkScope(payload: RequestBody): Promise<ScopeResult> {
  const tool = payload.tool;
  const def = getToolDefinition(tool);
  const rawInput = rawInputFor(payload);

  // Local heuristics to avoid over-blocking for obvious in-scope intents.
  // This is especially important when the user expresses the intent but doesn't
  // explicitly ask for the final artifact (e.g. "I want to quit" → resignation letter).
  if (tool === "graceful-quitter") {
    const t = rawInput.toLowerCase();
    const wantsQuit =
      /\b(quit|resign|resignation|two\s*weeks|notice|leaving|leave\s+my\s+job)\b/.test(t) ||
      /\b(istifa|ayrılmak|işten\s+ayrıl|iki\s+hafta\s+ihbar|ihbar\s+süresi)\b/.test(t);
    if (wantsQuit) return { in_scope: true };
  }

  if (tool === "awkward-text-fixer" && isGiftMessageIntent(rawInput)) {
    return { in_scope: true };
  }

  if (
    tool === "relationship-define-the-talk" &&
    isGiftMessageIntent(rawInput) &&
    !isDefineRelationshipIntent(rawInput)
  ) {
    return {
      in_scope: false,
      suggested_tool: "awkward-text-fixer",
    };
  }

  if (tool === "relationship-define-the-talk" && isDefineRelationshipIntent(rawInput)) {
    return { in_scope: true };
  }

  const allowed = [...TOOLS.map((t) => t.tool), "unknown"].join(", ");

  if (!hasProviderKey("openai")) {
    return scopeByHeuristicsOnly(tool, rawInput);
  }

  const system =
    "You are a scope classifier for a small AI tools suite.\n" +
    "Return ONLY valid JSON with keys: in_scope (boolean), reason (string), suggested_tool (string).\n" +
    `Allowed suggested_tool values: ${allowed}\n` +
    "IMPORTANT: Classify based on the user's INTENT and TOPIC, not the current tone or quality of writing.\n" +
    "Be permissive: if the selected tool can reasonably help with the user's intent, mark in_scope=true even if they didn't explicitly ask for the final artifact.\n" +
    'Example: graceful-quitter is IN SCOPE for "I want to quit" or "I\'m resigning" even if "write a resignation letter" is not stated.\n' +
    'Example: awkward-text-fixer is IN SCOPE for gift messages like "I want to buy you a gift but don\'t know what you want — tell me".\n' +
    "relationship-define-the-talk is ONLY for starting a define-the-relationship (what are we?) talk — NOT for gift shopping messages.\n" +
    "For corporate-whisperer specifically, rude/angry/unprofessional drafts are IN SCOPE.\n" +
    "Do not include any extra keys, markdown, or text.";

  const prompt =
    `Selected tool: ${tool}\n` +
    `Tool scope: ${def.scopeHint}\n\n` +
    "Decide whether the user's input is in scope for the selected tool.\n" +
    "If not, set in_scope=false and suggest the best tool (or unknown).\n\n" +
    `User input:\n${rawInput}`;

  const scopeModel = "gpt-4o-mini";
  const scopeSampling = withOptionalTemperature(scopeModel, 0);
  let content = "";
  try {
    const result = await generateText({
      model: openai(scopeModel),
      ...scopeSampling,
      system,
      prompt,
    });
    content = result.text?.trim() ?? "";
  } catch {
    const fallback = rankToolsForUserIntent(rawInput)[0];
    return {
      in_scope: false,
      suggested_tool: fallback ?? "unknown",
    };
  }

  try {
    const parsed = JSON.parse(content) as ScopeResult;
    if (typeof parsed?.in_scope !== "boolean") throw new Error("bad json");
    return {
      in_scope: parsed.in_scope,
      reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
      suggested_tool:
        typeof parsed.suggested_tool === "string" && isToolName(parsed.suggested_tool)
          ? parsed.suggested_tool
          : "unknown",
    };
  } catch {
    const fallback = rankToolsForUserIntent(rawInput)[0];
    return {
      in_scope: false,
      suggested_tool: fallback ?? "unknown",
    };
  }
}

function promptFor(payload: RequestBody) {
  const def = getToolDefinition(payload.tool);
  const extra = normalizeExtra(payload.extra);
  const withExtra = (base: string) => appendExtraInstructions(base, extra);
  switch (payload.tool) {
    case "corporate-whisperer":
      return { system: def.systemPrompt, user: withExtra(payload.text) };
    case "coverletter-ai":
      return {
        system: def.systemPrompt,
        user: withExtra(
          "jobLink" in payload && "resume" in payload
            ? `Job posting:\n${payload.jobLink}\n\nCandidate resume:\n${payload.resume}`
            : ""
        ),
      };
    case "dating-roast":
      return {
        system: def.systemPrompt,
        user: withExtra("text" in payload ? payload.text : payload.profile),
      };
    case "raise-negotiator":
      return {
        system:
          "You are The Raise Negotiator.\n" +
          "Write a persuasive, professional email requesting a raise or budget increase.\n" +
          "Use the user's achievements and quantified impact. Include: subject line, context, impact bullets, clear ask, and a proposed meeting.\n" +
          "Tone: confident, respectful, non-entitled.\n" +
          "Output only the email.",
        user: withExtra(payload.text),
      };
    case "graceful-quitter":
      return {
        system:
          "You are The Graceful Quitter.\n" +
          "Write a concise, professional resignation letter that preserves relationships.\n" +
          "Include: subject, resignation statement, last working day, gratitude, transition support.\n" +
          "Avoid oversharing or negativity.\n" +
          "Output only the letter.",
        user: withExtra(payload.text),
      };
    case "cold-dm-icebreaker":
      return {
        system:
          "You are The Cold DM Icebreaker.\n" +
          "Write a short, personalized networking message for LinkedIn/email that maximizes reply rate.\n" +
          "Constraints: 60–120 words, 1 clear ask, 1 personalization detail, zero fluff, no sleazy sales.\n" +
          "Output only the message.",
        user: withExtra(payload.text),
      };
    case "micromanager-tamer":
      return {
        system:
          "You are The Micromanager Tamer.\n" +
          "Write a polite but firm message that sets boundaries with a micromanager.\n" +
          "Include: empathy, clear boundary, suggested process (updates cadence), and a calm close.\n" +
          "Output only the message.",
        user: withExtra(payload.text),
      };
    case "invoice-chaser":
      return {
        system:
          "You are The Invoice Chaser.\n" +
          "Write a professional overdue invoice reminder email.\n" +
          "Include: invoice reference, amount, due date, payment link/request, and a firm but friendly tone.\n" +
          "Avoid shaming; include next step if unpaid.\n" +
          "Output only the email.",
        user: withExtra(payload.text),
      };
    case "perfect-apology":
      return {
        system:
          "You are The Perfect Apology.\n" +
          "Write a no-excuses apology that takes responsibility.\n" +
          "Include: acknowledgement, ownership, impact, repair plan, and invitation to respond.\n" +
          "No blame, no 'if you felt'. Output only the text.",
        user: withExtra(payload.text),
      };
    case "refund-demander":
      return {
        system:
          "You are The Refund Demander.\n" +
          "Write a formal, assertive refund/compensation request.\n" +
          "Include: order details, timeline, what went wrong, what you want, a reasonable deadline, and mention consumer rights in general terms.\n" +
          "Professional, calm, firm. Output only the email.",
        user: withExtra(payload.text),
      };
    case "deadline-diplomat":
      return {
        system:
          "You are The Deadline Diplomat.\n" +
          "Write a professional extension request that protects credibility.\n" +
          "Include: current status, reason (without excuses), revised timeline, risk mitigation, and next update date.\n" +
          "Output only the message/email.",
        user: withExtra(payload.text),
      };
    case "landlord-diplomat":
      return {
        system:
          "You are The Landlord Diplomat.\n" +
          "Write a diplomatic negotiation message for a landlord/tenant dispute.\n" +
          "Be legally-aware but not giving legal advice; focus on facts, dates, reasonable requests, and de-escalation.\n" +
          "Output only the message.",
        user: withExtra(payload.text),
      };
    case "review-retaliator":
      return {
        system:
          "You are The Review Retaliator.\n" +
          "Write a calm, professional reply to an unfair negative review.\n" +
          "Acknowledge feelings, state facts without arguing, offer a resolution path, protect brand voice.\n" +
          "Output only the public reply.",
        user: withExtra(payload.text),
      };
    case "ghosting-resurrector":
      return {
        system:
          "You are The Ghosting Resurrector.\n" +
          "Write 3 short follow-up texts to revive a conversation without pressure.\n" +
          "Constraints: each under 160 characters, light tone, no guilt-tripping.\n" +
          "Output only the 3 messages, numbered 1-3.",
        user: withExtra(payload.text),
      };
    case "passive-aggressive-decoder":
      return {
        system:
          "You are The Passive-Aggressive Decoder.\n" +
          "First, explain the likely subtext in 2-4 bullets.\n" +
          "Then write 2 smart reply options: one neutral, one firm.\n" +
          "No escalation, no insults.\n" +
          "Output format:\nSubtext:\n- ...\nReply A:\n...\nReply B:\n...",
        user: withExtra(payload.text),
      };
    case "guilt-free-no":
      return {
        system:
          "You are The Guilt-Free \"No\".\n" +
          "Write 3 refusal message options: soft, direct, and very direct.\n" +
          "Be kind, clear, and final. No overexplaining.\n" +
          "Output only the 3 options, labeled Soft/Direct/Very direct.",
        user: withExtra(payload.text),
      };
    case "delicate-truth":
      return {
        system:
          "You are The Delicate Truth.\n" +
          "Rewrite a difficult truth into a gentle, non-blaming message.\n" +
          "Use 'I' statements, focus on behavior and impact, propose a path forward.\n" +
          "Output only the message.",
        user: withExtra(payload.text),
      };
    case "co-parenting-peacemaker":
      return {
        system:
          "You are The Co-Parenting Peacemaker.\n" +
          "Rewrite the message to be neutral, logistics-only, and conflict-minimizing.\n" +
          "Remove emotion, accusations, sarcasm. Keep dates, times, responsibilities.\n" +
          "Output only the message.",
        user: withExtra(payload.text),
      };
    case "friendzone-navigator":
      return {
        system:
          "You are The Friendzone Navigator.\n" +
          "Write a careful message to confess feelings or set boundaries while preserving friendship.\n" +
          "Be respectful, clear, and low-pressure. Include an easy out.\n" +
          "Output only the message.",
        user: withExtra(payload.text),
      };
    case "rsvp-diplomat":
      return {
        system:
          "You are The RSVP Diplomat.\n" +
          "Write a warm, respectful decline for an important invitation without drama.\n" +
          "Include: gratitude, clear decline, brief reason (optional), and well-wishes.\n" +
          "Output only the message.",
        user: withExtra(payload.text),
      };
    default: {
      if (payload.tool === "coverletter-ai" && "jobLink" in payload && "resume" in payload) {
        return {
          system: def.systemPrompt,
          user: withExtra(`Job posting:\n${payload.jobLink}\n\nCandidate resume:\n${payload.resume}`),
        };
      }
      const text =
        payload.tool === "dating-roast"
          ? "text" in payload
            ? payload.text
            : payload.profile
          : "text" in payload
            ? payload.text
            : "";
      return { system: def.systemPrompt, user: withExtra(text) };
    }
  }
}

export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return NextResponse.json(
      { error: DICTS.en["errors.invalidJson"], code: "invalid_json" },
      { status: 400 }
    );
  }

  const locale = isRecord(body) ? parseApiLocale(body.locale) : "en";

  if (!isToolPayload(body)) {
    return NextResponse.json(
      { error: DICTS[locale]["errors.invalidPayload"], code: "invalid_payload" },
      { status: 400 }
    );
  }

  const lenErr = payloadLengthError(body);
  if (lenErr) {
    const max = String(TOOL_INPUT_MAX_CHARS);
    return NextResponse.json(
      {
        error: DICTS[locale]["errors.inputTooLong"].replace("{max}", max),
        code: "input_too_long",
      },
      { status: 400 }
    );
  }

  const extraNorm = normalizeExtra((body as RequestBody).extra);
  if (extraLengthError(extraNorm)) {
    const max = String(EXTRA_INSTRUCTIONS_MAX_CHARS);
    return NextResponse.json(
      {
        error: (DICTS[locale]["errors.extraTooLong"] ?? DICTS.en["errors.extraTooLong"]).replace(
          "{max}",
          max
        ),
        code: "extra_too_long",
      },
      { status: 400 }
    );
  }

  const rpm = Math.min(300, Math.max(10, Number(process.env.ISENDAI_GENERATE_RPM ?? "60")));
  const rl = await enforceRateLimit(req, "generate", rpm, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: DICTS[locale]["errors.rateLimit"],
        code: "rate_limited",
      },
      { status: 429, headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const { system: baseSystem, user } = promptFor(body);
  const system = buildExpertSystemPrompt(body.tool, baseSystem, {
    locale,
    userText: user,
  });
  const override = resolveModelOverride(body);
  const provider = override?.provider ?? pickProvider(body);
  const { client, model } = override ?? modelForProvider(provider);
  const requestedModel = parseRequestedModelId(
    typeof (body as RequestBody).model === "string" ? (body as RequestBody).model : undefined
  );
  const concreteForCredits = resolveConcreteModelId(requestedModel);
  const creditCost = creditsForGeneration(concreteForCredits, user.length);
  let debugHeaders = generationDebugHeaders({
    provider,
    model,
    creditsRequired: formatCreditsFromTenths(creditCost),
  });

  if (!hasProviderKey(provider)) {
    const env = providerKeyName(provider);
    return NextResponse.json(
      {
        error: `AI is not configured: add ${env} to .env.local (or deployment secrets) and restart the dev server.`,
        code: "missing_api_key",
        provider,
        env,
      },
      { status: 503, headers: debugHeaders }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to generate messages.", code: "auth_required" },
        { status: 401, headers: { ...debugHeaders, "cache-control": "no-store" } }
      );
    }
    const ownerType = "user" as const;
    const ownerId = userId;

    // Ensure entitlement row exists (credit top-ups are handled elsewhere).
    const admin = createSupabaseAdminClient();
    const { error: entErr } = await billingEnsureEntitlement(admin, {
      p_owner_type: ownerType,
      p_owner_id: ownerId,
      p_default_credits: 0,
      p_default_max_versions: 9999,
    });
    if (entErr) {
      return NextResponse.json(
        {
          error: `Billing error: ${entErr.message}`,
          code: "billing_error",
        },
        { status: 503, headers: debugHeaders }
      );
    }

    // (2) Hard gate: block out-of-scope inputs before generation.
    const scope = await checkScope(body);
    if (!scope.in_scope) {
      const suggested =
        scope.suggested_tool && scope.suggested_tool !== "unknown"
          ? scope.suggested_tool
          : isGiftMessageIntent(rawInputFor(body))
            ? "awkward-text-fixer"
            : undefined;
      const giftMismatch =
        body.tool === "relationship-define-the-talk" && isGiftMessageIntent(rawInputFor(body));

      // If the classifier says "out of scope" but its own suggested tool equals the tool
      // the user selected, treat it as classifier uncertainty and do not block generation.
      // This prevents contradictory UX like: "Try X" while the user is already trying X.
      if (suggested === body.tool) {
        console.warn(
          `[scope] classifier mismatch rejected but suggested same tool; allowing generation. tool=${body.tool}`
        );
      } else {
      return NextResponse.json(
        {
          error: generateOutOfScopeError(locale, body.tool, {
            suggestedTool: suggested,
            giftMismatch,
          }),
          code: "out_of_scope",
          suggested_tool: suggested,
        },
        { status: 400, headers: debugHeaders }
      );
      }
    }

    const inputJson = sanitizeStoredRequestInput(body);

    // Charge credits (amount from creditsForGeneration) and create request row BEFORE generation.
    // If this fails (insufficient credits), we stop early.

    const { data: requestId, error: chargeErr } = await billingChargeAndCreateRequest(admin, {
      p_owner_type: ownerType,
      p_owner_id: ownerId,
      p_tool_id: body.tool,
      p_model_id: model,
      p_input_json: inputJson,
      p_price_paid_usd: null,
      p_credit_cost: creditCost,
    });
    if (chargeErr) {
      const msg = String(chargeErr.message || "");
      if (msg.includes("insufficient_credits")) {
        const { data: balRow } = await admin
          .schema("isendai")
          .from("entitlements")
          .select("credits_balance")
          .eq("owner_type", "user")
          .eq("owner_id", ownerId)
          .maybeSingle();
        const required = formatCreditsFromTenths(creditCost);
        const balance = formatCreditsFromTenths(balRow?.credits_balance ?? 0);
        return NextResponse.json(
          {
            error: insufficientCreditsError(locale, "generate", { required, balance }),
            code: "insufficient_credits",
            credits_required: required,
            credits_balance: balance,
          },
          { status: 402, headers: debugHeaders }
        );
      }
      return NextResponse.json(
        {
          error: msg.length > 0 ? `Billing error: ${msg}` : "Billing error (database).",
          code: "billing_error",
        },
        { status: 503, headers: debugHeaders }
      );
    }

    if (!requestId) {
      return NextResponse.json(
        {
          error: "Billing error: could not create request row.",
          code: "billing_error",
        },
        { status: 503, headers: debugHeaders }
      );
    }

    let usedGeminiFlashFallback = false;
    let out: Awaited<ReturnType<typeof generateText>>;
    if (provider === "google") {
      const { result, usedFlashFallback } = await generateTextGoogleWithFlashFallback(model, {
        temperature: 0.6,
        system,
        prompt: user,
      });
      out = result;
      usedGeminiFlashFallback = usedFlashFallback;
    } else {
      try {
        out = await generateText({
          model: client(model),
          ...withOptionalTemperature(model, 0.6),
          system,
          prompt: user,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!messageLooksLikeTemperatureUnsupported(msg)) throw e;
        // Some endpoints reject temperature even when the SDK accepts it; retry once without it.
        out = await generateText({
          model: client(model),
          system,
          prompt: user,
        });
      }
    }

    if (usedGeminiFlashFallback) {
      debugHeaders = generationDebugHeaders({
        provider,
        model,
        creditsRequired: formatCreditsFromTenths(creditCost),
        extra: { "x-ai-gemini-flash-fallback": "1" },
      });
    }

    const text = out.text?.trim();
    if (!text) {
      return NextResponse.json(
        { error: "Empty response from model." },
        { status: 502, headers: debugHeaders }
      );
    }

    // Store version 1 for history
    const { error: verErr } = await billingAddRequestVersion(admin, {
      p_request_id: requestId,
      p_text: text,
    });
    if (verErr) {
      return NextResponse.json(
        {
          error: `Billing error: ${verErr.message}`,
          code: "billing_error",
        },
        { status: 503, headers: debugHeaders }
      );
    }

    const response = NextResponse.json(
      { result: text, request_id: requestId, owner: { type: ownerType, id: ownerId } },
      {
        headers: {
          "cache-control": "no-store",
          ...debugHeaders,
        },
      }
    );
    return response;
  } catch (e) {
    const raw = e instanceof Error ? e.message : "AI request failed.";
    return NextResponse.json(
      { error: mapAiProviderError(locale, raw), code: "ai_failed" },
      { status: 502, headers: debugHeaders }
    );
  }
}

