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
import {
  alignSuggestedTools,
  looksLikeToolableMessageRequest,
  rankToolsForUserIntent,
} from "@/lib/intent-tool-routing";
import { isConcreteModelId, modelMeta, type ModelId } from "@/models/models";

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

type ConciergeResponse = {
  reply: string;
  suggested_tools: ToolName[];
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

function safeParseResponse(text: string): ConciergeResponse | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!isRecord(parsed)) return null;
    const reply = parsed.reply;
    const suggested = parsed.suggested_tools;
    if (typeof reply !== "string") return null;
    if (!Array.isArray(suggested)) return null;
    const suggested_tools = suggested.filter(isToolName).slice(0, 3);
    return { reply, suggested_tools };
  } catch {
    return null;
  }
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

function fillConciergeOffScopeReply(locale: Locale, toolLines: string): string {
  const d = DICTS[locale] ?? DICTS.en;
  return `${d["concierge.offScope.lead"]}\n\n${d["concierge.offScope.try"]}\n${toolLines}`;
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
    // Network/provider failure: do not block the main concierge reply.
    scope = { in_scope: true };
  }
  if (scope && scope.in_scope === false && !looksLikeMessageRequest) {
    const suggested_tools = alignSuggestedTools(lastUser, fallbackSuggestedTools(lastUser));
    const toolLines = suggested_tools
      .map((id) => {
        const t = TOOLS.find((x) => x.tool === id);
        const label = resolveToolTitle(locale, id);
        const emoji = t?.emoji ?? "✨";
        return `- [${emoji} ${label}](/?tool=${id})`;
      })
      .join("\n");

    const reply = fillConciergeOffScopeReply(locale, toolLines);

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
    "You are the homepage concierge for an AI tools suite.\n" +
    "Your job: ask what the user needs, then recommend the best tool(s) from the catalog.\n" +
    "Explain briefly WHY, and what the tool will output.\n" +
    "If the user asks about available products, summarize the catalog.\n" +
    "Be friendly, concise, and practical.\n" +
    "IMPORTANT: Only discuss the isendai tools suite (tools, how it works, pricing/models, payments, privacy). If asked anything else, refuse briefly and redirect back to choosing a tool.\n" +
    "Tool-matching rules:\n" +
    "- Gift / asking what someone wants for a present / awkward message to partner → awkward-text-fixer (NOT relationship-define-the-talk).\n" +
    "- 'What are we?' / define-the-relationship (DTR) talks → relationship-define-the-talk.\n" +
    "- Only put a tool id in suggested_tools if the user's intent clearly fits that tool's description.\n" +
    "When you recommend a tool, include it as a clickable markdown link in your reply using this format:\n" +
    "- [<emoji> <tool label>](/?tool=<tool id>)\n" +
    "Only use internal links that start with '/'.\n" +
    `Language requirement:\n` +
    `- Output MUST be ONLY in ${localeToLanguage(locale)}.\n` +
    `- Do NOT switch languages.\n` +
    `- If user message is in a different language than locale, still follow locale.\n\n` +
    "Return ONLY valid JSON (no markdown) with keys:\n" +
    '- reply: string (your message)\n' +
    "- suggested_tools: array of tool ids (0-3 items)\n\n" +
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
  } catch (e) {
    return NextResponse.json(
      { error: conciergeError(locale, "concierge.errors.aiFailed"), code: "ai_failed" },
      { status: 502 }
    );
  }

  const content = result.text?.trim() ?? "";
  const parsed = safeParseResponse(content);

  if (!parsed) {
    return NextResponse.json({
      reply: content || "OK",
      suggested_tools: alignSuggestedTools(lastUser, fallbackSuggestedTools(lastUser)),
    });
  }

  const suggested_tools = alignSuggestedTools(
    lastUser,
    parsed.suggested_tools?.length ? parsed.suggested_tools : fallbackSuggestedTools(lastUser)
  );

  return NextResponse.json({
    reply: parsed.reply,
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

