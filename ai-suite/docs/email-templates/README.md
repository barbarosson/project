# isendai — Supabase e-posta şablonları

Bu klasördeki HTML dosyalarını **Supabase Dashboard → Authentication → Email Templates** içinde ilgili şablona yapıştırın. Şablonlar site temasıyla uyumludur: koyu arka plan (`#09090b`), violet/indigo vurgu, okunabilir tipografi (e-posta istemcilerinde güvenli sistem fontları).

## Kurulum

1. [Email Templates](https://supabase.com/dashboard/project/_/auth/templates) sayfasını açın.
2. Her şablon için aşağıdaki tablodaki **Subject** satırını konu alanına, **Body** için `.html` dosyasının tam içeriğini yapıştırın.
3. **Kaydedin.** `{{ .RedirectTo }}`, `{{ .TokenHash }}`, `{{ .Email }}` gibi ifadeleri değiştirmeyin; Supabase bunları otomatik doldurur.

**Mobil uyumluluk:** Onay, magic link ve şifre sıfırlama şablonları `{{ .ConfirmationURL }}` yerine `token_hash` ile `/auth/callback` adresine gider. Böylece kullanıcı mail uygulamasından (Gmail, Apple Mail vb.) farklı bir tarayıcıda açsa bile oturum oluşur.

## Dosya eşlemesi

| Supabase şablon adı        | Dosya                         | Önerilen konu (Subject) |
|---------------------------|-------------------------------|-------------------------|
| Reset Password            | `recovery.html`               | Reset your isendai password |
| Confirm signup            | `confirmation.html`           | Confirm your isendai account |
| Magic Link                | `magic-link.html`             | Your sign-in link — isendai |
| Change Email Address      | `email-change.html`           | Confirm your new email — isendai |
| Invite user               | `invite.html`                 | You're invited to isendai |
| Confirm reauthentication  | `reauthentication.html`       | Your verification code — isendai |

### Güvenlik bildirimleri (isteğe bağlı)

Dashboard’da **Security notifications** açıksa aynı klasördeki `notify-*.html` dosyalarını ilgili bildirim şablonlarına yapıştırabilirsiniz.

| Bildirim              | Dosya                        | Önerilen konu |
|----------------------|------------------------------|----------------|
| Password changed     | `notify-password-changed.html` | Your isendai password was updated |
| Email address changed| `notify-email-changed.html`    | Your isendai email was updated |

## Notlar

- Özel SMTP kullanıyorsanız şablonlar yine aynı şekilde çalışır.
- Konu satırlarını Türkçeleştirmek isterseniz yalnızca Dashboard’daki **Subject** alanını değiştirmeniz yeterli; HTML içeriği İngilizce kalabilir veya metni çevirebilirsiniz.
- Çok fazla test e-postası gönderimi **rate limit** tetikleyebilir; geliştirme sırasında dikkat edin.
