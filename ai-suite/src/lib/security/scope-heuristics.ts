import type { ToolName } from "@/components/ai-suite/tools";
import { rankToolsForUserIntent } from "@/lib/intent-tool-routing";

export type HeuristicScopeResult = {
  in_scope: boolean;
  suggested_tool?: ToolName | "unknown";
};

const MIN_INPUT_CHARS = 10;

/**
 * Scope gate when OpenAI is unavailable — no fail-open; uses intent ranking only.
 */
export function scopeByHeuristicsOnly(tool: ToolName, rawInput: string): HeuristicScopeResult {
  const trimmed = rawInput.trim();
  const ranked = rankToolsForUserIntent(trimmed);
  const fallback = ranked[0] ?? "unknown";

  if (trimmed.length < MIN_INPUT_CHARS) {
    return { in_scope: false, suggested_tool: fallback };
  }

  const topMatches = ranked.slice(0, 3);
  if (topMatches.includes(tool)) {
    return { in_scope: true };
  }

  return { in_scope: false, suggested_tool: fallback };
}
