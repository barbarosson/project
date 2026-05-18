# Model B — İki Netlify sitesi (staging + production)

Bu proje **aynı GitHub reposunu** iki ayrı Netlify sitesine bağlar:

| Site | Git branch | Birincil URL | Amaç |
|------|------------|--------------|------|
| **Production** (mevcut — Adım 1 tamam) | `main` | `https://isendai.com` | Canlı müşteri trafiği |
| **Staging** (yeni site — Adım 2) | `staging` | `https://isendai.netlify.app` | Test ve onay |

Her iki site de repo kökündeki `netlify.toml` dosyasını kullanır (`base = "ai-suite"`).

---

## 1) Git: `staging` branch

Repoda `staging` branch var. Uzak repoya gönderin:

```bash
git push -u origin staging
```

**Günlük akış**

1. Geliştirme → commit → `git push origin staging` → **https://isendai.netlify.app** güncellenir.
2. Test / onay.
3. `git checkout main && git merge staging && git push origin main` → **https://isendai.com** güncellenir.

---

## 2) Netlify — Production sitesi ✅ (tamamlandı)

Kontrol (zaten yaptıysanız atlayın):

- **Production branch:** `main`
- **Primary domain:** `isendai.com` (ve isteğe bağlı `www` → primary)
- **Env:** `NEXT_PUBLIC_DEPLOY_ENV=production`, `NEXT_PUBLIC_SITE_URL=https://isendai.com`
- **Lemon webhook:** yalnızca `https://isendai.com/api/webhook`

### Production’dan `isendai.netlify.app` adresini ayırın (Adım 2 için zorunlu)

Aynı subdomain iki siteye bağlanamaz. Staging’in `isendai.netlify.app` kullanması için:

1. **Production** Netlify sitesi → **Domain management**
2. Listede **`isendai.netlify.app`** varsa → **Remove** / **Delete** (veya “Stop using Netlify DNS” — sadece custom domain kalsın)
3. Production sitesinde yalnızca **`isendai.com`** (ve `www` yönlendirmesi) kalsın

> Netlify site **adı** (slug) hâlâ `isendai` olabilir; önemli olan domain listesinde `isendai.netlify.app`’in production’da **olmaması**.

---

## 3) Netlify — Staging sitesi (`https://isendai.netlify.app`)

### 3.1 Yeni site oluştur

1. [Netlify](https://app.netlify.com/) → **Add new site** → **Import an existing project** → **aynı GitHub repo**.
2. Build ayarları `netlify.toml`’dan gelir; dokunmayın.
3. **Production branch:** `staging` (**`main` değil**).
4. **`isendai.com` bu siteye eklemeyin.**

### 3.2 Site adını `isendai` yapın → `isendai.netlify.app`

Netlify varsayılan adresi: `https://<site-adı>.netlify.app`

1. Yeni site → **Site configuration → General → Site details** → **Change site name**
2. Site adı: **`isendai`** → kaydedin → birincil URL **`https://isendai.netlify.app`** olur.

**“Site name already taken” hatası** (production sitesi slug’ı `isendai` ise):

1. **Production** sitesi → Site name’i geçici olarak **`isendai-prod`** (veya benzeri) yapın.
2. **Staging** sitesi → Site name **`isendai`** yapın → `isendai.netlify.app` staging’e bağlanır.
3. (İsteğe bağlı) Production slug’ı `isendai-prod` olarak bırakabilirsiniz; müşteriler yine `isendai.com` kullanır.

### 3.3 Domain doğrulama

Staging sitesi → **Domain management**:

- Birincil adres: **`isendai.netlify.app`**
- `isendai.com` **yok**

### 3.4 Environment variables (staging sitesi)

| Değişken | Değer |
|----------|--------|
| `NEXT_PUBLIC_DEPLOY_ENV` | `staging` |
| `NEXT_PUBLIC_SITE_URL` | `https://isendai.netlify.app` |
| `NEXT_PUBLIC_PRODUCTION_SITE_URL` | `https://isendai.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production ile aynı **veya** ayrı staging Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
| `SUPABASE_SERVICE_ROLE_KEY` | |
| `OPENAI_API_KEY` | |
| Lemon | Test mode / ayrı store önerilir |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Production ile **aynı olmasın**; Lemon’da webhook URL staging’e **yazmayın** |

Deploy: **Deploys → Trigger deploy → Clear cache and deploy** (env sonrası).

### 3.5 Staging’i doğrulayın

- [ ] `https://isendai.netlify.app` açılıyor
- [ ] Üstte sarı **Staging** şeridi var
- [ ] `https://isendai.com` staging şeridi **göstermiyor** (production)

---

## 4) Supabase — URL Configuration

**Authentication → URL Configuration:**

```
https://isendai.com/**
https://isendai.netlify.app/**
http://localhost:3000/**
```

| Alan | Değer |
|------|--------|
| **Site URL** | `https://isendai.com` |

---

## 5) Lemon Squeezy

| Ortam | Webhook |
|--------|---------|
| Production | `https://isendai.com/api/webhook` |
| Staging | Kayıt yok (veya test store + ayrı secret) |

---

## 6) Kontrol listesi

### Staging (`push` → `staging` branch)

- [ ] URL: `https://isendai.netlify.app`
- [ ] Sarı staging şeridi
- [ ] Giriş + en az bir araç üretimi
- [ ] Lemon canlı webhook bu host’a gitmiyor

### Production (`merge` → `main`)

- [ ] URL: `https://isendai.com` — staging şeridi yok
- [ ] `isendai.netlify.app` production domain listesinde **yok**
- [ ] Lemon webhook yalnızca `isendai.com`

---

## 7) Örnek env dosyaları

- `ai-suite/.env.production.example`
- `ai-suite/.env.staging.example` → `NEXT_PUBLIC_SITE_URL=https://isendai.netlify.app`

---

## 8) CI

GitHub Actions (`ci-ai-suite.yml`) `main` ve `staging` üzerinde lint / typecheck / build çalıştırır.
