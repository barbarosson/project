# Modulus SaaS — Manuel Test Rehberi (Adım Adım)

> Bu rehber, browser'da yapılması gereken tüm testleri adım adım açıklar.
> Her testi yaptıktan sonra yanına ✅ veya ❌ koyun.

---

## Ön Hazırlık

1. Tarayıcınızda `www.modulusaas.com` açın (veya local: `http://localhost:3001`)
2. Tüm cookie'leri temizleyin (DevTools → Application → Cookies → Clear All)
3. Aşağıdaki bilgileri hazırlayın:
   - **Beta erişim kodu:** `QWERTY123`
   - **Demo hesap:** `demo@modulus.com` / `demo123456`
   - **Kendi email adresiniz** (magic link testi için)

---

## TEST 1: Beta Gate Geçişi

### 1.1 Beta gate ekranını gör
1. Cookie'leri temizle
2. Sayfayı yenile (F5)
3. **Beklenen:** "Beta Erişim Kodu" ekranı görünür
4. [ ] ✅ Geçti / ❌ Hata

### 1.2 Yanlış kod dene
1. Kod alanına `YANLISKOD` yaz
2. "Devam Et" butonuna tıkla
3. **Beklenen:** Kırmızı hata mesajı görünür
4. [ ] ✅ Geçti / ❌ Hata

### 1.3 Doğru kod gir
1. Kod alanına `QWERTY123` yaz
2. "Devam Et" butonuna tıkla
3. **Beklenen:** Ana sayfa (landing) açılır
4. [ ] ✅ Geçti / ❌ Hata

---

## TEST 2: Login Sayfası UI

### 2.1 Login sayfasını aç
1. Adres çubuğuna `/login` yaz ve Enter'a bas
2. **Beklenen:** Login sayfası yüklenir. Üstte "Giriş Yap" ve "Kayıt Ol" sekmeleri görünür
3. [ ] ✅ Geçti / ❌ Hata

### 2.2 Dil değiştirme
1. Sağ üst köşedeki 🌐 (Globe) ikonuna tıkla
2. **Beklenen:** Sayfa dili TR ↔ EN değişir. Tüm butonlar, etiketler yeni dilde görünür
3. Tekrar tıklayarak Türkçe'ye dön
4. [ ] ✅ Geçti / ❌ Hata

