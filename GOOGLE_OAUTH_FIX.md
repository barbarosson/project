# Google ile Giriş Hatası Düzeltme (modulusaas.com)

Email/şifre çalışıyor ama "Google ile devam et" hata veriyorsa, aşağıdaki **3 yeri** kontrol edin:

---

## 1. Google Cloud Console

**Adres:** https://console.cloud.google.com/apis/credentials

1. Projenizi seçin → **OAuth 2.0 Client IDs** → client’a tıklayın

2. **Authorized JavaScript origins** — şunları ekleyin:
   ```
   https://modulusaas.com
   https://www.modulusaas.com
   https://itvrvouaxcutpetyzhvg.supabase.co
   ```

3. **Authorized redirect URIs** — şunu ekleyin (tek satır):
   ```
   https://itvrvouaxcutpetyzhvg.supabase.co/auth/v1/callback
   ```

4. **Kaydedin** (Save)

---

## 2. Supabase Dashboard

**Adres:** https://app.supabase.com → Projeniz → **Authentication** → **URL Configuration**

1. **Site URL:**
   ```
   https://modulusaas.com
   ```

2. **Redirect URLs** listesine şunları ekleyin:
   ```
   https://modulusaas.com/**
   https://modulusaas.com/auth/callback
   https://www.modulusaas.com/**
   https://www.modulusaas.com/auth/callback
   ```

3. **Kaydedin**

---

## 3. OAuth Consent Screen (Google)

**Adres:** https://console.cloud.google.com/apis/credentials/consent

- **Publishing status:** "In production" olmalı (test modunda kısıtlı kullanıcı sayısı vardır)
- **Authorized domains** kısmında `modulusaas.com` olmalı

---

## Hızlı özet

| Yer                 | Eklenmesi gereken                              |
|---------------------|-------------------------------------------------|
| Google – Origins   | `https://modulusaas.com`, `https://www.modulusaas.com`, `https://itvrvouaxcutpetyzhvg.supabase.co` |
| Google – Redirect  | `https://itvrvouaxcutpetyzhvg.supabase.co/auth/v1/callback` |
| Supabase – Site URL| `https://modulusaas.com`                        |
| Supabase – Redirect| `https://modulusaas.com/**`, `https://modulusaas.com/auth/callback` |

Değişiklikler 1–2 dakika içinde geçerli olur. Sonrasında Google ile tekrar deneyin.
