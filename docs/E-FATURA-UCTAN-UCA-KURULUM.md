# E-Fatura Entegrasyonu – Uçtan Uca Kurulum Rehberi

Bu rehber, NES Bilgi API ile e-fatura / e-arşiv akışını sıfırdan kurmanız için adım adım yol haritasıdır.

---

## Genel Akış Özeti

```
[1] NES Portal → API anahtarı + API adresi
        ↓
[2] Uygulama → E-Fatura Merkezi → Kurulum sekmesi (edocument_settings)
        ↓
[3] Fatura oluştur (Faturalar modülü) → Onaylı/Ödenen fatura
        ↓
[4] E-Fatura Merkezi → Fatura Listesi → Faturadan E-Belge Gönder (NES)
        ↓
[5] NES → GIB’e gönderim → Durum takibi / İptal / PDF
```

---

## Adım 1: NES Portal ve API Bilgileri

### 1.1 NES hesabı

- NES Bilgi ile sözleşme yapıp test veya canlı ortam bilgilerinizi alın.
- Geliştirici dokümanları: [NES Developer Portal](https://developertest.nes.com.tr/docs/).
- Sorular için: **entegrasyon@nesbilgi.com.tr**.

### 1.2 API anahtarı (token)

- NES Portal’da giriş yapın.
- **Persisted Access Token** (API anahtarı) oluşturun.
- Bu token’ı güvenli yerde saklayın; uygulama içinde “Kurulum” ekranına yapıştıracaksınız.

### 1.3 API adresi

- **Test:** genelde `https://apitest.nesbilgi.com.tr`
- **Canlı:** NES’in verdiği canlı base URL (örn. `https://api.nesbilgi.com.tr`)

Bu adres, uygulamada “API Adresi” alanına girilecek.

---

## Adım 2: Veritabanı ve Uygulama Ortamı

### 2.1 Tablolar

E-belge için kullanılan tablolar migration’larla gelmiş olmalı:

- `edocument_settings` – NES bağlantı ve firma bilgileri
- `edocuments` – Gönderilen / alınan e-belgeler
- `edocument_line_items` – E-belge kalemleri
- `edocument_activity_log` – İşlem logları

Migration’lar uygulandıysa ek bir şey yapmanız gerekmez. Uygulanmadıysa:

```bash
npx supabase db push
# veya
npx supabase migration up
```

### 2.2 Ortam değişkenleri

Edge function `nes-edocument` şunları kullanır:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Bunlar Supabase projesinde zaten tanımlı olmalı. Ekstra NES’e özel env gerekmez; API adresi ve token `edocument_settings` içinde saklanır.

---

## Adım 3: Uygulama İçi Kurulum (E-Fatura Merkezi → Kurulum)

### 3.1 Sayfaya git

- Sidebar’dan **E-Fatura Merkezi** (veya **E-Belgeler**) sayfasına girin.
- **Kurulum** sekmesine tıklayın.

Bu ekran `EdocumentSettings` bileşenini kullanır ve `edocument_settings` tablosunu doldurur.

### 3.2 Alanları doldur

| Alan | Açıklama | Örnek |
|------|----------|--------|
| **Sağlayıcı** | NES Bilgi seçili kalır | NES Bilgi |
| **API Adresi** | NES’in verdiği base URL | `https://apitest.nesbilgi.com.tr` |
| **API Anahtarı** | NES Portal’dan aldığınız token | `9EE05B65...` |
| **Firma VKN** | Kendi firma vergi numaranız (10 hane) | 1234567890 |
| **Firma Ünvanı** | Yasal ünvan | ABC Ltd. Şti. |
| **Fatura Seri Öneki** | Fatura numarası ön eki (opsiyonel) | ABC |

### 3.3 Modülleri aç

- **Entegrasyonu Etkinleştir** anahtarını **Açık** yapın.
- İhtiyacınız olan modülleri açın:
  - **E-Fatura** – E-fatura gönder/al
  - **E-Arşiv** – E-arşiv fatura
  - (İsteğe bağlı) E-İrsaliye, E-SMM, E-MM, E-Defter

### 3.4 Bağlantı testi

- **Bağlantıyı Test Et** butonuna tıklayın.
- Başarılı olursa “Bağlantı başarılı” benzeri mesaj görünür (NES `GetAccountInfo` çağrılır).
- Hata alırsanız: API adresi, token ve firewall/VPN’i kontrol edin.

### 3.5 Kaydet

- **Ayarları Kaydet** ile `edocument_settings` güncellenir.

Bu noktadan sonra tüm e-belge işlemleri bu tenant için NES üzerinden gider.

---

## Adım 4: Fatura Oluşturma (Sistem Faturası)

E-belge göndermek için önce sistemde **onaylı veya ödenmiş** bir fatura olmalı.

### 4.1 Faturalar modülü

- **Faturalar** (Invoices) sayfasına gidin.
- Yeni fatura oluşturun veya mevcut bir faturayı **Gönderildi / Onaylandı / Ödenen** durumuna getirin.

### 4.2 Cari (müşteri) bilgileri

- E-fatura için **alıcı VKN/TCKN** zorunludur; cari kartında vergi numarası dolu olmalı.
- E-arşiv için de vergi numarası önerilir (GIB kuralları).

### 4.3 Fatura kalemleri

- En az bir kalem; birim fiyat, KDV oranı, tutar doğru olmalı.
- Gönderim sırasında bu veriler NES’e `Lines` olarak map’lenir.

---

## Adım 5: E-Belge Gönderimi (Fatura Listesi → NES)

### 5.1 Fatura Listesi sekmesi

- E-Fatura Merkezi’nde **Fatura Listesi** sekmesine geçin.
- “Faturadan E-Belge Gönder” kartı, `invoices` tablosundan **sent / approved / paid** faturaları listeler.

### 5.2 Gönderim adımları

1. **Fatura Seç** – Açılır listeden göndermek istediğiniz faturayı seçin.
2. **Belge Türü** – **E-Fatura** veya **E-Arşiv** seçin.
3. **Fatura Türü** – SATIS, IADE, TEVKIFAT vb. (genelde SATIS).
4. **(Sadece E-Fatura)** **Gönderim Modu** – Taslak veya doğrudan gönderim.
5. **Gönder** butonuna tıklayın.

### 5.3 Arka planda olanlar

- Seçilen fatura ve kalemler okunur.
- `edocuments` tablosuna bir kayıt eklenir (draft).
- `lib/nes-api.ts` → `sendInvoice()` veya `sendEArchive()` çağrılır.
- Bu, Supabase Edge Function `nes-edocument` → NES `SendInvoice` / E-Arşiv `SendInvoice` ile GIB’e gider.
- Başarılıysa `edocuments.status` güncellenir; hata varsa `error_message` doldurulur.

---

## Adım 6: Durum Takibi ve İptal

### 6.1 E-Fatura Merkezi – Fatura Listesi

- Gönderilen e-belgeler `edocuments` ve varsa listeleme bileşenleriyle bu ekranda görünebilir.
- NES’ten durum çekmek için `get_invoice_status` / `get_earchive_status` kullanılır (mevcut backend’de var).

### 6.2 İptal

- E-fatura veya e-arşiv iptali için `cancel_einvoice` / `cancel_earchive` action’ları kullanılır.
- UI’da “İptal” butonu bu action’ları tetiklemeli; iptal notu (cancel_note) NES’e iletilir.

### 6.3 PDF / HTML

- E-arşiv PDF: `get_earchive_pdf(tenantId, ettn)`.
- E-fatura HTML: `get_invoice_html(tenantId, ettn, direction)`.
- Bu fonksiyonlar `lib/nes-api.ts` içinde export edilmiş; gerekirse “Görüntüle” / “İndir” butonlarına bağlanabilir.

---

## Adım 7: İki Akışı Netleştirme (Öneri)

Projede iki ayrı e-fatura benzeri akış var:

| Akış | Nerede | Kullandığı backend |
|------|--------|---------------------|
| **A** | E-Fatura Merkezi → Fatura Listesi → “Faturadan E-Belge Gönder” | NES (`nes-edocument` + `lib/nes-api`) |
| **B** | E-Invoice Center (einvoice-center sayfası) | `einvoice-processor` (GIB / başka servis) |

**Öneri:** Ana e-fatura çözümünüz NES ise:

- E-Invoice Center’ı ya tamamen NES’e yönlendirin (get_pending, send, cancel hepsi `nes-edocument` + `lib/nes-api` kullansın),
- Ya da E-Invoice Center’ı sadece “durum / rapor” ekranı yapıp asıl gönderimi “Faturadan E-Belge Gönder” (NES) üzerinden yapın.

Böylece tek bir uçtan uca akış olur: **Faturalar → E-Fatura Merkezi (Kurulum + Fatura Listesi) → NES → GIB**.

---

## Kontrol Listesi (Uçtan Uca)

- [ ] NES sözleşmesi ve test/canlı bilgileri alındı.
- [ ] NES Portal’dan API anahtarı (token) üretildi.
- [ ] API adresi (test/canlı) not edildi.
- [ ] `edocument_settings` migration’ları uygulandı.
- [ ] E-Fatura Merkezi → Kurulum’da API adresi, API anahtarı, VKN, ünvan girildi.
- [ ] “Entegrasyonu Etkinleştir” ve E-Fatura / E-Arşiv modülleri açıldı.
- [ ] “Bağlantıyı Test Et” başarılı.
- [ ] Ayarlar kaydedildi.
- [ ] Faturalar modülünde en az bir fatura “Gönderildi/Onaylı/Ödenen” ve caride VKN dolu.
- [ ] E-Fatura Merkezi → Fatura Listesi’nden ilgili fatura seçilip E-Fatura veya E-Arşiv olarak gönderildi.
- [ ] NES/GIB tarafında fatura görünüyor; gerekirse durum/iptal/PDF test edildi.

---

## Sık Karşılaşılan Hatalar

| Hata | Olası sebep | Çözüm |
|------|-------------|--------|
| “E-belge entegrasyonu yapılandırılmamış” | `edocument_settings` kaydı yok veya tenant eşleşmiyor | Kurulum sekmesinde tüm alanları doldurup kaydedin. |
| “API anahtarı yapılandırılmamış” | API anahtarı boş | NES Portal’dan token alıp Kurulum’a yapıştırın. |
| “NES API sunucusuna bağlanılamadı” | Yanlış URL, firewall, DNS | API adresini ve ağ erişimini kontrol edin. |
| “Bağlantı reddedildi” / “Zaman aşımı” | NES sunucusu kapalı veya erişilemiyor | NES ile iletişime geçin; test/canlı ortamı doğrulayın. |
| Alıcı VKN hatası | Cari kartında vergi no yok veya hatalı | Caride vergi numarası 10 (VKN) veya 11 (TCKN) hane olmalı. |

---

## Dosya Referansları

| Ne | Dosya |
|----|--------|
| Kurulum UI | `components/edocuments/edocument-settings.tsx` |
| Faturadan gönder paneli | `components/edocuments/send-einvoice-panel.tsx` |
| NES API client | `lib/nes-api.ts` |
| NES backend (Edge Function) | `supabase/functions/nes-edocument/index.ts` |
| E-Fatura Merkezi sayfası | `app/einvoice-center/page.tsx` |
| E-belge tabloları | `supabase/migrations/20260206085254_create_edocument_integration_system.sql` |

Bu rehberi takip ederek NES e-fatura entegrasyonunu uçtan uca kurabilirsiniz. Belirli bir adımda takılırsanız, ilgili dosya ve alan adlarını kullanarak hatayı daha hızlı izleyebilirsiniz.
