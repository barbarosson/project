import { NextResponse } from "next/server";
import OpenAI from "openai";

type ModelId = "gpt-4o-mini" | "gpt-4.1-mini" | "gpt-4o";

type ToolName =
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

type ToolPayload =
  | { tool: "coverletter-ai"; jobLink: string; resume: string }
  | { tool: Exclude<ToolName, "coverletter-ai">; text: string }
  // Backward-compat: previous versions used `profile` for dating-roast
  | { tool: "dating-roast"; profile: string };

type RequestBody = ToolPayload & { model?: ModelId };

type ScopeResult = {
  in_scope: boolean;
  reason?: string;
  suggested_tool?: ToolName | "unknown";
};

const TOOL_NAMES: ToolName[] = [
  "corporate-whisperer",
  "coverletter-ai",
  "dating-roast",
  "raise-negotiator",
  "graceful-quitter",
  "cold-dm-icebreaker",
  "micromanager-tamer",
  "invoice-chaser",
  "perfect-apology",
  "refund-demander",
  "deadline-diplomat",
  "landlord-diplomat",
  "review-retaliator",
  "ghosting-resurrector",
  "passive-aggressive-decoder",
  "guilt-free-no",
  "delicate-truth",
  "co-parenting-peacemaker",
  "friendzone-navigator",
  "rsvp-diplomat",
];

