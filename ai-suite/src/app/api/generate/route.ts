import { NextResponse } from "next/server";
import OpenAI from "openai";

type ToolPayload =
  | { tool: "corporate-whisperer"; text: string }
  | { tool: "coverletter-ai"; jobLink: string; resume: string }
  | { tool: "dating-roast"; profile: string };

type ScopeResult = {
  in_scope: boolean;
  reason?: string;
  suggested_tool?: ToolPayload["tool"] | "unknown";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isToolPayload(value: unknown): value is ToolPayload {
  if (!isRecord(value)) return false;
  const tool = value.tool;
  if (tool === "corporate-whisperer") return typeof value.text === "string";
  if (tool === "coverletter-ai")
    return typeof value.jobLink === "string" && typeof value.resume === "string";
  if (tool === "dating-roast") return typeof value.profile === "string";
  return false;
}

function scopeInstructionsFor(tool: ToolPayload["tool"]) {
  switch (tool) {
    case "corporate-whisperer":
      return "Only corporate/professional email rewriting (tone-polishing).";
    case "coverletter-ai":
      return "Only writing a tailored cover letter based on job posting + candidate resume.";
    case "dating-roast":
      return "Only critique + improve a dating profile bio (kind, constructive).";
  }
}

async function checkScope(client: OpenAI, payload: ToolPayload): Promise<ScopeResult> {
  const tool = payload.tool;
  const rawInput =
    tool === "corporate-whisperer"
      ? payload.text
      : tool === "coverletter-ai"
        ? `Job posting:\n${payload.jobLink}\n\nResume:\n${payload.resume}`
        : payload.profile;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a strict classifier for a small AI tools suite.\n" +
          "Return ONLY valid JSON with keys: in_scope (boolean), reason (string), suggested_tool (one of: corporate-whisperer, coverletter-ai, dating-roast, unknown).\n" +
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
        parsed.suggested_tool === "corporate-whisperer" ||
        parsed.suggested_tool === "coverletter-ai" ||
        parsed.suggested_tool === "dating-roast" ||
        parsed.suggested_tool === "unknown"
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
        user: payload.profile,
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
      model: "gpt-4o-mini",
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

