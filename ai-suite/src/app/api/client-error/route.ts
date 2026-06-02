import { NextResponse } from "next/server";

import { reportServerError } from "@/lib/observability/report-error";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/security/same-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  message?: string;
  digest?: string;
  scope?: string;
  path?: string;
  stack?: string;
};

export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, "client-error", 12, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Rate limited." }, { status: 429 });
  }

  let hasSession = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    hasSession = Boolean(data.user?.id);
  } catch {
    hasSession = false;
  }

  if (!hasSession && !isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";
  if (!message) {
    return NextResponse.json({ error: "message required." }, { status: 400 });
  }

  await reportServerError({
    message,
    digest: typeof body.digest === "string" ? body.digest.slice(0, 64) : undefined,
    scope: typeof body.scope === "string" ? body.scope.slice(0, 64) : "client",
    path: typeof body.path === "string" ? body.path.slice(0, 256) : undefined,
    stack: typeof body.stack === "string" ? body.stack.slice(0, 1200) : undefined,
  });

  return NextResponse.json({ ok: true });
}
