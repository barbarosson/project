import type { ToolName } from "@/components/ai-suite/tools";

export type ToolGenerationParams = {
  temperature?: number;
  maxOutputTokens?: number;
};

/** Per-tool sampling limits (e.g. ultra-short outputs). */
export function toolGenerationParams(tool: ToolName): ToolGenerationParams {
  if (tool === "corporate-to-caveman-translator") {
    return { temperature: 0.85, maxOutputTokens: 48 };
  }
  return { temperature: 0.6 };
}

/** Tools whose output must NOT use the full professional “expert voice” wrapper. */
export const COMPRESSION_STYLE_TOOLS = new Set<ToolName>(["corporate-to-caveman-translator"]);

export function usesCompressionStyle(tool: ToolName): boolean {
  return COMPRESSION_STYLE_TOOLS.has(tool);
}
