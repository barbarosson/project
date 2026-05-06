import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { destinationSlug } from "@/lib/slug";
import { chatCompletionMarkdown, createEmbedding } from "@/lib/openai";

export const runtime = "nodejs";

const TripStyleEnum = z.enum([
  "budget",
  "comfort",
  "luxury",
  "family",
  "romantic",
  "adventure",
  "culture",
  "food",
  "beach",
]);

const BodySchema = z.object({
  origin: z.string().optional(),
  destination: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  days: z.coerce.number().min(1).max(30).default(4),
  people: z.coerce.number().min(1).max(20).default(2),
  budget: z.coerce.number().optional(),
  currency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  style: TripStyleEnum.default("culture"),
  interests: z.string().default(""),
  constraints: z.string().optional(),
  pace: z.enum(["relaxed", "balanced", "packed"]).default("balanced"),
  saveTrip: z.boolean().optional(),
});

type PlannerInput = z.infer<typeof BodySchema>;

type RagRow = {
  id: string;
  destination_slug: string;
  title: string;
  content: string;
  source_url: string | null;
  similarity: number | null;
};

function buildProfileLines(profile: Record<string, unknown> | null): string[] {
  if (!profile) return [];
  const lines: string[] = [];
  const style = profile.travel_style as string | undefined;
  const city = profile.home_city as string | undefined;
  const diet = profile.dietary_notes as string | undefined;
  const pace = profile.pace as string | undefined;
  const interests = profile.interests as string[] | undefined;
  if (style) lines.push(`Tercih edilen stil: ${style}`);
  if (city) lines.push(`Yerleşik şehir: ${city}`);
  if (diet) lines.push(`Beslenme/kısıt: ${diet}`);
  if (pace) lines.push(`Tempo (profil): ${pace}`);
  if (interests?.length) lines.push(`İlgi alanları (profil): ${interests.join(", ")}`);
  const prefs = profile.preferences;
  if (prefs && typeof prefs === "object") {
    lines.push(`Ek tercihler (JSON): ${JSON.stringify(prefs).slice(0, 500)}`);
  }
  return lines;
}

function buildPrompt(input: PlannerInput, profileLines: string[], ragBlock: string) {
  const dateLine =
    input.startDate && input.endDate
      ? `Tarih aralığı: ${input.startDate} → ${input.endDate}`
      : `Süre: ${input.days} gün`;

  const budgetLine = input.budget
    ? `Toplam bütçe hedefi: ${input.budget} ${input.currency}`
    : "Toplam bütçe hedefi: Belirtilmedi (makul varsayılanlar kullan).";

  return [
    "Türkçe yaz.",
    "Sen bir otomatik seyahat asistanısın (Adventora). Lojistik olarak mantıklı, uygulanabilir Markdown üret.",
    "",
    "### Bağlam: RAG pasajları",
    "Aşağıdaki pasajlar yerel/off-the-beaten-path kaynaklarından gelmiş olabilir. Uygun yerlerde **[kaynak: başlık]** şeklinde atıf yap.",
    ragBlock || "(Bu tur için henüz vektör kaydı yok; genel bilgi + güvenli varsayılanlar kullan.)",
    "",
    "### Kullanıcı profili",
    ...(profileLines.length ? profileLines : ["Profil yok veya giriş yapılmadı."]),
    "",
    "### İstek",
    `Kalkış: ${input.origin || "Belirtilmedi"}`,
    `Varış: ${input.destination}`,
    dateLine,
    `Kişi: ${input.people}`,
    budgetLine,
    `Stil (form): ${input.style}`,
    `Tempo (form): ${input.pace}`,
    `İlgi alanları (form): ${input.interests || "Belirtilmedi"}`,
    `Ek kısıtlar: ${input.constraints || "Yok"}`,
    "",
    "### Çıktı formatı",
    "1) Özet",
    "2) Gün gün program (sabah/öğle/akşam + tahmini süreler + ulaşım notları)",
    "3) Yaklaşık bütçe kırılımı (aralıklı)",
    "4) Rezervasyon / arama ipuçları (uçuş, otel, araç — kesin fiyat yok)",
    "5) Alternatifler (hava, yorgunluk)",
    "6) Kontrol listesi",
    "",
    "Kurallar: uydurma telefon/adres verme; fiyat sadece aralık; güvenlik ve gerçekçilik önce.",
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY tanımlı değil. `.env.local` içine ekleyin." },
        { status: 500 }
      );
    }

    const body: unknown = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const input = parsed.data;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let profileLines: string[] = [];
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      profileLines = buildProfileLines((profile ?? null) as Record<string, unknown> | null);
    }

    const slug = destinationSlug(input.destination);
    let ragBlock = "";
    const ragSources: { title: string; source_url?: string | null; similarity?: number | null }[] =
      [];

    try {
      const embedText = `${input.destination}. ${input.interests}. ${input.constraints ?? ""}`;
      const embedding = await createEmbedding(embedText, OPENAI_API_KEY);
      const { data: matches, error: ragError } = await supabase.rpc("match_destination_docs", {
        query_embedding: embedding,
        match_count: 5,
        filter_slug: slug,
      });

      if (!ragError && matches && Array.isArray(matches)) {
        const rows = matches as RagRow[];
        ragBlock = rows
          .map(
            (r, i) =>
              `#### Pasaj ${i + 1}: ${r.title} (${r.destination_slug})\nKaynak: ${r.source_url ?? "yok"}\n${r.content.slice(0, 1200)}`
          )
          .join("\n\n");
        for (const r of rows) {
          ragSources.push({
            title: r.title,
            source_url: r.source_url,
            similarity: r.similarity,
          });
        }
      }
    } catch {
      /* RAG opsiyonel: embed veya rpc yoksa devam */
    }

    const userPrompt = buildPrompt(input, profileLines, ragBlock);
    const system =
      "Yerel önerileri RAG pasajlarıyla destekle; pasaj yoksa dürüstçe genel öneri ver. Çıktı Markdown.";

    const plan = await chatCompletionMarkdown({
      apiKey: OPENAI_API_KEY,
      model,
      system,
      user: userPrompt,
      maxTokens: 1400,
    });

    let tripId: string | undefined;
    if (user && input.saveTrip) {
      const { data: tripRow, error: tripErr } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          destination: input.destination,
          start_date: input.startDate ?? null,
          end_date: input.endDate ?? null,
          total_budget: input.budget ?? null,
          plan_markdown: plan,
          rag_sources: ragSources,
          status: "planned",
        })
        .select("id")
        .maybeSingle();

      if (!tripErr && tripRow?.id) tripId = tripRow.id;
    }

    return NextResponse.json({ plan, ragSources, tripId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Beklenmeyen hata.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
