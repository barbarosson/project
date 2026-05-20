import { NextResponse } from "next/server";

import { saveContactInquiry } from "@/lib/contact/save-contact-inquiry";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  locale?: string;
  _hp?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "contact", 8, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many messages. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) } }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const honeypot = typeof body._hp === "string" ? body._hp.trim() : "";
  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!message || message.length < 10) {
    return NextResponse.json({ error: "Message must be at least 10 characters." }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  const locale = typeof body.locale === "string" ? body.locale.trim().slice(0, 8) : null;
  const referer = req.headers.get("referer");
  let sourcePath: string | null = "/contact";
  if (referer) {
    try {
      sourcePath = new URL(referer).pathname;
    } catch {
      sourcePath = "/contact";
    }
  }

  const result = await saveContactInquiry({
    name,
    email,
    subject: subject || null,
    message,
    userId,
    locale,
    sourcePath,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