function isToolName(value: string): value is ToolName {
  return (TOOL_NAMES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isToolPayload(value: unknown): value is RequestBody {
  if (!isRecord(value)) return false;
  const tool = value.tool;
  if (tool === "coverletter-ai")
    return typeof value.jobLink === "string" && typeof value.resume === "string";
  if (tool === "dating-roast")
    return typeof value.text === "string" || typeof value.profile === "string";
  // all other tools: require `text`
  return typeof value.text === "string";
  return false;
}

function isModelId(value: unknown): value is ModelId {
  return value === "gpt-4o-mini" || value === "gpt-4.1-mini" || value === "gpt-4o";
}

function scopeInstructionsFor(tool: ToolName) {
  switch (tool) {
    case "corporate-whisperer":
      return (
        "Rewrite ANY rough/emotional/unprofessional draft into a concise, polite, professional workplace email. " +
        "Aggressive/confrontational language is explicitly IN SCOPE because the goal is to tone-polish it. " +
        "Out of scope only if the user is NOT asking for message/email rewriting."
      );
    case "coverletter-ai":
      return "Only writing a tailored cover letter based on job posting + candidate resume.";
    case "dating-roast":
      return "Only critique + improve a dating profile bio (kind, constructive).";
    case "raise-negotiator":
      return "Only write a persuasive raise/budget increase email based on achievements and impact.";
    case "graceful-quitter":
      return "Only write a professional resignation letter that preserves relationships.";
    case "cold-dm-icebreaker":
      return "Only write a short, personalized cold DM/icebreaker for professional networking.";
    case "micromanager-tamer":
      return "Only write a boundary-setting message to a micromanager in a polite, firm way.";
    case "invoice-chaser":
      return "Only write a professional payment reminder for an overdue invoice.";
    case "perfect-apology":
      return "Only write a no-excuses apology that takes responsibility and proposes repair steps.";
    case "refund-demander":
      return "Only write a formal complaint/refund request email referencing consumer rights.";
    case "deadline-diplomat":
      return "Only write a professional extension request for a deadline, with a plan and new timeline.";
    case "landlord-diplomat":
      return "Only write diplomatic negotiation messages for landlord/tenant disputes, legally aware.";
    case "review-retaliator":
      return "Only write a calm, professional reply to an unfair negative review.";
    case "ghosting-resurrector":
      return "Only write a short follow-up message to revive a conversation without pressure.";
    case "passive-aggressive-decoder":
      return "Only decode passive-aggressive messages and craft a smart, non-escalating reply.";
    case "guilt-free-no":
      return "Only write a clear, kind refusal message without overexplaining.";
    case "delicate-truth":
      return "Only rewrite a hard truth into a gentle, non-blaming confrontation message.";
    case "co-parenting-peacemaker":
      return "Only write neutral, logistics-focused co-parenting messages that reduce conflict.";
    case "friendzone-navigator":
      return "Only write careful messages to confess feelings or set boundaries without harming friendship.";
    case "rsvp-diplomat":
      return "Only write a graceful decline for an important invitation without drama.";
  }
}

async function checkScope(client: OpenAI, payload: ToolPayload): Promise<ScopeResult> {
  const tool = payload.tool;
  const rawInput =
    tool === "coverletter-ai"
        ? `Job posting:\n${payload.jobLink}\n\nResume:\n${payload.resume}`
        : tool === "dating-roast"
          ? "text" in payload
            ? payload.text
            : payload.profile
          : payload.text;

  const allowed = [
    "corporate-whisperer",
    "coverletter-ai",
    "dating-roast",
    "raise-negotiator",
    "graceful-quitter",
    "cold-dm-icebreaker",
    "micromanager-tamer",
    "invoice-chaser",
    "perfect-apology",
    "refund-demander",
    "deadline-diplomat",
    "landlord-diplomat",
    "review-retaliator",
    "ghosting-resurrector",
    "passive-aggressive-decoder",
    "guilt-free-no",
    "delicate-truth",
    "co-parenting-peacemaker",
    "friendzone-navigator",
    "rsvp-diplomat",
    "unknown",
  ].join(", ");

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a strict classifier for a small AI tools suite.\n" +
          "Return ONLY valid JSON with keys: in_scope (boolean), reason (string), suggested_tool (string).\n" +
          `Allowed suggested_tool values: ${allowed}\n` +
          "IMPORTANT: Classify based on the user's INTENT and TOPIC, not the current tone or quality of writing.\n" +
          "For corporate-whisperer specifically, rude/angry/unprofessional drafts are IN SCOPE.\n" +
          "Do not include any extra keys, markdown, or text.",
      },
      {
        role: "user",
        content:
          `Selected tool: ${tool}\n` +
          `Tool scope: ${scopeInstructionsFor(tool)}\n\n` +
          "Decide whether the user's input is in scope for the selected tool.\n" +
          "If not, set in_scope=false and suggest the best tool (or unknown).\n\n" +
          `User input:\n${rawInput}`,
      },
    ],
  });

  const content = res.choices?.[0]?.message?.content?.trim() ?? "";
  try {
    const parsed = JSON.parse(content) as ScopeResult;
    if (typeof parsed?.in_scope !== "boolean") throw new Error("bad json");
    return {
      in_scope: parsed.in_scope,
      reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
      suggested_tool:
        typeof parsed.suggested_tool === "string" && isToolName(parsed.suggested_tool)
          ? parsed.suggested_tool
          : "unknown",
    };
  } catch {
    // Fail open: if classifier output can't be parsed, don't block generation.
    return { in_scope: true };
  }
}

