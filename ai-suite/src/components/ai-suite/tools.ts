export type ToolCategory = "work-career" | "crisis-money" | "social-dating";

export const CATEGORY_META: Record<
  ToolCategory,
  { label: string; description: string }
> = {
  "work-career": {
    label: "Work & Career",
    description: "Emails, DMs, resignations, boundaries, and getting paid.",
  },
  "crisis-money": {
    label: "Crisis & Money",
    description: "Refunds, deadlines, disputes, apologies, and reputation replies.",
  },
  "social-dating": {
    label: "Social & Dating",
    description: "Ghosting, boundaries, hard truths, and clean messaging.",
  },
};

export type ToolField =
  | { kind: "textarea"; key: "text"; placeholder: string }
  | { kind: "input"; key: "jobLink"; placeholder: string }
  | { kind: "textarea"; key: "resume"; placeholder: string };

export type ToolName =
  | "corporate-whisperer"
  | "coverletter-ai"
  | "dating-roast"
  | "raise-negotiator"
  | "graceful-quitter"
  | "cold-dm-icebreaker"
  | "micromanager-tamer"
  | "invoice-chaser"
  | "perfect-apology"
  | "refund-demander"
  | "deadline-diplomat"
  | "landlord-diplomat"
  | "review-retaliator"
  | "ghosting-resurrector"
  | "passive-aggressive-decoder"
  | "guilt-free-no"
  | "delicate-truth"
  | "co-parenting-peacemaker"
  | "friendzone-navigator"
  | "rsvp-diplomat";

export type ToolPayload =
  | { tool: "coverletter-ai"; jobLink: string; resume: string }
  | { tool: Exclude<ToolName, "coverletter-ai">; text: string }
  // Backwards compatible payloads (older deployed versions):
  | { tool: "dating-roast"; profile: string }
  | { tool: "corporate-whisperer"; text: string };

export type ToolDefinition = {
  tool: ToolName;
  category: ToolCategory;
  label: string;
  description: string;
  actionLabel: string;
  fields: ToolField[];
  storageKey: string;
  stripeEnvVar: string;
};

function mkStripeEnv(tool: ToolName) {
  return `NEXT_PUBLIC_STRIPE_LINK_${tool.toUpperCase().replaceAll("-", "_")}`;
}

function mkStorageKey(tool: ToolName) {
  return `ai-suite:payload:${tool}`;
}

