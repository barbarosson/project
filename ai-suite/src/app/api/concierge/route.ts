import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import OpenAI from "openai";

import { TOOLS, type ProviderId, type ToolName } from "@/components/ai-suite/tools";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { resolveToolDescription, resolveToolTitle } from "@/i18n/tool-copy-resolve";
import { conciergeError, parseApiLocale } from "@/lib/api-error-messages";
import { humanVoiceDirective } from "@/lib/ai/writing-style";
import {
  extractLeakedSuggestedTools,
  parseConciergeModelOutput,
  parseConciergeProseFallback,
  sanitizeConciergeReplyText,
} from "@/lib/concierge-parse";
import { finalizeConciergeSuggestions } from "@/lib/concierge-suggestions";
import { looksLikeToolableMessageRequest, rankToolsForUserIntent } from "@/lib/intent-tool-routing";
import { isConcreteModelId, modelMeta, type ModelId } from "@/models/models";
import { conciergeRequiresAuth } from "@/lib/concierge-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_CONCIERGE_MESSAGES = 24;
const MAX_CONCIERGE_TOTAL_CHARS = 8000;

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

function resolveConciergeLanguageModel(modelId: ModelId): {
  provider: ProviderId;
  model:
    | ReturnType<typeof openai>
    | ReturnType<typeof anthropic>
    | ReturnType<typeof groq>
    | ReturnType<typeof deepseek>
    | ReturnType<typeof google>;
} | null {
  if (modelId === "auto") {
    return { provider: "openai", model: openai("gpt-4o-mini") };
  }
  if (!isConcreteModelId(modelId)) return null;
  const meta = modelMeta(modelId);
  switch (meta.provider) {
    case "openai":
      return { provider: "openai", model: openai(meta.id) };
    case "anthropic":
      return { provider: "anthropic", model: anthropic(meta.id) };
    case "groq":
      return { provider: "groq", model: groq(meta.id) };
    case "deepseek":
      return { provider: "deepseek", model: deepseek(meta.id) };
    case "google":
      return { provider: "google", model: google(meta.id) };
    default:
      return null;
  }
}

type ChatMessage = { role: "user" | "assistant"; content: string };

type RequestBody = {
  locale?: string;
  messages: ChatMessage[];
};

type ConciergeScope = {
  in_scope: boolean;
};

function localeToLanguage(locale: Locale): string {
  switch (locale) {
    case "tr":
      return "Turkish";
    case "es":
      return "Spanish";
    case "fr":
      return "French";
    case "de":
      return "German";
    case "zh":
      return "Chinese (Simplified)";
    default:
      return "English";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!isRecord(value)) return false;
  return (
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string"
  );
}

function isRequestBody(value: unknown): value is RequestBody {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.messages)) return false;
  if (!value.messages.every(isChatMessage)) return false;
  if (value.model !== undefined && typeof value.model !== "string") return false;
  return true;
}

function isToolName(value: unknown): value is ToolName {
  return typeof value === "string" && TOOLS.some((t) => t.tool === value);
}

function safeParseScope(text: string): ConciergeScope | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!isRecord(parsed)) return null;
    const in_scope = parsed.in_scope;
    if (typeof in_scope !== "boolean") return null;
    return { in_scope };
  } catch {
    return null;
  }
}

function fallbackSuggestedTools(lastUser: string): ToolName[] {
  return rankToolsForUserIntent(lastUser);
}

function finalizeSuggestions(lastUser: string, reply: string, llmSuggested: ToolName[], locale: Locale) {
  return finalizeConciergeSuggestions(lastUser, reply, llmSuggested, (tool) =>
    resolveToolTitle(locale, tool)
  );
}

function fillConciergeOffScopeReply(locale: Locale, toolLines: string): string {
  const d = DICTS[locale] ?? DICTS.en;
  return `${d["concierge.offScope.lead"]}\n\n${d["concierge.offScope.try"]}\n${toolLines}`;
}

