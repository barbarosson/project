import { NextResponse } from "next/server";

import { WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE } from "@/lib/welcome-bonus/constants";
import { processWelcomeBonusForUser } from "@/lib/welcome-bonus/welcome-bonus-service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const rl = await enforceRateLimit(req, "welcome-bonus", 20, 60_000);
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

  const result = await processWelcomeBonusForUser(user);

  return NextResponse.json({
    bonus_credits: WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE,
    result,
  });
}