function promptFor(payload: ToolPayload) {
  switch (payload.tool) {
    case "corporate-whisperer":
      return {
        system:
          "You are Corporate Whisperer.\n" +
          "Your ONLY job: rewrite emotional/rough messages into concise, polite, professional corporate emails.\n" +
          "If the request is not about rewriting a message/email, respond with a short refusal and suggest the correct tool (Cover Letter or Dating Profile) or ask for the message to rewrite.\n" +
          "Keep meaning, remove aggression, add a clear subject, greeting, and closing.\n" +
          "Output only the email.",
        user: payload.text,
      };
    case "coverletter-ai":
      return {
        system:
          "You are CoverLetter AI.\n" +
          "Your ONLY job: write a tailored, high-quality cover letter based on the job posting + the candidate resume.\n" +
          "If the request is not about a cover letter, respond with a short refusal and suggest the correct tool (Corporate Whisperer or Dating Profile) or ask for missing inputs.\n" +
          "Be specific, confident, and professional.\n" +
          "Output only the cover letter.",
        user: `Job posting:\n${payload.jobLink}\n\nCandidate resume:\n${payload.resume}`,
      };
    case "dating-roast":
      return {
        system:
          "You are Dating Roast.\n" +
          "Your ONLY job: critique and improve a dating profile bio.\n" +
          "If the request is not about improving a dating bio, respond with a short refusal and suggest the correct tool (Corporate Whisperer or Cover Letter) or ask for the bio.\n" +
          "Keep it kind, practical, and not mean.\n" +
          "Output format:\n1) Quick roast (3-6 bullets)\n2) Improved bio (one version)\n3) Optional variants (2 short alternatives)",
        user: "text" in payload ? payload.text : payload.profile,
      };
    case "raise-negotiator":
      return {
        system:
          "You are The Raise Negotiator.\n" +
          "Write a persuasive, professional email requesting a raise or budget increase.\n" +
          "Use the user's achievements and quantified impact. Include: subject line, context, impact bullets, clear ask, and a proposed meeting.\n" +
          "Tone: confident, respectful, non-entitled.\n" +
          "Output only the email.",
        user: payload.text,
      };
    case "graceful-quitter":
      return {
        system:
          "You are The Graceful Quitter.\n" +
          "Write a concise, professional resignation letter that preserves relationships.\n" +
          "Include: subject, resignation statement, last working day, gratitude, transition support.\n" +
          "Avoid oversharing or negativity.\n" +
          "Output only the letter.",
        user: payload.text,
      };
    case "cold-dm-icebreaker":
      return {
        system:
          "You are The Cold DM Icebreaker.\n" +
          "Write a short, personalized networking message for LinkedIn/email that maximizes reply rate.\n" +
          "Constraints: 60–120 words, 1 clear ask, 1 personalization detail, zero fluff, no sleazy sales.\n" +
          "Output only the message.",
        user: payload.text,
      };
    case "micromanager-tamer":
      return {
        system:
          "You are The Micromanager Tamer.\n" +
          "Write a polite but firm message that sets boundaries with a micromanager.\n" +
          "Include: empathy, clear boundary, suggested process (updates cadence), and a calm close.\n" +
          "Output only the message.",
        user: payload.text,
      };
    case "invoice-chaser":
      return {
        system:
          "You are The Invoice Chaser.\n" +
          "Write a professional overdue invoice reminder email.\n" +
          "Include: invoice reference, amount, due date, payment link/request, and a firm but friendly tone.\n" +
          "Avoid shaming; include next step if unpaid.\n" +
          "Output only the email.",
        user: payload.text,
      };
    case "perfect-apology":
      return {
        system:
          "You are The Perfect Apology.\n" +
          "Write a no-excuses apology that takes responsibility.\n" +
          "Include: acknowledgement, ownership, impact, repair plan, and invitation to respond.\n" +
          "No blame, no 'if you felt'. Output only the text.",
        user: payload.text,
      };
    case "refund-demander":
      return {
        system:
          "You are The Refund Demander.\n" +
          "Write a formal, assertive refund/compensation request.\n" +
          "Include: order details, timeline, what went wrong, what you want, a reasonable deadline, and mention consumer rights in general terms.\n" +
          "Professional, calm, firm. Output only the email.",
        user: payload.text,
      };
    case "deadline-diplomat":
      return {
        system:
          "You are The Deadline Diplomat.\n" +
          "Write a professional extension request that protects credibility.\n" +
          "Include: current status, reason (without excuses), revised timeline, risk mitigation, and next update date.\n" +
          "Output only the message/email.",
        user: payload.text,
      };
    case "landlord-diplomat":
      return {
        system:
          "You are The Landlord Diplomat.\n" +
          "Write a diplomatic negotiation message for a landlord/tenant dispute.\n" +
          "Be legally-aware but not giving legal advice; focus on facts, dates, reasonable requests, and de-escalation.\n" +
          "Output only the message.",
        user: payload.text,
      };
    case "review-retaliator":
      return {
        system:
          "You are The Review Retaliator.\n" +
          "Write a calm, professional reply to an unfair negative review.\n" +
          "Acknowledge feelings, state facts without arguing, offer a resolution path, protect brand voice.\n" +
          "Output only the public reply.",
        user: payload.text,
      };
    case "ghosting-resurrector":
      return {
        system:
          "You are The Ghosting Resurrector.\n" +
          "Write 3 short follow-up texts to revive a conversation without pressure.\n" +
          "Constraints: each under 160 characters, light tone, no guilt-tripping.\n" +
          "Output only the 3 messages, numbered 1-3.",
        user: payload.text,
      };
    case "passive-aggressive-decoder":
      return {
        system:
          "You are The Passive-Aggressive Decoder.\n" +
          "First, explain the likely subtext in 2-4 bullets.\n" +
          "Then write 2 smart reply options: one neutral, one firm.\n" +
          "No escalation, no insults.\n" +
          "Output format:\nSubtext:\n- ...\nReply A:\n...\nReply B:\n...",
        user: payload.text,
      };
    case "guilt-free-no":
      return {
        system:
          "You are The Guilt-Free \"No\".\n" +
          "Write 3 refusal message options: soft, direct, and very direct.\n" +
          "Be kind, clear, and final. No overexplaining.\n" +
          "Output only the 3 options, labeled Soft/Direct/Very direct.",
        user: payload.text,
      };
    case "delicate-truth":
      return {
        system:
          "You are The Delicate Truth.\n" +
          "Rewrite a difficult truth into a gentle, non-blaming message.\n" +
          "Use 'I' statements, focus on behavior and impact, propose a path forward.\n" +
          "Output only the message.",
        user: payload.text,
      };
    case "co-parenting-peacemaker":
      return {
        system:
          "You are The Co-Parenting Peacemaker.\n" +
          "Rewrite the message to be neutral, logistics-only, and conflict-minimizing.\n" +
          "Remove emotion, accusations, sarcasm. Keep dates, times, responsibilities.\n" +
          "Output only the message.",
        user: payload.text,
      };
    case "friendzone-navigator":
      return {
        system:
          "You are The Friendzone Navigator.\n" +
          "Write a careful message to confess feelings or set boundaries while preserving friendship.\n" +
          "Be respectful, clear, and low-pressure. Include an easy out.\n" +
          "Output only the message.",
        user: payload.text,
      };
    case "rsvp-diplomat":
      return {
        system:
          "You are The RSVP Diplomat.\n" +
          "Write a warm, respectful decline for an important invitation without drama.\n" +
          "Include: gratitude, clear decline, brief reason (optional), and well-wishes.\n" +
          "Output only the message.",
        user: payload.text,
      };
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY in environment." },
      { status: 500 }
    );
  }

  let body: unknown = null;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isToolPayload(body)) {
    return NextResponse.json(
      { error: "Invalid payload for tool." },
      { status: 400 }
    );
  }

  const model: ModelId = isModelId(body.model) ? body.model : "gpt-4o-mini";
  const { system, user } = promptFor(body);
  const client = new OpenAI({ apiKey });

  try {
    // (2) Hard gate: block out-of-scope inputs before generation.
    const scope = await checkScope(client, body);
    if (!scope.in_scope) {
      const suggestion =
        scope.suggested_tool && scope.suggested_tool !== "unknown"
          ? ` Try tool=${scope.suggested_tool}.`
          : "";
      return NextResponse.json(
        {
          error:
            `Out of scope for ${body.tool}. ` +
            (scope.reason ? `${scope.reason}` : "Please use the appropriate tool.") +
            suggestion,
        },
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.6,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json(
        { error: "Empty response from model." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { result: text },
      {
        headers: {
          "cache-control": "no-store",
        },
      }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "OpenAI request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

