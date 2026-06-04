import type { ToolName } from "@/components/ai-suite/tools";

/** Faz 1 positioning: three primary audiences → flagship tool. */
export const HOME_AUDIENCE_SEGMENTS: ReadonlyArray<{
  id: "freelance" | "business" | "career";
  tool: ToolName;
}> = [
  { id: "freelance", tool: "proposal-sniper" },
  { id: "business", tool: "refund-demander" },
  { id: "career", tool: "corporate-whisperer" },
];
