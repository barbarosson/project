import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isToolName, type ToolPayload } from "@/components/ai-suite/tools";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim() ?? "";
  if (!id || id.length < 10) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Sign in required.", code: "auth_required" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: reqRow, error } = await admin
    .schema("isendai")
    .from("requests")
    .select("id,owner_type,owner_id,tool_id,input_json")
    .eq("id", id)
    .maybeSingle();
  if (error || !reqRow) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (reqRow.owner_type !== "user" || reqRow.owner_id !== userId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const tool = typeof reqRow.tool_id === "string" ? reqRow.tool_id : "";
  if (!isToolName(tool)) {
    return NextResponse.json({ error: "Invalid tool." }, { status: 500 });
  }
  const payload = reqRow.input_json as unknown;
  if (!payload || typeof payload !== "object" || (payload as { tool?: unknown }).tool !== tool) {
    return NextResponse.json({ error: "Stored input missing." }, { status: 500 });
  }

  return NextResponse.json({ tool_id: tool, payload: payload as ToolPayload });
}

