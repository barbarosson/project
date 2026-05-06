import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createEmbedding } from "@/lib/openai";

export const runtime = "nodejs";

const DocSchema = z.object({
  destinationSlug: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  sourceUrl: z.string().url().optional(),
});

const BodySchema = z.object({
  documents: z.array(DocSchema).min(1).max(20),
});

export async function POST(req: Request) {
  const secret = req.headers.get("x-rag-seed-secret");
  if (!secret || secret !== process.env.RAG_SEED_SECRET) {
    return NextResponse.json({ error: "Geçersiz veya eksik x-rag-seed-secret" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openai = process.env.OPENAI_API_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY veya NEXT_PUBLIC_SUPABASE_URL eksik" },
      { status: 500 }
    );
  }
  if (!openai) {
    return NextResponse.json({ error: "OPENAI_API_KEY eksik" }, { status: 500 });
  }

  const body: unknown = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createClient(url, serviceKey);
  const inserted: string[] = [];

  for (const doc of parsed.data.documents) {
    const embedding = await createEmbedding(`${doc.title}\n${doc.content}`, openai);
    const { data, error } = await admin
      .from("destination_documents")
      .insert({
        destination_slug: doc.destinationSlug,
        title: doc.title,
        content: doc.content,
        source_url: doc.sourceUrl ?? null,
        embedding,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message, inserted }, { status: 400 });
    }
    if (data?.id) inserted.push(data.id);
  }

  return NextResponse.json({ ok: true, count: inserted.length, ids: inserted });
}
