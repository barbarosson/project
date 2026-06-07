import { NextResponse } from "next/server";

import { deleteUserAccount } from "@/lib/account/delete-user-account";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CONFIRM_PHRASE = "DELETE";

export async function POST(req: Request) {
  const rl = await enforceRateLimit(req, "account-delete", 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests.", code: "rate_limited" },
      { status: 429, headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return NextResponse.json({ error: "Sign in required.", code: "auth_required" }, { status: 401 });
  }

  let body: { confirm?: string } = {};
  try {
    body = (await req.json()) as { confirm?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body.", code: "invalid_body" }, { status: 400 });
  }

  if (body.confirm?.trim() !== CONFIRM_PHRASE) {
    return NextResponse.json(
      { error: "Confirmation phrase required.", code: "confirm_required" },
      { status: 400 }
    );
  }

  const result = await deleteUserAccount(user.id);
  if (!result.ok) {
    const status =
      result.code === "not_configured" ? 503 : result.code === "auth_required" ? 401 : 500;
    return NextResponse.json({ error: result.message, code: result.code }, { status });
  }

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
