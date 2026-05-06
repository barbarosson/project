import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const PostSchema = z.object({
  destination: z.string().min(1),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  total_budget: z.number().nullable().optional(),
  plan_markdown: z.string().min(1),
  rag_sources: z
    .array(
      z.object({
        title: z.string(),
        source_url: z.string().nullable().optional(),
        similarity: z.number().nullable().optional(),
      })
    )
    .optional(),
  status: z.enum(["draft", "planned", "booked", "completed"]).optional(),
});

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("trips")
    .select("id,destination,start_date,end_date,status,total_budget,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ trips: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await req.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const b = parsed.data;
  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      destination: b.destination,
      start_date: b.start_date ?? null,
      end_date: b.end_date ?? null,
      total_budget: b.total_budget ?? null,
      plan_markdown: b.plan_markdown,
      rag_sources: b.rag_sources ?? null,
      status: b.status ?? "planned",
    })
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tripId: data?.id });
}
