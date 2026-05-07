export type ToolName = "corporate-whisperer" | "coverletter-ai" | "dating-roast";

export type ToolPayload =
  | { tool: "corporate-whisperer"; text: string }
  | { tool: "coverletter-ai"; jobLink: string; resume: string }
  | { tool: "dating-roast"; profile: string };

export const TOOL_META: Record<
  ToolName,
  {
    label: string;
    priceLabel: string;
    storageKey: string;
    stripeEnvVar:
      | "NEXT_PUBLIC_STRIPE_LINK_CORPORATE_WHISPERER"
      | "NEXT_PUBLIC_STRIPE_LINK_COVERLETTER_AI"
      | "NEXT_PUBLIC_STRIPE_LINK_DATING_ROAST";
  }
> = {
  "corporate-whisperer": {
    label: "The Corporate Whisperer",
    priceLabel: "Generate with AI - $1.49",
    storageKey: "ai-suite:payload:corporate-whisperer",
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_CORPORATE_WHISPERER",
  },
  "coverletter-ai": {
    label: "1-Click Cover Letter",
    priceLabel: "Generate with AI - $1.49",
    storageKey: "ai-suite:payload:coverletter-ai",
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_COVERLETTER_AI",
  },
  "dating-roast": {
    label: "Dating Profile Roast & Fix",
    priceLabel: "Generate with AI - $1.49",
    storageKey: "ai-suite:payload:dating-roast",
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_DATING_ROAST",
  },
};

export function getStripeLink(tool: ToolName): string | null {
  const envVar = TOOL_META[tool].stripeEnvVar;
  const value = process.env[envVar];
  return value && value.trim().length > 0 ? value.trim() : null;
}