function toolMarkdownLines(locale: Locale, toolIds: ToolName[]): string {
  return toolIds
    .map((id) => {
      const t = TOOLS.find((x) => x.tool === id);
      const label = resolveToolTitle(locale, id);
      const emoji = t?.emoji ?? "✨";
      return `- [${emoji} ${label}](/?tool=${id})`;
    })
    .join("\n");
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: conciergeError("en", "concierge.errors.missingApi"), code: "misconfigured" },
      { status: 503 }
    );
  }

  try {
  const body = (await req.json().catch(() => null)) as unknown;
  if (!isRequestBody(body)) {
    const badLocale =
      isRecord(body) && typeof body.locale === "string" ? parseApiLocale(body.locale) : "en";
    return NextResponse.json(
      { error: conciergeError(badLocale, "concierge.errors.invalidBody"), code: "invalid_body" },
      { status: 400 }
    );
  }

  const locale = parseApiLocale(body.locale);

  if (conciergeRequiresAuth()) {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json(
        { error: conciergeError(locale, "concierge.errors.authRequired"), code: "auth_required" },
        { status: 401 }
      );
    }
  }

  // Abuse / cost guard: concierge may use 2 model calls per request.
  const rpm = Math.min(60, Math.max(5, Number(process.env.ISENDAI_CONCIERGE_RPM ?? "12")));
  const rl = await enforceRateLimit(req, "concierge", rpm, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: conciergeError(locale, "concierge.errors.server"), code: "rate_limited" },
      { status: 429, headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const dailyMax = Math.min(200, Math.max(10, Number(process.env.ISENDAI_CONCIERGE_DAILY_MAX ?? "40")));
  const dailyRl = await enforceRateLimit(req, "concierge-day", dailyMax, 86_400_000);
  if (!dailyRl.ok) {
    return NextResponse.json(
      { error: conciergeError(locale, "concierge.errors.server"), code: "rate_limited" },
      { status: 429, headers: { "retry-after": String(Math.ceil(dailyRl.retryAfterMs / 1000)) } }
    );
  }

  const totalChars = body.messages.reduce((sum, m) => sum + m.content.length, 0);
  if (body.messages.length > MAX_CONCIERGE_MESSAGES || totalChars > MAX_CONCIERGE_TOTAL_CHARS) {
    return NextResponse.json(
      { error: conciergeError(locale, "concierge.errors.invalidBody"), code: "invalid_body" },
      { status: 400 }
    );
  }

  const lastUser = [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const looksLikeMessageRequest = looksLikeToolableMessageRequest(lastUser);
  const toolCatalog = TOOLS.map((t) => ({
    tool: t.tool,
    emoji: t.emoji,
    label: resolveToolTitle(locale, t.tool),
    category: t.category,
    description: resolveToolDescription(locale, t.tool),
  }));

  const client = new OpenAI({ apiKey });

  // Hard gate: concierge should only answer questions about isendai tools and how to use them.
  let scope: ConciergeScope | null = null;
  try {
    const scopeRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a scope classifier for a homepage concierge.\n" +
            "IN SCOPE: anything that can be handled by recommending an isendai tool from the catalog (including requests to write/rewrite a message using a tool), plus questions about tools, categories, how it works, pricing/models, payment flow, privacy/data storage.\n" +
            "OUT OF SCOPE: general knowledge, coding help, news, and unrelated chit-chat.\n" +
            "Return ONLY valid JSON with key: in_scope (boolean). No extra keys.",
        },
        { role: "user", content: lastUser },
      ],
    });
    const scopeText = scopeRes.choices?.[0]?.message?.content?.trim() ?? "";
    scope = safeParseScope(scopeText);
  } catch {
    scope = null;
  }

  if (!scope) {
    const suggested_tools = finalizeSuggestions(
      lastUser,
      "",
      fallbackSuggestedTools(lastUser),
      locale
    );
    const reply = fillConciergeOffScopeReply(locale, toolMarkdownLines(locale, suggested_tools));
    return NextResponse.json({ reply, suggested_tools });
  }

  if (scope.in_scope === false && !looksLikeMessageRequest) {
    const suggested_tools = finalizeSuggestions(
      lastUser,
      "",
      fallbackSuggestedTools(lastUser),
      locale
    );
    const reply = fillConciergeOffScopeReply(locale, toolMarkdownLines(locale, suggested_tools));
    return NextResponse.json({ reply, suggested_tools });
  }

  /** Homepage concierge uses a fixed routing model (no client picker); generations use the header model selector. */
  const modelId: ModelId = "auto";

  const lmBinding = resolveConciergeLanguageModel(modelId);
  if (!lmBinding) {
    return NextResponse.json(
      { error: conciergeError(locale, "concierge.errors.invalidModel"), code: "invalid_model" },
      { status: 400 }
    );
  }
  if (!hasProviderKey(lmBinding.provider)) {
    return NextResponse.json(
      {
        error: conciergeError(locale, "concierge.errors.missingProvider"),
        code: "misconfigured",
      },
      { status: 503 }
    );
  }

  const mainSystem =
    humanVoiceDirective(locale) +
    "\n\nYou are the homepage concierge for an AI tools suite.\n" +
    "Your job: understand what the user needs, then recommend the best tool(s) from the catalog.\n" +
    "Explain in flowing, natural sentences why each tool fits and what they will get.\n" +
    "If the user asks about available products, summarize the catalog in plain language.\n" +
    "IMPORTANT: Only discuss the isendai tools suite (tools, how it works, pricing/models, payments, privacy). " +
    "If asked anything else, one calm sentence redirecting them to pick a writing tool — no lecturing.\n" +
    "Tool-matching rules:\n" +
    "- Gift / asking what someone wants for a present / awkward message to partner → awkward-text-fixer (NOT relationship-define-the-talk).\n" +
    "- Asking someone out, crush, confessing feelings, çıkma teklifi / hoşlanıyorum → awkward-text-fixer or delicate-truth (NOT dating-roast unless they pasted a Tinder/Bumble bio).\n" +
    "- dating-roast ONLY when the user wants help with a dating profile bio text.\n" +
    "- 'What are we?' / define-the-relationship (DTR) talks → relationship-define-the-talk.\n" +
    "- suggested_tools must list ONLY the tools you explicitly recommend in reply (same tools, same count, max 3). Never add extra tool ids.\n" +
    "- Only put a tool id in suggested_tools if the user's intent clearly fits that tool's description.\n" +
    "When you recommend a tool, include it as a clickable markdown link in your reply using this format:\n" +
    "- [<emoji> <tool label>](/?tool=<tool id>)\n" +
    "Only use internal links that start with '/'.\n" +
    `Language requirement:\n` +
    `- Output MUST be ONLY in ${localeToLanguage(locale)}.\n` +
    `- Do NOT switch languages.\n` +
    `- If user message is in a different language than locale, still follow locale.\n\n` +
    "Return ONLY valid JSON (no markdown wrapper) with keys:\n" +
    '- reply: string (your message to the user in the required language ONLY)\n' +
    "- suggested_tools: array of tool ids (0-3 items)\n" +
    "CRITICAL: Do NOT put suggested_tools, tool ids, or the phrase 'Suggested tools' inside reply. Those belong only in the suggested_tools JSON array.\n\n" +
    `Tool catalog: ${JSON.stringify(toolCatalog)}`;

  let result;
  try {
    // AI SDK: use `system` option — a system role inside `messages` can throw unless allowSystemInMessages is set.
    result = await generateText({
      model: lmBinding.model,
      temperature: 0.3,
      system: mainSystem,
      messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
    });
  } catch {
    return NextResponse.json(
      { error: conciergeError(locale, "concierge.errors.aiFailed"), code: "ai_failed" },
      { status: 502 }
    );
  }

  const content = result.text?.trim() ?? "";
  const leakedTools = extractLeakedSuggestedTools(content);
  const parsed = parseConciergeModelOutput(content);

  const prose = parsed ?? (content ? parseConciergeProseFallback(content) : null);
  if (!prose) {
    const suggested_tools = finalizeSuggestions(
      lastUser,
      "",
      [...leakedTools, ...fallbackSuggestedTools(lastUser)],
      locale
    );
    return NextResponse.json({ reply: "OK", suggested_tools });
  }

  const reply = sanitizeConciergeReplyText(prose.reply);
  const llmSuggested = [
    ...prose.suggested_tools,
    ...leakedTools.filter((t) => !prose.suggested_tools.includes(t)),
  ];
  const baseSuggested =
    llmSuggested.length > 0 ? llmSuggested : fallbackSuggestedTools(lastUser);
  const suggested_tools = finalizeSuggestions(lastUser, reply, baseSuggested, locale);

  return NextResponse.json({
    reply,
    suggested_tools,
  });
  } catch (e) {
    console.error("[concierge] POST error:", e);
    return NextResponse.json(
      { error: conciergeError("en", "concierge.errors.server"), code: "server_error" },
      { status: 500 }
    );
  }
}

