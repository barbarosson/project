import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const DEFAULT_RETENTION_DAYS = 365;
const MIN_RETENTION_DAYS = 30;

function parseRetentionDays(): number {
  const raw = process.env.ISENDAI_REQUEST_RETENTION_DAYS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_RETENTION_DAYS;
  if (!Number.isFinite(n) || n < MIN_RETENTION_DAYS) return DEFAULT_RETENTION_DAYS;
  return n;
}

/** Secured maintenance: delete requests older than ISENDAI_REQUEST_RETENTION_DAYS (default 365). */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured." }, { status: 503 });
  }

  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const headerSecret = req.headers.get("x-cron-secret")?.trim();
  if ((bearer ?? headerSecret ?? "") !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const days = parseRetentionDays();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("purge_requests_older_than", {
    p_days: days,
  });

  if (error) {
    console.error("[purge-requests]", error.message);
    return NextResponse.json({ error: "Purge failed." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    retention_days: days,
    deleted_requests: typeof data === "number" ? data : 0,
  });
}
