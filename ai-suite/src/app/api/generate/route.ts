import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

import { TOOLS, getToolDefinition, type ToolName, type ToolPayload } from "@/components/ai-suite/tools";

type OpenAIModelId = "gpt-4o-mini" | "gpt-4.1-mini" | "gpt-4o";
type RequestBody = ToolPayload & { model?: OpenAIModelId };

type ScopeResult = {
  in_scope: boolean;
  reason?: string;
  suggested_tool?: ToolName | "unknown";
};

function isToolName(value: string): value is ToolName {
  return TOOLS.some((t) => t.tool === value);
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

function isOpenAIModelId(value: unknown): value is OpenAIModelId {
  return value === "gpt-4o-mini" || value === "gpt-4.1-mini" || value === "gpt-4o";
}

function rawInputFor(payload: ToolPayload) {
  const tool = payload.tool;
  if (tool === "coverletter-ai" && "jobLink" in payload && "resume" in payload) {
    return `Job posting:\n${payload.jobLink}\n\nResume:\n${payload.resume}`;
  }
  if (tool === "dating-roast") {
    return "text" in payload ? payload.text : payload.profile;
  }
  return "text" in payload ? payload.text : "";
}

function pickProviderAndModel(payload: ToolPayload, requestedOpenAIModel?: OpenAIModelId) {
  const def = getToolDefinition(payload.tool);
  const provider = def.provider ?? "openai";

  if (provider === "anthropic") {
    return {
      provider: "anthropic" as const,
      model: def.model ?? "claude-3-5-haiku-latest",
    };
  }

  // openai
  return {
    provider: "openai" as const,
    model: (requestedOpenAIModel ?? (def.model as OpenAIModelId | undefined) ?? "gpt-4o-mini") as OpenAIModelId,
  };
}

async function checkScope(payload: ToolPayload): Promise<ScopeResult> {
  const tool = payload.tool;
  const def = getToolDefinition(tool);
  const rawInput = rawInputFor(payload);

  const allowed = [...TOOLS.map((t) => t.tool), "unknown"].join(", ");

  const { provider, model } = pickProviderAndModel(payload, "gpt-4o-mini");

  // Fail-open if the required key is missing.
  if (provider === "openai" && !process.env.OPENAI_API_KEY) return { in_scope: true };
  if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) return { in_scope: true };

  const system =
    "You are a strict classifier for a small AI tools suite.\n" +
    "Return ONLY valid JSON with keys: in_scope (boolean), reason (string), suggested_tool (string).\n" +
    `Allowed suggested_tool values: ${allowed}\n` +
    "IMPORTANT: Classify based on the user's INTENT and TOPIC, not the current tone or quality of writing.\n" +
    "For corporate-whisperer specifically, rude/angry/unprofessional drafts are IN SCOPE.\n" +
    "Do not include any extra keys, markdown, or text.";

  const prompt =
    `Selected tool: ${tool}\n` +
    `Tool scope: ${def.scopeHint}\n\n` +
    "Decide whether the user's input is in scope for the selected tool.\n" +
    "If not, set in_scope=false and suggest the best tool (or unknown).\n\n" +
    `User input:\n${rawInput}`;

  const result = await generateText({
    model: provider === "anthropic" ? anthropic(model) : openai(model),
    temperature: 0,
    system,
    prompt,
  });

  const content = result.text?.trim() ?? "";
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
  const def = getToolDefinition(payload.tool);
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
        user:
          "jobLink" in payload && "resume" in payload
            ? `Job posting:\n${payload.jobLink}\n\nCandidate resume:\n${payload.resume}`
            : "",
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
    default: {
      if (payload.tool === "coverletter-ai" && "jobLink" in payload && "resume" in payload) {
        return {
          system: def.systemPrompt,
          user: `Job posting:\n${payload.jobLink}\n\nCandidate resume:\n${payload.resume}`,
        };
      }
      const text =
        payload.tool === "dating-roast"
          ? "text" in payload
            ? payload.text
            : payload.profile
          : "text" in payload
            ? payload.text
            : "";
      return { system: def.systemPrompt, user: text };
    }
  }
}

export async function POST(req: Request) {
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

  const { system, user } = promptFor(body);
  const chosen = pickProviderAndModel(body, isOpenAIModelId(body.model) ? body.model : undefined);

  if (chosen.provider === "openai" && !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY in environment." }, { status: 500 });
  }
  if (chosen.provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Missing ANTHROPIC_API_KEY in environment." },
      { status: 500 }
    );
  }

  try {
    // (2) Hard gate: block out-of-scope inputs before generation.
    const scope = await checkScope(body);
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

    const out = await generateText({
      model: chosen.provider === "anthropic" ? anthropic(chosen.model) : openai(chosen.model),
      temperature: 0.6,
      system,
      prompt: user,
    });

    const text = out.text?.trim();
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
    const message = e instanceof Error ? e.message : "AI request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

