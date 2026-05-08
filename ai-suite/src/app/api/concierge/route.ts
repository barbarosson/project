import { NextResponse } from "next/server";
import OpenAI from "openai";

import { TOOLS, type ToolName } from "@/components/ai-suite/tools";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { toolTitleFromSeed } from "@/i18n/tool-i18n";

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
  const toolCatalog = TOOLS.map((t) => ({
    tool: t.tool,
    emoji: t.emoji,
    label: toolTitleFromSeed(DICTS, locale, t.tool, t.title),
    category: t.category,
    description: t.description,
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
          "You are a strict scope classifier for a homepage concierge.\n" +
          "IN SCOPE: questions about the isendai product suite, tools, categories, what each tool does, which tool to use, how it works, pricing, models, payment flow, privacy/data storage.\n" +
          "OUT OF SCOPE: general knowledge, coding help, news, personal advice beyond selecting/using the tools, unrelated chit-chat.\n" +
          "Return ONLY valid JSON with key: in_scope (boolean). No extra keys.",
      },
      { role: "user", content: lastUser },
    ],
  });
  const scopeText = scopeRes.choices?.[0]?.message?.content?.trim() ?? "";
  const scope = safeParseScope(scopeText);
  if (scope && scope.in_scope === false) {
    return NextResponse.json({ reply: outOfScopeReply(locale), suggested_tools: [] });
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
          `Reply in this language/locale: ${locale}\n\n` +
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
    return NextResponse.json({ reply: content || "OK", suggested_tools: [] });
  }

  return NextResponse.json(parsed);
}

