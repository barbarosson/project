import { NextResponse } from "next/server";
import OpenAI from "openai";

import { TOOLS, type ToolName } from "@/components/ai-suite/tools";
import { type Locale } from "@/i18n/dictionaries";
import { resolveToolDescription, resolveToolTitle } from "@/i18n/tool-copy-resolve";

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
  return value.messages.every(isChatMessage);
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

function outOfScopeReply(locale: string) {
  switch (locale) {
    case "tr":
      return "Ben ISENDAI’yım. Sadece isendai araçları hakkında bilgi verebilir ve ihtiyacına göre doğru aracı önerebilirim.\n\nNe yapmak istiyorsun? (örn. iş e-postası, ön yazı, iade talebi, flört biyosu)";
    case "es":
      return "Soy ISENDAI. Solo puedo ayudar con las herramientas de isendai: explicarlas y recomendar la adecuada.\n\n¿Qué necesitas hacer? (p. ej., un email de trabajo, una carta de presentación, un mensaje de reembolso, una bio de citas)";
    case "fr":
      return "Je suis ISENDAI. Je peux uniquement aider à propos des outils isendai (les expliquer et recommander le bon).\n\nDe quoi as-tu besoin ? (ex. un email pro, une lettre de motivation, un remboursement, une bio de rencontre)";
    case "de":
      return "Ich bin ISENDAI. Ich helfe nur zu isendai‑Tools (erklären und das passende Tool empfehlen).\n\nWobei brauchst du Hilfe? (z. B. Business‑Mail, Anschreiben, Rückerstattung, Dating‑Bio)";
    case "zh":
      return "我是 ISENDAI。我只回答 isendai 工具相关问题（介绍工具并推荐合适的工具）。\n\n你想完成什么？（例如：工作邮件、求职信、退款消息、约会简介）";
    default:
      return "I’m ISENDAI. I can only help with isendai tools: explain them and recommend the right one.\n\nWhat do you need help with? (e.g., a work email, a cover letter, a refund message, a dating bio)";
  }
}

function fallbackSuggestedTools(lastUser: string): ToolName[] {
  const t = lastUser.toLowerCase();

  const has = (id: ToolName) => TOOLS.some((x) => x.tool === id);
  const pick = (ids: ToolName[]) => ids.filter(has).slice(0, 3);

  // Relationship / personal messages
  if (
    /\b(wife|husband|girlfriend|boyfriend|partner|spouse|anniversary|gift|present|valentine)\b/.test(t) ||
    /\b(eşim|karım|kocam|sevgilim|partnerim|hediye|sürpriz|yıldönümü|doğum\s*günü)\b/.test(t)
  ) {
    return pick(["awkward-text-fixer", "delicate-truth", "relationship-define-the-talk"]);
  }

  // Apology/repair
  if (/\b(apolog|sorry|repair|make up)\b/.test(t) || /\b(özür|pardon|telafi|barış)\b/.test(t)) {
    return pick(["perfect-apology", "apology-repair-plan", "relationship-repair-text"]);
  }

  // Work email default
  if (/\b(boss|manager|client|email|work)\b/.test(t) || /\b(iş|mail|e-?posta|patron|müşteri)\b/.test(t)) {
    return pick(["corporate-whisperer", "deadline-diplomat", "micromanager-tamer"]);
  }

  // Generic “write a message” fallback
  if (
    /\b(message|text|write|rewrite|draft|ask)\b/.test(t) ||
    /\b(mesaj|yaz|yazmak|sor|sormak|rica)\b/.test(t)
  ) {
    return pick(["awkward-text-fixer", "delicate-truth", "guilt-free-no"]);
  }

  // Absolute fallback: always return something sensible.
  return pick(["awkward-text-fixer", "corporate-whisperer", "delicate-truth"]);
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY." },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!isRequestBody(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const locale: Locale =
    typeof body.locale === "string" &&
    (body.locale === "en" ||
      body.locale === "tr" ||
      body.locale === "es" ||
      body.locale === "fr" ||
      body.locale === "de" ||
      body.locale === "zh")
      ? body.locale
      : "en";
  const lastUser = [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const lastUserLower = lastUser.toLowerCase();
  // Heuristic: if the user is clearly asking to write/rewrite a message (which our tools do),
  // treat it as in-scope even if the classifier is overly strict.
  const looksLikeMessageRequest =
    /\b(message|text|dm|email|write|rewrite|draft)\b/.test(lastUserLower) ||
    /\b(ask|how do i ask|how can i ask|how to ask|politely)\b/.test(lastUserLower) ||
    /\b(mesaj|yaz|yazmak|metin|dm|e-?posta|mail)\b/.test(lastUserLower) ||
    /\b(sor|sormak|nasıl sor|kibarca|rica)\b/.test(lastUserLower) ||
    /\b(mensaje|escribir|texto|correo)\b/.test(lastUserLower) ||
    /\b(message|écrire|texte|courriel)\b/.test(lastUserLower) ||
    /\b(nachricht|text|schreib|mail)\b/.test(lastUserLower) ||
    /消息|短信|写|邮件/.test(lastUser);
  const toolCatalog = TOOLS.map((t) => ({
    tool: t.tool,
    emoji: t.emoji,
    label: resolveToolTitle(locale, t.tool),
    category: t.category,
    description: resolveToolDescription(locale, t.tool),
  }));

  const client = new OpenAI({ apiKey });

  // Hard gate: concierge should only answer questions about isendai tools and how to use them.
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
  const scope = safeParseScope(scopeText);
  if (scope && scope.in_scope === false && !looksLikeMessageRequest) {
    const suggested_tools = fallbackSuggestedTools(lastUser);
    const toolLines = suggested_tools
      .map((id) => {
        const t = TOOLS.find((x) => x.tool === id);
        const label = resolveToolTitle(locale, id);
        const emoji = t?.emoji ?? "✨";
        return `- [${emoji} ${label}](/?tool=${id})`;
      })
      .join("\n");

    const reply =
      locale === "tr"
        ? `Bunu isendai ile halledebiliriz: eşine kibarca hediye fikrini sormak için bir mesaj taslağı çıkarabilirim.\n\nŞunları dene:\n${toolLines}`
        : `We can handle this with isendai: I can draft a polite message to ask for gift ideas.\n\nTry:\n${toolLines}`;

    return NextResponse.json({ reply, suggested_tools });
  }

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are the homepage concierge for an AI tools suite.\n" +
          "Your job: ask what the user needs, then recommend the best tool(s) from the catalog.\n" +
          "Explain briefly WHY, and what the tool will output.\n" +
          "If the user asks about available products, summarize the catalog.\n" +
          "Be friendly, concise, and practical.\n" +
          "IMPORTANT: Only discuss the isendai tools suite (tools, how it works, pricing/models, payments, privacy). If asked anything else, refuse briefly and redirect back to choosing a tool.\n" +
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
          `Tool catalog: ${JSON.stringify(toolCatalog)}`,
      },
      ...body.messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const content = res.choices?.[0]?.message?.content?.trim() ?? "";
  const parsed = safeParseResponse(content);

  if (!parsed) {
    // Fail soft: return plain text with no suggestions.
    return NextResponse.json({
      reply: content || "OK",
      suggested_tools: fallbackSuggestedTools(lastUser),
    });
  }

  // Guarantee at least one suggestion for valid in-scope queries.
  if (!parsed.suggested_tools?.length) {
    return NextResponse.json({
      reply: parsed.reply,
      suggested_tools: fallbackSuggestedTools(lastUser),
    });
  }

  return NextResponse.json(parsed);
}