### 2.3 Tab geçişleri (Giriş Yap / Kayıt Ol)
1. "Kayıt Ol" sekmesine tıkla
2. **Beklenen:** "Ad Soyad", "E-posta", "Şifre", "Şifre (Tekrar)" alanları görünür. Aktif tab lacivert (#0A2540) arka planlı, beyaz yazı
3. "Giriş Yap" sekmesine geri tıkla
4. **Beklenen:** "E-posta" ve "Şifre" alanları görünür
5. [ ] ✅ Geçti / ❌ Hata

### 2.4 Auth method tabs (E-posta / Sihirli Giriş Linki)
1. "Giriş Yap" sekmesinde iken alt tarafta "E-posta" ve "Sihirli Giriş Linki" sekmelerini bul
2. "Sihirli Giriş Linki" sekmesine tıkla
3. **Beklenen:** Sadece bir email alanı ve "Sihirli Link Gönder" butonu görünür. Aktif tab lacivert
4. "E-posta" sekmesine geri tıkla
5. **Beklenen:** Email ve Şifre alanları tekrar görünür
6. [ ] ✅ Geçti / ❌ Hata

---

## TEST 3: E-posta ile Giriş

### 3.1 Boş form gönderme
1. "Giriş Yap" sekmesinde iken
2. Hiçbir alan doldurmadan "Giriş Yap" butonuna tıkla
3. **Beklenen:** Sağ üst köşede kırmızı toast: "Lütfen tüm alanları doldurun"
4. [ ] ✅ Geçti / ❌ Hata

### 3.2 Yanlış şifre ile giriş
1. E-posta alanına: `demo@modulus.com`
2. Şifre alanına: `yanlis_sifre`
3. "Giriş Yap" butonuna tıkla
4. **Beklenen:** Kırmızı toast: "E-posta veya şifre hatalı. Lütfen tekrar deneyin."
5. [ ] ✅ Geçti / ❌ Hata

### 3.3 Doğru giriş
1. E-posta alanına: `demo@modulus.com`
2. Şifre alanına: `demo123456`
3. "Giriş Yap" butonuna tıkla
4. **Beklenen:** Yeşil toast: "Giriş başarılı!" ve `/dashboard` sayfasına yönlendirme
5. [ ] ✅ Geçti / ❌ Hata

### 3.4 Enter tuşu ile giriş
1. Çıkış yap (sağ üst menü → Çıkış)
2. `/login` sayfasına dön
3. E-posta: `demo@modulus.com`, Şifre: `demo123456`
4. Şifre alanında iken **Enter** tuşuna bas (butona tıklamadan)
5. **Beklenen:** Form gönderilir, giriş başarılı
6. [ ] ✅ Geçti / ❌ Hata

---

## TEST 4: Magic Link (Sihirli Giriş Linki)

### 4.1 Boş email ile gönderme
1. `/login` sayfasında "Sihirli Giriş Linki" sekmesine tıkla
2. Email alanını boş bırak
3. "Sihirli Link Gönder" butonuna tıkla
4. **Beklenen:** Kırmızı toast: "Lütfen tüm alanları doldurun"
5. [ ] ✅ Geçti / ❌ Hata

### 4.2 Magic link gönder
1. Email alanına **kendi gerçek email adresini** yaz (örn: `senin@email.com`)
2. "Sihirli Link Gönder" butonuna tıkla
3. **Beklenen:** Yeşil toast: "E-postanızı kontrol edin!" mesajı
4. [ ] ✅ Geçti / ❌ Hata

### 4.3 Gelen maili kontrol et
1. Email gelen kutunu aç
2. ModulusSaaS'ten gelen maili bul
3. **Beklenen:** Lacivert temalı, Modulus logolu, Türkçe email. İçinde "Giriş Yap" butonu var
4. [ ] ✅ Geçti / ❌ Hata

### 4.4 Magic link'e tıkla
1. Emaildeki "Giriş Yap" butonuna tıkla
2. **Beklenen:** `www.modulusaas.com/auth/callback` üzerinden `/dashboard`'a yönlendirilirsin
3. **Kontrol:** Adres çubuğunda `modulusaas.com` olmalı (localhost değil!)
4. [ ] ✅ Geçti / ❌ Hata

---

## TEST 5: Kayıt Ol

### 5.1 Eksik alan
1. `/login` → "Kayıt Ol" sekmesine tıkla
2. Sadece "E-posta" alanını doldur, diğerlerini boş bırak
3. "Kayıt Ol" butonuna tıkla
4. **Beklenen:** Kırmızı toast: "Lütfen tüm alanları doldurun"
5. [ ] ✅ Geçti / ❌ Hata

### 5.2 Kısa şifre
1. Ad Soyad: `Test Kullanici`
2. E-posta: `test@test.com`
3. Şifre: `123`
4. Şifre (Tekrar): `123`
5. "Kayıt Ol" butonuna tıkla
6. **Beklenen:** Kırmızı toast: "Şifre en az 6 karakter olmalı"
7. [ ] ✅ Geçti / ❌ Hata

### 5.3 Şifre uyuşmazlığı
1. Ad Soyad: `Test Kullanici`
2. E-posta: `test@test.com`
3. Şifre: `password123`
4. Şifre (Tekrar): `password456`
5. "Kayıt Ol" butonuna tıkla
6. **Beklenen:** Kırmızı toast: "Şifreler eşleşmiyor"
7. [ ] ✅ Geçti / ❌ Hata

### 5.4 Başarılı kayıt
1. Ad Soyad: `Test Kullanici`
2. E-posta: **yeni bir email adresi** (daha önce kayıt olmamış)
3. Şifre: `Test123456`
4. Şifre (Tekrar): `Test123456`
5. "Kayıt Ol" butonuna tıkla
6. **Beklenen:** Email doğrulama ekranı görünür: "E-postanızı kontrol edin!"
7. [ ] ✅ Geçti / ❌ Hata

### 5.5 Doğrulama maili
1. Kayıt yaptığın email'in gelen kutusunu kontrol et
2. **Beklenen:** Doğrulama linki içeren email gelmiş olmalı
3. [ ] ✅ Geçti / ❌ Hata

### 5.6 Tekrar gönder
1. Doğrulama ekranında "Tekrar Gönder" butonuna tıkla
2. **Beklenen:** Buton devre dışı kalır, cooldown sayacı başlar (60 sn)
3. [ ] ✅ Geçti / ❌ Hata

---

## TEST 6: Google OAuth

### 6.1 Google butonu
1. `/login` → "Giriş Yap" sekmesi
2. Aşağıda "Google ile devam et" butonuna tıkla
3. **Beklenen:** Google hesap seçme / oturum açma sayfasına yönlendirilirsin
4. [ ] ✅ Geçti / ❌ Hata

### 6.2 Google ile giriş
1. Google hesabını seç ve onayla
2. **Beklenen:** `modulusaas.com/auth/callback` üzerinden `/dashboard`'a yönlendirilirsin
3. [ ] ✅ Geçti / ❌ Hata

---

## TEST 7: Şifremi Unuttum

### 7.1 Email boş iken
1. `/login` → "Giriş Yap" sekmesi
2. Email alanını **boş bırak**
3. "Şifreni mi unuttun?" linkine tıkla
4. **Beklenen:** Kırmızı toast: "Önce e-posta adresinizi yazın"
5. [ ] ✅ Geçti / ❌ Hata

### 7.2 Geçerli email ile
1. Email alanına `demo@modulus.com` yaz
2. "Şifreni mi unuttun?" linkine tıkla
3. **Beklenen:** Yeşil toast: "Şifre sıfırlama e-postası gönderildi"
4. [ ] ✅ Geçti / ❌ Hata

---

## TEST 8: Demo Hesap

### 8.1 Demo giriş
1. `/login` sayfasında en altta "Hazır demo hesabı dene" butonunu bul
2. Butona tıkla
3. **Beklenen:** Yeşil toast: "Demo hesabına giriş yapıldı!" ve `/dashboard`'a yönlendirme
4. [ ] ✅ Geçti / ❌ Hata

---

## TEST 9: Dashboard

> ⚠️ Bu testler için giriş yapmış olmalısın. Demo hesapla veya kendi hesabınla giriş yap.

### 9.1 Dashboard yüklenir
1. Giriş yaptıktan sonra `/dashboard` sayfasında olduğunu doğrula
2. **Beklenen:** Dashboard metrikleri (gelir, gider, müşteri sayısı vb.) ve grafikler görünür
3. [ ] ✅ Geçti / ❌ Hata

### 9.2 Sidebar (sol menü)
1. Sol taraftaki menüye bak
2. **Beklenen:** Müşteriler, Faturalar, Stok, Finans, AI modülleri vb. tüm linkler görünür
3. Birkaç linke tıklayarak sayfaların açıldığını doğrula
4. [ ] ✅ Geçti / ❌ Hata

### 9.3 Topbar arama
1. Klavyede **Ctrl+K** (Mac: Cmd+K) bas
2. **Beklenen:** Arama modalı açılır
3. Bir şey yaz (örn: "fatura") ve sonuçların geldiğini kontrol et
4. ESC ile kapat
5. [ ] ✅ Geçti / ❌ Hata

### 9.4 Bildirimler
1. Sağ üst köşede zil/bildirim ikonunu bul
2. Tıkla
3. **Beklenen:** Bildirim listesi / dropdown açılır
4. [ ] ✅ Geçti / ❌ Hata

### 9.5 Dashboard'da dil değiştirme
1. Topbar'da dil butonu (TR/EN veya globe ikonu) bul
2. Tıkla
3. **Beklenen:** Sidebar ve dashboard metinleri TR ↔ EN değişir
4. [ ] ✅ Geçti / ❌ Hata

### 9.6 Çıkış yap
1. Sağ üst köşede profil/kullanıcı menüsüne tıkla
2. "Çıkış" / "Çıkış Yap" butonuna tıkla
3. **Beklenen:** `/login` sayfasına yönlendirilirsin
4. [ ] ✅ Geçti / ❌ Hata

---

## TEST 10: Müşteriler

> Giriş yap → Sol menüden "Müşteriler" tıkla

### 10.1 Liste yüklenir
1. `/customers` sayfası açılır
2. **Beklenen:** Müşteri listesi (tablo) görünür
3. [ ] ✅ Geçti / ❌ Hata

### 10.2 Yeni müşteri ekle
1. "Yeni Müşteri" / "+" butonuna tıkla
2. **Beklenen:** Müşteri ekleme formu/dialog açılır
3. [ ] ✅ Geçti / ❌ Hata

### 10.3 Müşteri kaydet
1. Zorunlu alanları doldur (Ad, Email vb.)
2. "Kaydet" butonuna tıkla
3. **Beklenen:** Yeşil toast mesajı, müşteri listede görünür
4. [ ] ✅ Geçti / ❌ Hata

### 10.4 Müşteri düzenle
1. Listeden bir müşteriye tıkla
2. Bir alanı değiştir → Kaydet
3. **Beklenen:** Güncelleme başarılı mesajı
4. [ ] ✅ Geçti / ❌ Hata

### 10.5 Müşteri sil
1. Bir müşterinin yanındaki sil/çöp kutusu ikonuna tıkla
2. **Beklenen:** Onay dialogu çıkar
3. Onayla
4. **Beklenen:** Müşteri listeden kaldırılır
5. [ ] ✅ Geçti / ❌ Hata

### 10.6 Müşteri arama
1. Liste üstündeki arama kutusuna bir müşteri adı yaz
2. **Beklenen:** Liste filtrelenir, sadece eşleşenler görünür
3. [ ] ✅ Geçti / ❌ Hata

---

## TEST 11: Faturalar

> Sol menü → Faturalar

### 11.1 Fatura listesi
1. `/invoices` sayfası açılır
2. **Beklenen:** Fatura listesi görünür
3. [ ] ✅ Geçti / ❌ Hata

### 11.2 Yeni fatura
1. "Yeni Fatura" butonuna tıkla
2. **Beklenen:** Fatura oluşturma formu açılır
3. [ ] ✅ Geçti / ❌ Hata

### 11.3 Müşteri seç
1. Fatura formunda "Müşteri" alanına tıkla
2. Listeden bir müşteri seç
3. **Beklenen:** Müşteri bilgileri (adres, vergi no vb.) otomatik dolar
4. [ ] ✅ Geçti / ❌ Hata

### 11.4 Kalem ekle
1. "Kalem Ekle" butonuna tıkla
2. Ürün/hizmet seç, miktar ve birim fiyat gir
3. **Beklenen:** Kalem satırı eklenir, toplam tutar otomatik güncellenir
4. [ ] ✅ Geçti / ❌ Hata

### 11.5 Fatura kaydet
1. "Kaydet" butonuna tıkla
2. **Beklenen:** Fatura kaydedilir, fatura listesinde görünür
3. [ ] ✅ Geçti / ❌ Hata

### 11.6 Fatura detay
1. Listeden bir faturaya tıkla
2. **Beklenen:** Fatura detay sayfası açılır (kalemler, toplam, müşteri bilgileri)
3. [ ] ✅ Geçti / ❌ Hata

### 11.7 Fatura kopyala
1. Fatura detayda "Kopyala" butonu varsa tıkla
2. **Beklenen:** Aynı bilgilerle yeni fatura formu açılır
3. [ ] ✅ Geçti / ❌ Hata

### 11.8 PDF / Yazdır
1. Fatura detayda "PDF" veya "Yazdır" butonu varsa tıkla
2. **Beklenen:** PDF önizleme veya indirme başlar
3. [ ] ✅ Geçti / ❌ Hata

---

## TEST 12: Ürünler & Envanter

> Sol menü → Ürünler/Envanter

### 12.1 Ürün listesi
1. `/inventory` sayfası açılır
2. **Beklenen:** Ürün/hizmet listesi görünür
3. [ ] ✅ Geçti / ❌ Hata

### 12.2 Yeni ürün ekle
1. "Yeni Ürün" butonuna tıkla
2. Adı, fiyatı, kategorisi gir
3. "Kaydet" tıkla
4. **Beklenen:** Ürün listede görünür
5. [ ] ✅ Geçti / ❌ Hata

### 12.3 Ürün düzenle
1. Bir ürüne tıkla → Düzenle
2. Fiyatı değiştir → Kaydet
3. **Beklenen:** Güncelleme başarılı
4. [ ] ✅ Geçti / ❌ Hata

### 12.4 Ürün sil
1. Bir ürünü sil
2. **Beklenen:** Onay → Silme başarılı
3. [ ] ✅ Geçti / ❌ Hata

---

## TEST 13: Stok

> Sol menü → Stok

### 13.1 Stok seviyeleri
1. `/stocks` sayfası aç
2. **Beklenen:** Ürünlerin stok seviyeleri görünür
3. [ ] ✅ Geçti / ❌ Hata

### 13.2 Stok hareketi ekle
1. Yeni stok hareketi ekle (giriş/çıkış)
2. **Beklenen:** Hareket kaydedilir, stok seviyesi güncellenir
3. [ ] ✅ Geçti / ❌ Hata

---

## TEST 14: Giderler

> Sol menü → Giderler

### 14.1 Gider listesi
1. `/expenses` sayfası aç
2. **Beklenen:** Gider listesi görünür
3. [ ] ✅ Geçti / ❌ Hata

### 14.2 Yeni gider ekle
1. "Yeni Gider" butonuna tıkla
2. Tutarı, kategoriyi, tarihi gir → Kaydet
3. **Beklenen:** Gider listede görünür
4. [ ] ✅ Geçti / ❌ Hata

### 14.3 Gider detay
1. Bir gidere tıkla
2. **Beklenen:** Detay sayfası açılır
3. [ ] ✅ Geçti / ❌ Hata

### 14.4 Excel import
1. "Import" / "Excel Yükle" butonu varsa tıkla
2. **Beklenen:** Dosya yükleme dialogu açılır
3. [ ] ✅ Geçti / ❌ Hata

---

## TEST 15: Siparişler

> Sol menü → Siparişler

### 15.1 Sipariş listesi
1. `/orders` sayfası aç
2. **Beklenen:** Sipariş listesi görünür
3. [ ] ✅ Geçti / ❌ Hata

### 15.2 Yeni sipariş
1. Sipariş oluştur → Kaydet
2. **Beklenen:** Sipariş listede görünür
3. [ ] ✅ Geçti / ❌ Hata

---

## TEST 16: Finans

### 16.1 İşlemler
1. `/finance/transactions` aç
2. **Beklenen:** Finansal işlemler listesi
3. [ ] ✅ Geçti / ❌ Hata

### 16.2 Yeni işlem
1. "Yeni İşlem" → Tutar, tür, hesap seç → Kaydet
2. **Beklenen:** İşlem kaydedilir
3. [ ] ✅ Geçti / ❌ Hata

### 16.3 Hesaplar
1. `/finance/accounts` aç
2. **Beklenen:** Banka/kasa hesapları listesi
3. [ ] ✅ Geçti / ❌ Hata

### 16.4 Yeni hesap
1. "Yeni Hesap" → Ad, tür gir → Kaydet
2. **Beklenen:** Hesap oluşturulur
3. [ ] ✅ Geçti / ❌ Hata

### 16.5 Mutabakat
1. `/reconciliation` aç
2. **Beklenen:** Mutabakat kayıtları görünür
3. [ ] ✅ Geçti / ❌ Hata

---

## TEST 17: Diğer ERP Modülleri

> Her modülün sayfasını aç ve yüklendiğini doğrula

| # | Modül | URL | Kontrol | Durum |
|---|-------|-----|---------|-------|
| 17.1 | Satın Alma | `/procurement` | Sayfa yüklenir | [ ] |
| 17.2 | Projeler | `/projects` | Proje listesi görünür | [ ] |
| 17.3 | Üretim | `/production` | Üretim emirleri görünür | [ ] |
| 17.4 | Maliyet | `/cost` | Maliyet analizi görünür | [ ] |
| 17.5 | Kalite | `/quality` | Kalite kontrol modülü | [ ] |
| 17.6 | Bakım | `/maintenance` | İş emirleri / ekipman | [ ] |
| 17.7 | Kampanyalar | `/campaigns` | Kampanya listesi | [ ] |
| 17.8 | Marketplace | `/marketplace` | Pazaryeri sayfası | [ ] |
| 17.9 | E-Fatura | `/einvoice-center` | e-Fatura merkezi | [ ] |
| 17.10 | CRM | `/crm` | CRM dashboard | [ ] |
| 17.11 | Depolar | `/warehouses` | Depo listesi | [ ] |
| 17.12 | Şubeler | `/branches` | Şube karşılaştırma | [ ] |
| 17.13 | Teklifler | `/proposals` | Teklif listesi | [ ] |

---

## TEST 18: AI Modüller

> Her AI modülünün sayfasını aç ve yüklendiğini doğrula

| # | Modül | URL | Kontrol | Durum |
|---|-------|-----|---------|-------|
| 18.1 | AI Insights | `/ai-insights` | Dashboard yüklenir | [ ] |
| 18.2 | Finance Robot | `/finance-robot` | Chat + dashboard | [ ] |
| 18.3 | AI Cash Flow | `/ai-cash-flow` | Nakit akışı analizi | [ ] |
| 18.4 | Accounting AI | `/accounting-ai` | Muhasebe AI chat | [ ] |
| 18.5 | Executive Assistant | `/executive-assistant` | Asistan sayfası | [ ] |
| 18.6 | Trend Agent | `/trend-agent` | Trend analizi | [ ] |
| 18.7 | AI Production | `/ai-production-advisor` | Üretim önerileri | [ ] |
| 18.8 | HR AI | `/hr-ai` | İK modülü | [ ] |

---

## TEST 19: Destek & Yardım

### 19.1 Destek sayfası
1. `/support` aç
2. **Beklenen:** Destek / ticket sistemi görünür
3. [ ] ✅ Geçti / ❌ Hata

### 19.2 Yeni ticket
1. "Yeni Talep" / "Destek Talebi" butonuna tıkla
2. Konu ve açıklama yaz → Gönder
3. **Beklenen:** Ticket kaydedilir
4. [ ] ✅ Geçti / ❌ Hata

### 19.3 Yardım sayfası
1. `/help` aç
2. **Beklenen:** SSS / yardım merkezi içerikleri görünür
3. [ ] ✅ Geçti / ❌ Hata

### 19.4 Canlı destek
1. Sağ alt köşede canlı destek widget'ı / butonunu bul
2. Tıkla
3. **Beklenen:** Chat penceresi açılır
4. [ ] ✅ Geçti / ❌ Hata

---

## TEST 20: Ayarlar

### 20.1 Şirket ayarları
1. `/settings` aç
2. **Beklenen:** Şirket bilgileri ve profil ayarları
3. [ ] ✅ Geçti / ❌ Hata

### 20.2 Şirket bilgisi güncelle
1. Şirket adını değiştir → Kaydet
2. **Beklenen:** Güncelleme başarılı mesajı
3. [ ] ✅ Geçti / ❌ Hata

### 20.3 Abonelik sayfası
1. `/settings/subscription` aç
2. **Beklenen:** Mevcut plan, eklentiler, upgrade seçenekleri
3. [ ] ✅ Geçti / ❌ Hata

### 20.4 MFA ayarı
1. Settings → MFA / İki Faktörlü Doğrulama bölümünü bul
2. "Etkinleştir" butonuna tıkla
3. **Beklenen:** QR kod görünür
4. Authenticator uygulaması ile tara ve kodu gir
5. **Beklenen:** MFA aktif edilir
6. [ ] ✅ Geçti / ❌ Hata

### 20.5 Şifre değiştir
1. Şifre değiştirme formunu bul
2. Mevcut şifre + yeni şifre gir → Kaydet
3. **Beklenen:** Şifre başarıyla değiştirildi mesajı
4. [ ] ✅ Geçti / ❌ Hata

---

## TEST 21: Marketing / Public Sayfalar

> Bu sayfaları giriş yapmadan kontrol edebilirsin

| # | Sayfa | URL | Kontrol | Durum |
|---|-------|-----|---------|-------|
| 21.1 | Landing | `/landing` | Marketing sayfası düzgün yüklenir | [ ] |
| 21.2 | Fiyatlandırma | `/pricing` | Fiyat tablosu görünür | [ ] |
| 21.3 | İletişim | `/contact` | İletişim formu çalışır | [ ] |
| 21.4 | Hakkımızda | `/hakkimizda` | İçerik yüklenir | [ ] |
| 21.5 | Satın Al | `/buy` | Checkout sayfası | [ ] |
| 21.6 | Gizlilik | `/gizlilik` | Gizlilik sözleşmesi | [ ] |
| 21.7 | Mesafeli Satış | `/mesafeli-satis` | Sözleşme metni | [ ] |
| 21.8 | Teslimat/İade | `/teslimat-iade` | Şartlar sayfası | [ ] |

---

## TEST 22: Admin Paneli

> ⚠️ Admin testleri için `super_admin` rolüne sahip hesapla giriş yapmalısın

### 22.1 Admin login
1. `/admin/login` aç
2. **Beklenen:** Admin giriş formu görünür
3. [ ] ✅ Geçti / ❌ Hata

### 22.2 Admin giriş
1. Super admin email/şifre gir
2. **Beklenen:** Admin paneline yönlendirme
3. [ ] ✅ Geçti / ❌ Hata

### 22.3 Yetkisiz kullanıcı
1. Normal (non-admin) kullanıcıyla admin login dene
2. **Beklenen:** Erişim reddedilir / çıkış yapılır
3. [ ] ✅ Geçti / ❌ Hata

### 22.4 Admin modülleri
> Her sayfanın yüklendiğini doğrula

| # | Modül | URL | Durum |
|---|-------|-----|-------|
| 22.4.1 | Site Commander | `/admin/site-commander` | [ ] |
| 22.4.2 | Activity Log | `/admin/activity-log` | [ ] |
| 22.4.3 | System Health | `/admin/healthcheck` | [ ] |
| 22.4.4 | Diagnostics | `/admin/diagnostics` | [ ] |
| 22.4.5 | Banner Studio | `/admin/banner-studio` | [ ] |
| 22.4.6 | Blog | `/admin/blog` | [ ] |
| 22.4.7 | Help Center | `/admin/help-center` | [ ] |
| 22.4.8 | Testimonials | `/admin/testimonials` | [ ] |
| 22.4.9 | Translations | `/admin/translations` | [ ] |
| 22.4.10 | Campaigns | `/admin/campaigns` | [ ] |
| 22.4.11 | Coupons | `/admin/coupons` | [ ] |
| 22.4.12 | Pricing Plans | `/admin/pricing` | [ ] |
| 22.4.13 | Live Support | `/admin/live-support` | [ ] |
| 22.4.14 | Helpdesk | `/admin/helpdesk` | [ ] |
| 22.4.15 | Demo Requests | `/admin/demo-requests` | [ ] |
| 22.4.16 | Users | `/admin/users` | [ ] |

---

## TEST 23: Responsive (Mobil)

> DevTools → Toggle Device Toolbar (Ctrl+Shift+M) → iPhone 14 Pro seç

### 23.1 Login mobil
1. Mobil modda `/login` aç
2. **Beklenen:** Form tek sütunda, butonlar tam genişlikte, okunabilir
3. [ ] ✅ Geçti / ❌ Hata

### 23.2 Dashboard mobil
1. Mobil modda giriş yap → `/dashboard`
2. **Beklenen:** Sidebar hamburger menüye dönüşmüş, grafikler responsive
3. Hamburger menüye tıkla → menü açılır
4. [ ] ✅ Geçti / ❌ Hata

### 23.3 Landing mobil
1. Mobil modda `/landing` aç
2. **Beklenen:** Marketing sayfası responsive, görseller sığar
3. [ ] ✅ Geçti / ❌ Hata

### 23.4 Pricing mobil
1. Mobil modda `/pricing` aç
2. **Beklenen:** Fiyat kartları alt alta sıralanır
3. [ ] ✅ Geçti / ❌ Hata

---

## TEST 24: Cross-cutting (Genel)

### 24.1 404 sayfası
1. Var olmayan bir URL'e git: `/bu-sayfa-yok-12345`
2. **Beklenen:** 404 sayfası veya "Sayfa bulunamadı" mesajı
3. [ ] ✅ Geçti / ❌ Hata

### 24.2 Toast bildirimleri
1. Herhangi bir kaydetme/silme işlemi yap
2. **Beklenen:** Sağ üst köşede toast (bildirim) mesajı görünür ve birkaç saniye sonra kaybolur
3. [ ] ✅ Geçti / ❌ Hata

### 24.3 Feature guard (demo kullanıcı)
1. Demo hesapla giriş yap
2. Kısıtlı bir özelliğe tıkla (premium modül gibi)
3. **Beklenen:** "Upgrade" / "Plan yükselt" dialogu görünür
4. [ ] ✅ Geçti / ❌ Hata

### 24.4 /edocuments redirect
1. Adres çubuğuna `/edocuments` yaz
2. **Beklenen:** Otomatik olarak `/einvoice-center`'a yönlendirilirsin
3. [ ] ✅ Geçti / ❌ Hata

### 24.5 Loading spinner
1. DevTools → Network → Throttle → "Slow 3G" seç
2. Herhangi bir sayfaya git
3. **Beklenen:** Sayfa yüklenirken loading spinner/skeleton görünür
4. Throttle'ı "No throttling"a geri al
5. [ ] ✅ Geçti / ❌ Hata

---

## Özet Puanlama

Test bittikten sonra buraya sonuçları yaz:

| Bölüm | Toplam | ✅ | ❌ | Not |
|-------|--------|-----|-----|-----|
| Beta Gate | 3 | | | |
| Login UI | 4 | | | |
| Email Giriş | 4 | | | |
| Magic Link | 4 | | | |
| Kayıt Ol | 6 | | | |
| Google OAuth | 2 | | | |
| Şifremi Unuttum | 2 | | | |
| Demo Hesap | 1 | | | |
| Dashboard | 6 | | | |
| Müşteriler | 6 | | | |
| Faturalar | 8 | | | |
| Ürünler | 4 | | | |
| Stok | 2 | | | |
| Giderler | 4 | | | |
| Siparişler | 2 | | | |
| Finans | 5 | | | |
| ERP Modülleri | 13 | | | |
| AI Modüller | 8 | | | |
| Destek | 4 | | | |
| Ayarlar | 5 | | | |
| Marketing | 8 | | | |
| Admin | ~19 | | | |
| Responsive | 4 | | | |
| Cross-cutting | 5 | | | |
| **TOPLAM** | **~127** | | | |
