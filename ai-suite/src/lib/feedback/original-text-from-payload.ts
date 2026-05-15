import type { ToolPayload } from "@/components/ai-suite/tools";

/** Serialize user input from a tool payload for feedback storage. */
export function originalTextFromPayload(payload: ToolPayload): string {
  if (payload.tool === "coverletter-ai" && "jobLink" in payload && "resume" in payload) {
    return [`Job / link:\n${payload.jobLink.trim()}`, `Resume / background:\n${payload.resume.trim()}`].join(
      "\n\n"
    );
  }
  if (payload.tool === "dating-roast") {
    const text = "text" in payload ? payload.text : payload.profile;
    return text.trim();
  }
  if ("text" in payload && typeof payload.text === "string") {
    return payload.text.trim();
  }
  return "";
}
