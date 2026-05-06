# Adventora.ai (travel-ai-planner)

Next.js + Supabase + OpenAI ile **profil**, **Google OAuth**, **RAG (pgvector)** ve **kayıtlı seyahatler** içeren otonom seyahat ajanı iskeleti.

## Senin yapacağın tek şey: ortam değişkenleri

1. `.env.example` dosyasını `.env.local` olarak kopyala.
2. Şu değişkenleri doldur:
   - `OPENAI_API_KEY` — OpenAI
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase proje URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` — (sadece sunucu) RAG seed için
   - `RAG_SEED_SECRET` — `/api/rag/seed` çağrıları için güçlü bir sırrın
   - `NEXT_PUBLIC_SITE_URL` — lokal: `http://localhost:3000`

3. Supabase SQL Editor veya CLI ile `supabase/migrations/` altındaki SQL dosyalarını sırayla uygula (`vector` eklentisi gerekir).
4. Supabase **Auth → Providers → Google** açık; redirect URL: `https://<project>.supabase.co/auth/v1/callback` ve Google Console’da aynı client ID/secret.

## Çalıştırma

```bash
npm install
npm run dev
```

- Ana sayfa: `/`
- Planlayıcı (herkese açık API plan): `/planner`
- Giriş: `/login`
- Panel: `/dashboard`

## RAG örnek içerik yükleme (opsiyonel)

```bash
curl -X POST http://localhost:3000/api/rag/seed \
  -H "Content-Type: application/json" \
  -H "x-rag-seed-secret: YOUR_RAG_SEED_SECRET" \
  -d '{"documents":[{"destinationSlug":"istanbul","title":"Kadıköy Moda","content":"Sakin kahve ve sahilde yürüyüş...","sourceUrl":"https://example.com"}]}'
```

`destinationSlug`, plan formundaki destinasyonun `slug` dönüşümüyle eşleşmeli (bkz. `src/lib/slug.ts`).

## Mimari özet

| Parça | Dosya / klasör |
|--------|-----------------|
| Şema | `supabase/migrations/` |
| Plan + RAG | `src/app/api/plan/route.ts` |
| Profil API | `src/app/api/profile/route.ts` |
| Seyahatler API | `src/app/api/trips/` |
| RAG seed | `src/app/api/rag/seed/route.ts` |
| Oturum | `src/middleware.ts`, `src/lib/supabase/*` |

Gmail / Calendar / ödeme: `src/app/api/integrations/status/route.ts` yer tutucu; sonraki fazda Google Cloud & Stripe anahtarlarıyla genişletilir.
