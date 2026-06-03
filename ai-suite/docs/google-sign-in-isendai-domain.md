# Google giriş — isendai.com görünsün (ücretsiz, Supabase custom domain yok)

Standart `signInWithOAuth` akışında Google ekranında `xxxx.supabase.co` görünür.  
Bu projede **Google Identity Services + `signInWithIdToken`** kullanılıyor; callback tarayıcıda **isendai.com** üzerinde kalır.

Eski akış bozulmaz: `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` yoksa veya GIS engellenirse otomatik **Supabase hosted OAuth** (`/auth/connecting`) devreye girer.

---

## Adım 1 — Google Cloud (aynı OAuth client)

1. [Google Cloud Console](https://console.cloud.google.com/) → projeniz → **APIs & Services** → **Credentials**.
2. **OAuth 2.0 Client ID** (Web application) — Supabase’te Google provider’a yapıştırdığınız **aynı** Client ID.
3. **Authorized JavaScript origins** ekleyin:
   - `https://isendai.com`
   - `https://isendai.netlify.app` (staging)
   - `http://localhost:3001` (local dev)
4. **Authorized redirect URIs** — GIS + yedek Supabase için **ikisini** tutun:
   - `https://isendai.com` (origin yeterli; GIS redirect kullanmıyorsanız boş bırakmayın, en azından site kökü)
   - `https://<project-ref>.supabase.co/auth/v1/callback` (yedek hosted OAuth)
   - Staging / localhost için aynı mantık
5. **OAuth consent screen → Branding**:
   - App name: **isendai**
   - Home: `https://isendai.com`
   - Privacy: `https://isendai.com/privacy`
   - Terms: `https://isendai.com/terms`
   - Authorized domains: `isendai.com`
6. **Brand verification** gönderin (birkaç iş günü).

---

## Adım 2 — Supabase Dashboard

1. **Authentication → Providers → Google**: Açık, **aynı** Client ID + Client Secret.
2. **Authentication → URL Configuration**:
   - Site URL: `https://isendai.com`
   - Redirect URLs: `https://isendai.com/**`, staging, localhost
3. Google provider ayarında **Skip nonce check** = **ON** (GIS ID token için; Supabase dokümantasyonuna göre).

---

## Adım 3 — Netlify env (production)

Site: **isendai.com** → Environment variables:

```env
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=<Google Web Client ID>
```

Mevcut değişkenler aynı kalır:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL=https://isendai.com`

Deploy sonrası yeni build şart.

Staging (`isendai.netlify.app`) için aynı Client ID + origins’e staging URL ekli olmalı.

---

## Adım 4 — Test

1. Gizli pencerede `https://isendai.com/login`
2. **Google ile devam et**
3. Google ekranında **isendai** / **isendai.com** görünmeli; `qnvwartleeplaevqsrya.supabase.co` görünmemeli.
4. Giriş sonrası `/auth/completing` → ana sayfa veya profil.

Sorun çıkarsa: env eksikse veya GIS bloklanırsa eski Supabase redirect devreye girer (supabase.co tekrar görünebilir).

---

## Sık hatalar

| Belirti | Çözüm |
|--------|--------|
| `Invalid nonce` | Supabase → Google → Skip nonce check ON |
| Hâlâ supabase.co | `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` deploy’da yok veya yanlış |
| `origin_mismatch` | Google origins’e tam site URL ekleyin |
| One Tap çıkmıyor | Orta ekranda Google butonu overlay açılır (otomatik fallback) |
| `Google script failed to load` (sadece canlı) | CSP `accounts.google.com` engelliyordu — `next.config.mjs` güncellendi; redeploy gerekir |
| `401 invalid_client` / OAuth client was not found | Netlify `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` yanlış veya Client **Secret** yapıştırılmış. Sadece **Client ID** (`….apps.googleusercontent.com`). Değiştirdikten sonra **Clear cache and deploy** |
