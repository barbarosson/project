import { NextResponse } from "next/server";
import OpenAI from "openai";

import { TOOLS, type ToolName } from "@/components/ai-suite/tools";

type ChatMessage = { role: "user" | "assistant"; content: string };

type RequestBody = {
  locale?: string;
  messages: ChatMessage[];
};

type ConciergeResponse = {
  reply: string;
  suggested_tools: ToolName[];
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

  const locale = typeof body.locale === "string" ? body.locale : "en";
  const toolCatalog = TOOLS.map((t) => ({
    tool: t.tool,
    emoji: t.emoji,
    label: t.label,
    category: t.category,
    description: t.description,
  }));

  const client = new OpenAI({ apiKey });

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