export const TOOLS: ToolDefinition[] = [
  {
    tool: "corporate-whisperer",
    category: "work-career",
    label: "The Corporate Whisperer",
    description:
      "Want to yell at your boss or client? Don't. Type your angry, unfiltered thoughts here, and we'll turn it into a polite, HR-friendly masterpiece.",
    actionLabel: "Translate to Professional",
    fields: [
      {
        kind: "textarea",
        key: "text",
        placeholder:
          `Type what you REALLY want to say... (e.g., "This design is garbage and you clearly didn't read my brief.")`,
      },
    ],
    storageKey: mkStorageKey("corporate-whisperer"),
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_CORPORATE_WHISPERER",
  },
  {
    tool: "coverletter-ai",
    category: "work-career",
    label: "Click Cover Letter",
    description:
      "Tired of writing the same letter for every job? Paste the job URL and your skills. We'll generate a tailored, ATS-beating cover letter that gets interviews.",
    actionLabel: "Generate Cover Letter",
    fields: [
      { kind: "input", key: "jobLink", placeholder: "Paste Job Description or URL..." },
      { kind: "textarea", key: "resume", placeholder: "Paste your resume text or key skills..." },
    ],
    storageKey: mkStorageKey("coverletter-ai"),
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_COVERLETTER_AI",
  },
  {
    tool: "dating-roast",
    category: "social-dating",
    label: "Dating Profile Roast & Fix",
    description:
      "Not getting matches? Our AI will brutally roast your current bio, tell you exactly why it's failing, and write a magnetic new one for you.",
    actionLabel: "Roast & Fix My Profile",
    fields: [
      {
        kind: "textarea",
        key: "text",
        placeholder: "Paste your current Tinder/Bumble bio or describe your vibe...",
      },
    ],
    storageKey: mkStorageKey("dating-roast"),
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_DATING_ROAST",
  },

  // Work & Career
  {
    tool: "raise-negotiator",
    category: "work-career",
    label: "The Raise Negotiator",
    description:
      "Turn your wins into a clear, persuasive raise or budget increase email that’s confident, specific, and hard to ignore.",
    actionLabel: "Write My Raise Email",
    fields: [{ kind: "textarea", key: "text", placeholder: "Paste your achievements, impact, numbers, and context..." }],
    storageKey: mkStorageKey("raise-negotiator"),
    stripeEnvVar: mkStripeEnv("raise-negotiator"),
  },
  {
    tool: "graceful-quitter",
    category: "work-career",
    label: "The Graceful Quitter",
    description:
      "Draft a professional resignation letter that preserves relationships and avoids burning bridges.",
    actionLabel: "Generate Resignation Letter",
    fields: [{ kind: "textarea", key: "text", placeholder: "Role, last day, reason (optional), and any handoff notes..." }],
    storageKey: mkStorageKey("graceful-quitter"),
    stripeEnvVar: mkStripeEnv("graceful-quitter"),
  },
  {
    tool: "cold-dm-icebreaker",
    category: "work-career",
    label: "The Cold DM Icebreaker",
    description:
      "Create a short, high-reply cold message for LinkedIn/email that feels personal, not spammy.",
    actionLabel: "Write My Cold DM",
    fields: [{ kind: "textarea", key: "text", placeholder: "Who you’re messaging, why them, what you want, and 1–2 personal details..." }],
    storageKey: mkStorageKey("cold-dm-icebreaker"),
    stripeEnvVar: mkStripeEnv("cold-dm-icebreaker"),
  },
  {
    tool: "micromanager-tamer",
    category: "work-career",
    label: "The Micromanager Tamer",
    description:
      "Set firm boundaries with a micromanager—politely, clearly, and without escalating drama.",
    actionLabel: "Set Boundaries",
    fields: [{ kind: "textarea", key: "text", placeholder: "Describe what they do, what you need instead, and your preferred workflow..." }],
    storageKey: mkStorageKey("micromanager-tamer"),
    stripeEnvVar: mkStripeEnv("micromanager-tamer"),
  },
  {
    tool: "invoice-chaser",
    category: "work-career",
    label: "The Invoice Chaser",
    description:
      "Write a firm-but-friendly payment reminder that gets you paid without shaming the client.",
    actionLabel: "Chase My Invoice",
    fields: [{ kind: "textarea", key: "text", placeholder: "Invoice #, amount, due date, and prior follow-ups (if any)..." }],
    storageKey: mkStorageKey("invoice-chaser"),
    stripeEnvVar: mkStripeEnv("invoice-chaser"),
  },

  // Crisis & Money
  {
    tool: "perfect-apology",
    category: "crisis-money",
    label: "The Perfect Apology",
    description:
      "A no-excuses apology that takes responsibility, repairs trust, and proposes a concrete next step.",
    actionLabel: "Write My Apology",
    fields: [{ kind: "textarea", key: "text", placeholder: "What happened, who it impacted, and what you’ll do to fix it..." }],
    storageKey: mkStorageKey("perfect-apology"),
    stripeEnvVar: mkStripeEnv("perfect-apology"),
  },
  {
    tool: "refund-demander",
    category: "crisis-money",
    label: "The Refund Demander",
    description:
      "A formal, assertive complaint email that cites consumer rights and maximizes your chance of a refund or compensation.",
    actionLabel: "Demand My Refund",
    fields: [{ kind: "textarea", key: "text", placeholder: "Company, order details, issue, timeline, what you want, and any evidence..." }],
    storageKey: mkStorageKey("refund-demander"),
    stripeEnvVar: mkStripeEnv("refund-demander"),
  },
  {
    tool: "deadline-diplomat",
    category: "crisis-money",
    label: "The Deadline Diplomat",
    description:
      "Ask for more time in a way that stays credible: calm, professional, with a plan and revised timeline.",
    actionLabel: "Request Extension",
    fields: [{ kind: "textarea", key: "text", placeholder: "Current deadline, what’s blocking, new proposed date, and next milestones..." }],
    storageKey: mkStorageKey("deadline-diplomat"),
    stripeEnvVar: mkStripeEnv("deadline-diplomat"),
  },
  {
    tool: "landlord-diplomat",
    category: "crisis-money",
    label: "The Landlord Diplomat",
    description:
      "Draft diplomatic, legally-aware messages for landlord/tenant disputes without inflaming the situation.",
    actionLabel: "Draft My Message",
    fields: [{ kind: "textarea", key: "text", placeholder: "Country/city, issue (rent/repairs/deposit), what you want, and any dates..." }],
    storageKey: mkStorageKey("landlord-diplomat"),
    stripeEnvVar: mkStripeEnv("landlord-diplomat"),
  },
  {
    tool: "review-retaliator",
    category: "crisis-money",
    label: "The Review Retaliator",
    description:
      "Respond to unfair negative reviews with calm professionalism and reputation-saving clarity.",
    actionLabel: "Write Review Reply",
    fields: [{ kind: "textarea", key: "text", placeholder: "Paste the review + any context you can share (facts, policy, what happened)..." }],
    storageKey: mkStorageKey("review-retaliator"),
    stripeEnvVar: mkStripeEnv("review-retaliator"),
  },

  // Social & Dating
  {
    tool: "ghosting-resurrector",
    category: "social-dating",
    label: "The Ghosting Resurrector",
    description:
      "Get a reply without sounding desperate: short, playful, and low-pressure follow-ups.",
    actionLabel: "Get Them To Reply",
    fields: [{ kind: "textarea", key: "text", placeholder: "Paste the last messages and what you want (date / clarity / closure)..." }],
    storageKey: mkStorageKey("ghosting-resurrector"),
    stripeEnvVar: mkStripeEnv("ghosting-resurrector"),
  },
  {
    tool: "passive-aggressive-decoder",
    category: "social-dating",
    label: "The Passive-Aggressive Decoder",
    description:
      "Translate toxic subtext into plain English—then craft a smart reply that disarms without escalating.",
    actionLabel: "Decode & Reply",
    fields: [{ kind: "textarea", key: "text", placeholder: "Paste the message you received and the relationship context..." }],
    storageKey: mkStorageKey("passive-aggressive-decoder"),
    stripeEnvVar: mkStripeEnv("passive-aggressive-decoder"),
  },
  {
    tool: "guilt-free-no",
    category: "social-dating",
    label: 'The Guilt-Free "No"',
    description:
      "Say no clearly and kindly—without overexplaining or feeling guilty.",
    actionLabel: "Write My No",
    fields: [{ kind: "textarea", key: "text", placeholder: "What you’re declining, who it is, and how direct you want to be..." }],
    storageKey: mkStorageKey("guilt-free-no"),
    stripeEnvVar: mkStripeEnv("guilt-free-no"),
  },
  {
    tool: "delicate-truth",
    category: "social-dating",
    label: "The Delicate Truth",
    description:
      "Turn hard truths into gentle, non-blaming messages that still land clearly.",
    actionLabel: "Say It Kindly",
    fields: [{ kind: "textarea", key: "text", placeholder: "What you need to say, why, and what outcome you want..." }],
    storageKey: mkStorageKey("delicate-truth"),
    stripeEnvVar: mkStripeEnv("delicate-truth"),
  },
  {
    tool: "co-parenting-peacemaker",
    category: "social-dating",
    label: "The Co-Parenting Peacemaker",
    description:
      "Filter anger and keep it logistics-only: neutral co-parenting messages that reduce conflict.",
    actionLabel: "Make It Neutral",
    fields: [{ kind: "textarea", key: "text", placeholder: "Situation, schedule details, what you’re requesting, and boundaries..." }],
    storageKey: mkStorageKey("co-parenting-peacemaker"),
    stripeEnvVar: mkStripeEnv("co-parenting-peacemaker"),
  },
  {
    tool: "friendzone-navigator",
    category: "social-dating",
    label: "The Friendzone Navigator",
    description:
      "Confess feelings or set boundaries without wrecking the friendship—careful, respectful, and clear.",
    actionLabel: "Write My Message",
    fields: [{ kind: "textarea", key: "text", placeholder: "Context, what you feel, and what you’re asking for (or declining)..." }],
    storageKey: mkStorageKey("friendzone-navigator"),
    stripeEnvVar: mkStripeEnv("friendzone-navigator"),
  },
  {
    tool: "rsvp-diplomat",
    category: "social-dating",
    label: "The RSVP Diplomat",
    description:
      "Decline an important invitation without drama: warm, respectful, and final.",
    actionLabel: "Decline Gracefully",
    fields: [{ kind: "textarea", key: "text", placeholder: "Event, who invited you, why you can’t go (optional), and tone preference..." }],
    storageKey: mkStorageKey("rsvp-diplomat"),
    stripeEnvVar: mkStripeEnv("rsvp-diplomat"),
  },
];

export function getToolDefinition(tool: ToolName): ToolDefinition {
  const found = TOOLS.find((t) => t.tool === tool);
  if (!found) throw new Error(`Unknown tool: ${tool}`);
  return found;
}

export function getStripeLink(tool: ToolName): string | null {
  const def = getToolDefinition(tool);
  const value = process.env[def.stripeEnvVar];
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function getStripeLinkForModel(tool: ToolName, model: string): string | null {
  // Default/back-compat: if model-specific env is missing, fall back to tool env var.
  const suffix = model.toUpperCase().replaceAll("-", "_").replaceAll(".", "_");
  const modelEnv = `NEXT_PUBLIC_STRIPE_LINK_${tool
    .toUpperCase()
    .replaceAll("-", "_")}_${suffix}`;
  const specific = process.env[modelEnv];
  if (specific && specific.trim().length > 0) return specific.trim();
  return getStripeLink(tool);
}

