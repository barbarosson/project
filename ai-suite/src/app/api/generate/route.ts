import { NextResponse } from "next/server";
import OpenAI from "openai";

type ToolPayload =
  | { tool: "corporate-whisperer"; text: string }
  | { tool: "coverletter-ai"; jobLink: string; resume: string }
  | { tool: "dating-roast"; profile: string };

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

function promptFor(payload: ToolPayload) {
  switch (payload.tool) {
    case "corporate-whisperer":
      return {
        system:
          "You are Corporate Whisperer. Rewrite emotional/rough messages into concise, polite, professional corporate emails. Keep meaning, remove aggression, add a clear subject, greeting, and closing. Output only the email.",
        user: payload.text,
      };
    case "coverletter-ai":
      return {
        system:
          "You are CoverLetter AI. Write a tailored, high-quality cover letter. Use the job link (or pasted job text) and the candidate resume bullets. Be specific, confident, and professional. Output only the cover letter.",
        user: `Job posting:\n${payload.jobLink}\n\nCandidate resume:\n${payload.resume}`,
      };
    case "dating-roast":
      return {
        system:
          "You are Dating Roast. Give constructive, witty critique of the profile bio, then propose an improved version. Keep it kind, practical, and not mean. Output format:\n1) Quick roast (3-6 bullets)\n2) Improved bio (one version)\n3) Optional variants (2 short alternatives)",
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

