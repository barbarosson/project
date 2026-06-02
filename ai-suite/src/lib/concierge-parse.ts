import type { ToolName } from "@/components/ai-suite/tools";
import { TOOLS } from "@/components/ai-suite/tools";

export type ConciergeParsed = {
  reply: string;
  suggested_tools: ToolName[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isToolName(value: string): value is ToolName {
  return TOOLS.some((t) => t.tool === value);
}

/** Remove JSON/metadata leaks that must not appear in the user-visible reply. */
export function sanitizeConciergeReplyText(reply: string): string {
  let s = reply.trim();
  const patterns = [
    /\n?\s*Suggested tools:\s*\[[\s\S]*?\]\s*$/i,
    /\n?\s*suggested_tools:\s*\[[\s\S]*?\]\s*$/i,
    /\n?\s*"suggested_tools"\s*:\s*\[[\s\S]*?\]\s*$/i,
    /\n?\s*Suggested tools:\s*:\s*\[[\s\S]*$/i,
    /\n?\s*Suggested tools:\s*\[[\s\S]*$/i,
  ];
  for (const pattern of patterns) {
    s = s.replace(pattern, "");
  }
  return s.trim();
}

/** When the model appends `Suggested tools: ["..."]` outside JSON, recover tool ids. */
export function extractLeakedSuggestedTools(text: string): ToolName[] {
  const found: ToolName[] = [];
  const re = /Suggested tools:\s*(\[[^\]]*\])/gi;
  let match: RegExpExecArray | null = null;
  while ((match = re.exec(text)) !== null) {
    try {
      const arr = JSON.parse(match[1]) as unknown;
      if (!Array.isArray(arr)) continue;
      for (const item of arr) {
        if (typeof item === "string" && isToolName(item) && !found.includes(item)) {
          found.push(item);
        }
      }
    } catch {
      // ignore malformed leak
    }
  }
  return found;
}

function tryParseConciergeJson(json: string): ConciergeParsed | null {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!isRecord(parsed) || typeof parsed.reply !== "string") return null;
    const suggested_tools = Array.isArray(parsed.suggested_tools)
      ? parsed.suggested_tools.filter((x): x is ToolName => typeof x === "string" && isToolName(x)).slice(0, 3)
      : [];
    return {
      reply: sanitizeConciergeReplyText(parsed.reply),
      suggested_tools,
    };
  } catch {
    return null;
  }
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

/** Parse model output when it returns valid JSON (optionally inside a code fence). */
export function parseConciergeModelOutput(raw: string): ConciergeParsed | null {
  const text = raw.trim();
  if (!text) return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    const fromFence = tryParseConciergeJson(fenced[1].trim());
    if (fromFence) return fromFence;
  }

  const direct = tryParseConciergeJson(text);
  if (direct) return direct;

  const embedded = extractJsonObject(text);
  if (embedded) {
    const fromEmbedded = tryParseConciergeJson(embedded);
    if (fromEmbedded) return fromEmbedded;
  }

  return null;
}

/** Plain-text fallback: keep prose, strip leaks, recover tool ids from leaks. */
export function parseConciergeProseFallback(raw: string): ConciergeParsed {
  const suggested_tools = extractLeakedSuggestedTools(raw);
  const reply = sanitizeConciergeReplyText(raw);
  return { reply: reply || "OK", suggested_tools };
}
