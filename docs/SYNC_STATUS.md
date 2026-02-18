# GitHub, Netlify, Supabase, Cursor senkron durumu

Son kontrol: 2026-02-18 (bu dosya güncellenmediyse tarihi kendin not et.)

---

## 1. Cursor ↔ GitHub

| Kontrol | Durum |
|--------|--------|
| Yerel commit'ler GitHub'a push edildi mi? | Evet: `main` = `origin/main` |
| Commit'lenmemiş değişiklik var mı? | Hayır (docs ve .gitignore push edildi) |
| **Nasıl kontrol edilir?** | `git status` → "nothing to commit, working tree clean" ve `git log origin/main -1` = local HEAD |

---

## 2. GitHub ↔ Netlify

| Kontrol | Durum |
|--------|--------|
| Netlify bu repo'ya bağlı mı? | Evet (önceden yapılandırıldı) |
| Deploy tetikleyici | Her `main` branch'e push'ta otomatik build |
| Son push ile Netlify aynı commit'te mi? | Push sonrası 1–2 dk içinde Netlify aynı commit'ten deploy eder |
| **Nasıl kontrol edilir?** | Netlify Dashboard → Deploys → en üstteki deploy'un "Commit" hash'i = GitHub `main` son commit |

**Netlify ortam değişkenleri (build için gerekli):**  
`SUPABASE_ANON_KEY`, `SUPABASE_DATABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` vb. NETLIFY_ENV_VARIABLES.md’e bak.

---

## 3. Supabase (remote veritabanı)

| Kontrol | Durum |
|--------|--------|
| Şema (tablolar, kolonlar) | Güncel: `invoice_type` vb. Dashboard’da çalıştırılan SQL ile uygulandı |
| Migration geçmişi | Local ile tam uyumlu değil (bazı migration’lar sadece dosyada, remote’da kayıt yok) |
| Yeni migration’lar | Yeni .sql ekleyince: `npx supabase db push` veya SQL’i Dashboard’da çalıştırıp `migration repair --status applied` |

**Not:** Uygulama aynı Supabase projesine bağlı (NEXT_PUBLIC_SUPABASE_URL). Ortam değişkenleri Netlify’da doğruysa canlı site bu DB’yi kullanır.

---

## 4. Cursor (yerel)

| Kontrol | Durum |
|--------|--------|
| Branch | `main` |
| Uzak ile fark | Yok (push edildi) |
| Takip edilmeyen dosyalar | `supabase/.temp/` .gitignore’da; görünmez |

---

## Hızlı kontrol komutları

```bash
# Cursor = GitHub?
git fetch origin && git status
# "Your branch is up to date with 'origin/main'" ve "nothing to commit"

# Son commit hash (GitHub/Netlify ile karşılaştır)
git rev-parse HEAD
```

---

## Aktarılmayan bir şey kaldı mı?

- **Kod:** Hayır. Son değişiklikler (edit-invoice-dialog type, docs, .gitignore) commit + push edildi.
- **Supabase şema:** `invoice_type` ve ilgili index’ler SQL ile uygulandı; migration geçmişi kısmen farklı, şema güncel.
- **Netlify:** GitHub’daki `main`’e bağlı; son push ile birkaç dakika içinde güncel deploy alır.

Bu dosyayı büyük değişiklik sonrası veya ayda bir güncellemek faydalıdır.
