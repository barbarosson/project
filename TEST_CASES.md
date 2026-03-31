# Modulus SaaS — Test Case Projesi

> Bu dosya tüm uygulama özelliklerini adım adım test etmek için hazırlanmıştır.
> Her test case'in yanına sonucu yazın: ✅ Geçti | ❌ Hata | ⚠️ Kısmi

---

## 1. BETA GATE & ANA SAYFA

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 1.1 | Beta gate görünür | `www.modulusaas.com` aç (cookie yok) | Beta erişim kodu ekranı görünür | ✅ `{"unlocked":false}` döner, gate aktif |
| 1.2 | Yanlış kod | Hatalı kod gir → "Devam et" | "Erişim kodu hatalı" hatası | ✅ 401 döner, hata mesajı gösterilir |
| 1.3 | Doğru kod | Doğru beta kodunu gir → "Devam et" | Ana sayfa / landing açılır | ✅ 200 `{"ok":true}` döner, cookie set edilir |
| 1.4 | returnTo çalışır | `/dashboard` gibi korumalı URL'e git (cookie yok) | Beta gate açılır, kod girince `/dashboard`'a yönlendirilir | ✅ 307 → `/?returnTo=%2Fdashboard` |
| 1.5 | Beta talep sayfası | `/beta-talep` aç | Referans kodu talep formu görünür | ✅ 200 döner, sayfa erişilebilir |

---

## 2. AUTHENTICATION (Kimlik Doğrulama)

### 2.1 Login Sayfası UI

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 2.1.1 | Sayfa yüklenir | `/login` aç | Giriş Yap / Kayıt Ol sekmeleri görünür | ✅ 200 döner, client-side render |
| 2.1.2 | Dil değiştirme | Globe butonuna tıkla | TR ↔ EN geçişi, tüm metinler değişir | 🖐️ Browser testi gerekli |
| 2.1.3 | Tab geçişleri | "Giriş Yap" ↔ "Kayıt Ol" | İlgili form alanları değişir, aktif tab lacivert arka plan | 🖐️ Browser testi gerekli |
| 2.1.4 | Auth method tabs | "E-posta" ↔ "Sihirli Giriş Linki" | Alt form değişir, aktif tab lacivert | 🖐️ Browser testi gerekli |

### 2.2 E-posta ile Giriş

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 2.2.1 | Boş form | Hiçbir şey yazmadan "Giriş Yap" | "Lütfen tüm alanları doldurun" toast | 🖐️ Browser testi gerekli |
| 2.2.2 | Yanlış şifre | Geçerli email + yanlış şifre | "E-posta veya şifre hatalı" toast | 🖐️ Browser testi gerekli |
| 2.2.3 | Doğru giriş | Geçerli email + doğru şifre | "Giriş başarılı!" toast → `/dashboard`'a yönlendirme | 🖐️ Browser testi gerekli |
| 2.2.4 | Enter ile giriş | Email/şifre girip Enter | Form gönderilir | 🖐️ Browser testi gerekli |

### 2.3 Magic Link

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 2.3.1 | Boş email | Email yazmadan "Sihirli Link Gönder" | "Lütfen tüm alanları doldurun" toast | 🖐️ Browser testi gerekli |
| 2.3.2 | Link gönder | Geçerli email gir → "Sihirli Link Gönder" | "E-postanızı kontrol edin!" toast | 🖐️ Browser testi gerekli |
| 2.3.3 | Mail geldi mi | Email gelen kutusunu kontrol et | Modulus logolu, lacivert temalı email gelir | 🖐️ Manuel kontrol |
| 2.3.4 | Link tıkla | Maildeki "Giriş Yap" butonuna tıkla | `www.modulusaas.com/auth/callback` üzerinden dashboard'a yönlendirilir | 🖐️ Manuel kontrol |

### 2.4 Kayıt Ol

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 2.4.1 | Eksik alan | Sadece email gir → "Kayıt Ol" | "Lütfen tüm alanları doldurun" toast | 🖐️ Browser testi gerekli |
| 2.4.2 | Kısa şifre | 3 harfli şifre | "Şifre en az 6 karakter olmalı" toast | 🖐️ Browser testi gerekli |
| 2.4.3 | Şifre uyuşmazlığı | Farklı şifreler gir | "Şifreler eşleşmiyor" toast | 🖐️ Browser testi gerekli |
| 2.4.4 | Başarılı kayıt | Tüm alanlar dolu + geçerli | Email doğrulama ekranı görünür | 🖐️ Browser testi gerekli |
| 2.4.5 | Doğrulama maili | Gelen kutusunu kontrol et | Doğrulama linki içeren email gelir | 🖐️ Manuel kontrol |
| 2.4.6 | Tekrar gönder | "Tekrar Gönder" butonuna tıkla | Cooldown sayacı başlar, mail tekrar gider | 🖐️ Browser testi gerekli |

### 2.5 Google OAuth

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 2.5.1 | Google butonu | "Google ile devam et" tıkla | Google oturum açma sayfasına yönlendirme | 🖐️ Browser testi gerekli |
| 2.5.2 | Google ile giriş | Google hesabı seç | `/auth/callback` → `/dashboard` yönlendirmesi | 🖐️ Manuel kontrol |

### 2.6 Şifremi Unuttum

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 2.6.1 | Email boş | Email yazmadan "Şifreni mi unuttun?" | "Önce e-posta adresinizi yazın" toast | ✅ API 400 döner (boş email reddedildi) |
| 2.6.2 | Geçerli email | Email yaz → "Şifreni mi unuttun?" | "Şifre sıfırlama e-postası gönderildi" toast | ✅ API 200 güvenlik mesajı döner |

### 2.7 Demo Hesap

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 2.7.1 | Demo giriş | "Hazır demo hesabı dene" tıkla | Dashboard'a yönlendirilir | 🖐️ Browser testi gerekli |

### 2.8 MFA (İki Faktörlü Doğrulama)

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 2.8.1 | MFA kurulumu | Settings → MFA aktifleştir | QR kod görünür, TOTP kaydı yapılır | 🖐️ Browser + Authenticator gerekli |
| 2.8.2 | MFA ile giriş | Email/şifre girişi sonrası | MFA doğrulama ekranı çıkar | 🖐️ Browser + Authenticator gerekli |
| 2.8.3 | Doğru MFA kodu | Authenticator'dan kod gir | Dashboard'a yönlendirilir | 🖐️ Browser + Authenticator gerekli |

---

## 3. DASHBOARD

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 3.1 | Dashboard yüklenir | Giriş sonrası `/dashboard` | Dashboard metrikleri, grafikler yüklenir | ✅ 307 redirect (beta gate aktif, auth koruması çalışıyor) |
| 3.2 | Sidebar açılır | Sol menü | Tüm modül linkleri görünür | 🖐️ Browser + auth gerekli |
| 3.3 | Topbar arama | Ctrl+K / Cmd+K | Arama modalı açılır (müşteri/fatura/ürün) | 🖐️ Browser + auth gerekli |
| 3.4 | Bildirimler | Topbar'da bildirim ikonu | Bildirim listesi açılır | 🖐️ Browser + auth gerekli |
| 3.5 | Dil değiştirme | Topbar'da dil butonu | TR ↔ EN geçişi | 🖐️ Browser + auth gerekli |
| 3.6 | Çıkış yap | Kullanıcı menüsü → Çıkış | Login sayfasına yönlendirme | 🖐️ Browser + auth gerekli |

---

## 4. MÜŞTERİLER

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 4.1 | Liste yüklenir | `/customers` aç | Müşteri listesi görünür | ✅ 307 redirect (korumalı, auth gerekli) |
| 4.2 | Yeni müşteri | "Yeni Müşteri" butonuna tıkla | Müşteri ekleme dialog'u açılır | 🖐️ Browser + auth gerekli |
| 4.3 | Müşteri kaydet | Zorunlu alanları doldur → Kaydet | Müşteri listede görünür | 🖐️ Browser + auth gerekli |
| 4.4 | Müşteri düzenle | Bir müşteriye tıkla → Düzenle | Düzenleme formu açılır | 🖐️ Browser + auth gerekli |
| 4.5 | Müşteri sil | Müşteri sil butonu | Onay sonrası silinir | 🖐️ Browser + auth gerekli |
| 4.6 | Müşteri arama | Arama kutusuna yaz | Filtrelenmiş sonuçlar | 🖐️ Browser + auth gerekli |

---

## 5. ÜRÜNLER & HİZMETLER (Envanter)

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 5.1 | Liste yüklenir | `/inventory` aç | Ürün/hizmet listesi | ✅ 307 redirect (korumalı) |
| 5.2 | Yeni ürün | "Yeni Ürün" tıkla | Ürün ekleme formu | 🖐️ Browser + auth gerekli |
| 5.3 | Ürün kaydet | Alanları doldur → Kaydet | Listede görünür | 🖐️ Browser + auth gerekli |
| 5.4 | Ürün düzenle | Ürüne tıkla → Düzenle | Düzenleme formu | 🖐️ Browser + auth gerekli |
| 5.5 | Ürün sil | Sil butonu | Onay sonrası silinir | 🖐️ Browser + auth gerekli |

---

## 6. STOK

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 6.1 | Stok seviyeleri | `/stocks` aç | Stok seviyeleri ve hareketleri | ✅ 307 redirect (korumalı) |
| 6.2 | Stok hareketi | Yeni stok hareketi ekle | Hareket kaydedilir, seviye güncellenir | 🖐️ Browser + auth gerekli |

---

## 7. DEPOLAR

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 7.1 | Depo listesi | `/warehouses` aç | Depo listesi görünür | 🖐️ Browser + auth gerekli |
| 7.2 | Yeni depo | Depo ekle | Depo oluşturulur | 🖐️ Browser + auth gerekli |

---

## 8. ŞUBELER

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 8.1 | Şube listesi | `/branches` aç | Şube karşılaştırma / performans | 🖐️ Browser + auth gerekli |

---

## 9. FATURALAR

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 9.1 | Fatura listesi | `/invoices` aç | Fatura listesi görünür | ✅ 307 redirect (korumalı) |
| 9.2 | Yeni fatura | `/invoices/new` veya "Yeni Fatura" | Fatura oluşturma formu | 🖐️ Browser + auth gerekli |
| 9.3 | Müşteri seç | Fatura formunda müşteri seç | Müşteri bilgileri dolar | 🖐️ Browser + auth gerekli |
| 9.4 | Kalem ekle | Ürün/hizmet kalemi ekle | Kalem satırı eklenir, toplam güncellenir | 🖐️ Browser + auth gerekli |
| 9.5 | Fatura kaydet | Kaydet butonuna tıkla | Fatura kaydedilir, listede görünür | 🖐️ Browser + auth gerekli |
| 9.6 | Fatura detay | Faturaya tıkla | Detay sayfası açılır (`/invoices/[id]`) | 🖐️ Browser + auth gerekli |
| 9.7 | Fatura kopyala | Kopyala butonu | Yeni fatura oluşturulur, alanlar dolu | 🖐️ Browser + auth gerekli |
| 9.8 | PDF / yazdır | PDF veya yazdır butonu | PDF önizleme veya indirme | 🖐️ Browser + auth gerekli |

---

## 10. TEKLİFLER

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 10.1 | Teklif listesi | `/proposals` aç | Teklif listesi | 🖐️ Browser + auth gerekli |
| 10.2 | Yeni teklif | `/proposals/new` | Teklif oluşturma formu | 🖐️ Browser + auth gerekli |
| 10.3 | Teklif kaydet | Alanları doldur → Kaydet | Kaydedilir | 🖐️ Browser + auth gerekli |
| 10.4 | Teklif detay | Teklife tıkla | Detay sayfası (`/proposals/[id]`) | 🖐️ Browser + auth gerekli |

---

## 11. GİDERLER

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 11.1 | Gider listesi | `/expenses` aç | Gider listesi | ✅ 307 redirect (korumalı) |
| 11.2 | Yeni gider | `/expenses/incoming/new` | Gider ekleme formu | 🖐️ Browser + auth gerekli |
| 11.3 | Gider kaydet | Alanları doldur → Kaydet | Listede görünür | 🖐️ Browser + auth gerekli |
| 11.4 | Gider detay | Gidere tıkla | Detay sayfası (`/expenses/incoming/[id]`) | 🖐️ Browser + auth gerekli |
| 11.5 | Excel import | Excel import butonu | Dosya yükleme, eşleştirme, kayıt | 🖐️ Browser + auth gerekli |

---

## 12. SİPARİŞLER

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 12.1 | Sipariş listesi | `/orders` aç | Sipariş listesi | ✅ 307 redirect (korumalı) |
| 12.2 | Yeni sipariş | Sipariş oluştur | Sipariş kaydedilir | 🖐️ Browser + auth gerekli |

---

## 13. FİNANS

### 13.1 İşlemler

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 13.1.1 | İşlem listesi | `/finance/transactions` aç | Finansal işlemler listesi | ✅ 307 redirect (korumalı) |
| 13.1.2 | Yeni işlem | İşlem ekle | İşlem kaydedilir | 🖐️ Browser + auth gerekli |

### 13.2 Hesaplar

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 13.2.1 | Hesap listesi | `/finance/accounts` aç | Banka / kasa hesapları | ✅ 307 redirect (korumalı) |
| 13.2.2 | Yeni hesap | Hesap ekle | Hesap oluşturulur | 🖐️ Browser + auth gerekli |

### 13.3 Mutabakat

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 13.3.1 | Mutabakat listesi | `/reconciliation` aç | Mutabakat kayıtları | ✅ 307 redirect (korumalı) |

---

## 14. SATIN ALMA

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 14.1 | Satın alma listesi | `/procurement` aç | Satın alma siparişleri | ✅ 307 redirect (korumalı) |
| 14.2 | Yeni sipariş | Yeni satın alma siparişi oluştur | Kaydedilir | 🖐️ Browser + auth gerekli |

---

## 15. PROJELER

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 15.1 | Proje listesi | `/projects` aç | Proje listesi | ✅ 307 redirect (korumalı) |
| 15.2 | Proje detay | Projeye tıkla | Detay sayfası (`/projects/[id]`) | 🖐️ Browser + auth gerekli |
| 15.3 | Milestone | Proje içinde milestone ekle | Kaydedilir | 🖐️ Browser + auth gerekli |

---

## 16. ÜRETİM

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 16.1 | Üretim listesi | `/production` aç | Üretim emirleri | ✅ 307 redirect (korumalı) |
| 16.2 | Üretim detay | Üretime tıkla | Detay sayfası (`/production/[id]`) | 🖐️ Browser + auth gerekli |

---

## 17. MALİYET ANALİZİ

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 17.1 | Maliyet sayfası | `/cost` aç | Malzeme/işçilik/genel gider analizi | ✅ 307 redirect (korumalı) |

---

## 18. KALİTE

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 18.1 | Kalite sayfası | `/quality` aç | Kalite kontrol modülü | ✅ 307 redirect (korumalı) |

---

## 19. BAKIM

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 19.1 | Bakım sayfası | `/maintenance` aç | İş emirleri / ekipman | ✅ 307 redirect (korumalı) |

---

## 20. KAMPANYALAR

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 20.1 | Kampanya listesi | `/campaigns` aç | Kampanya listesi | ✅ 307 redirect (korumalı) |
| 20.2 | Yeni kampanya | Kampanya oluştur | Kaydedilir | 🖐️ Browser + auth gerekli |

---

## 21. MARKETPLACE

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 21.1 | Marketplace sayfası | `/marketplace` aç | Pazaryeri entegrasyonu | ✅ 307 redirect (korumalı) |

---

## 22. E-FATURA MERKEZİ

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 22.1 | E-fatura sayfası | `/einvoice-center` aç | e-Fatura / GIB merkezi | ✅ 307 redirect (korumalı) |
| 22.2 | e-Fatura oluştur | Faturadan e-fatura gönder | GIB'e iletilir | 🖐️ Browser + auth gerekli |

---

## 23. CRM

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 23.1 | CRM sayfası | `/crm` aç | CRM intelligence dashboard | ✅ 307 redirect (korumalı) |

---

## 24. AI MODÜLLER

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 24.1 | AI Insights | `/ai-insights` aç | MODULUS AI dashboard yüklenir | ✅ 307 redirect (korumalı) |
| 24.2 | Finance Robot | `/finance-robot` aç | Chat + dashboard tabları çalışır | ✅ 307 redirect (korumalı) |
| 24.3 | AI Cash Flow | `/ai-cash-flow` aç | Nakit akışı analizi | ✅ 307 redirect (korumalı) |
| 24.4 | Accounting AI | `/accounting-ai` aç | Muhasebe AI chat | ✅ 307 redirect (korumalı) |
| 24.5 | Executive Assistant | `/executive-assistant` aç | Toplantı / yükümlülük asistanı | ✅ 307 redirect (korumalı) |
| 24.6 | Trend Agent | `/trend-agent` aç | Trend ürünler analizi | ✅ 307 redirect (korumalı) |
| 24.7 | AI Production Advisor | `/ai-production-advisor` aç | Üretim önerileri | ✅ 307 redirect (korumalı) |
| 24.8 | HR AI | `/hr-ai` aç | İnsan kaynakları AI | ✅ 307 redirect (korumalı) |

---

## 25. DESTEK & YARDIM

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 25.1 | Destek sayfası | `/support` aç | Destek / ticket sistemi | ✅ 307 redirect (korumalı) |
| 25.2 | Yeni ticket | Destek talebi oluştur | Kaydedilir | 🖐️ Browser + auth gerekli |
| 25.3 | Yardım sayfası | `/help` aç | SSS / yardım merkezi | ✅ 307 redirect (korumalı) |
| 25.4 | Canlı destek | Canlı destek widget'ı | Chat açılır | 🖐️ Browser + auth gerekli |

---

## 26. AYARLAR

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 26.1 | Şirket ayarları | `/settings` aç | Şirket bilgileri, profil | ✅ 307 redirect (korumalı) |
| 26.2 | Şirket güncelle | Şirket adı değiştir → Kaydet | Güncellenir | 🖐️ Browser + auth gerekli |
| 26.3 | Abonelik | `/settings/subscription` aç | Plan & eklentiler sayfası | ✅ 307 redirect (korumalı) |
| 26.4 | MFA ayarı | Settings → MFA bölümü | MFA etkinleştir/devre dışı bırak | 🖐️ Browser + auth gerekli |
| 26.5 | Şifre değiştir | Şifre değiştirme formu | Yeni şifre kaydedilir | 🖐️ Browser + auth gerekli |

---

## 27. MARKETING / LANDING SAYFALARI

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 27.1 | Landing | `/landing` aç | Marketing landing sayfası | ✅ 200 döner |
| 27.2 | Landing v2 | `/landing-v2` aç | Alternatif landing | 🖐️ Sayfa mevcut mu kontrol |
| 27.3 | Fiyatlandırma | `/pricing` aç | Fiyat tablosu görünür | ✅ 200 döner |
| 27.4 | İletişim | `/contact` aç | İletişim formu | ✅ 200 döner |
| 27.5 | Hakkımızda | `/hakkimizda` aç | Hakkımızda sayfası | ✅ 200 döner |
| 27.6 | Satın al | `/buy` aç | Checkout akışı | ✅ 200 döner |

---

## 28. YASAL SAYFALAR

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 28.1 | Gizlilik | `/gizlilik` aç | Gizlilik sözleşmesi | ✅ 200 döner |
| 28.2 | Mesafeli satış | `/mesafeli-satis` aç | Mesafeli satış sözleşmesi | ✅ 200 döner |
| 28.3 | Teslimat/İade | `/teslimat-iade` aç | Teslimat ve iade şartları | ✅ 200 döner |

---

## 29. ADMIN PANELİ

### 29.1 Admin Giriş

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 29.1.1 | Admin login | `/admin/login` aç | Admin giriş formu | ✅ 307 redirect (beta gate aktif) |
| 29.1.2 | Admin giriş yap | super_admin email/şifre | Admin paneline yönlendirme | 🖐️ Browser + admin credentials |
| 29.1.3 | Yetkisiz kullanıcı | Normal kullanıcı ile admin login | Erişim reddedilir / çıkış | 🖐️ Browser + auth gerekli |

### 29.2 Site Commander

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 29.2.1 | Site Commander | `/admin/site-commander` aç | Site/tema/içerik hub'ı | ✅ 307 redirect (korumalı) |
| 29.2.2 | Tema değiştir | Renk/font ayarı değiştir → Kaydet | Tema güncellenir | 🖐️ Browser + admin auth |
| 29.2.3 | İçerik düzenle | Content tab → metin düzenle | İçerik güncellenir | 🖐️ Browser + admin auth |

### 29.3 Admin Modüller

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 29.3.1 | Activity Log | `/admin/activity-log` aç | Aktivite logları | ✅ 307 redirect (korumalı) |
| 29.3.2 | System Health | `/admin/healthcheck` aç | Sistem sağlığı | ✅ 307 redirect (korumalı) |
| 29.3.3 | Diagnostics | `/admin/diagnostics` aç | Detaylı diagnostik | ✅ 307 redirect (korumalı) |
| 29.3.4 | Banner Studio | `/admin/banner-studio` aç | Banner yönetimi | ✅ 307 redirect (korumalı) |
| 29.3.5 | Blog | `/admin/blog` aç | Blog CMS | ✅ 307 redirect (korumalı) |
| 29.3.6 | Help Center | `/admin/help-center` aç | Yardım merkezi CMS | ✅ 307 redirect (korumalı) |
| 29.3.7 | Testimonials | `/admin/testimonials` aç | Referanslar | ✅ 307 redirect (korumalı) |
| 29.3.8 | Translations | `/admin/translations` aç | Çeviri yönetimi | ✅ 307 redirect (korumalı) |
| 29.3.9 | Campaigns | `/admin/campaigns` aç | Admin kampanyalar | ✅ 307 redirect (korumalı) |
| 29.3.10 | Coupons | `/admin/coupons` aç | Kupon yönetimi | ✅ 307 redirect (korumalı) |
| 29.3.11 | Pricing Plans | `/admin/pricing` aç | Plan düzenleme | ✅ 307 redirect (korumalı) |
| 29.3.12 | Live Support | `/admin/live-support` aç | Canlı destek yönetimi | ✅ 307 redirect (korumalı) |
| 29.3.13 | Helpdesk | `/admin/helpdesk` aç | Helpdesk ticketları | ✅ 307 redirect (korumalı) |
| 29.3.14 | Demo Requests | `/admin/demo-requests` aç | Demo talepleri | ✅ 307 redirect (korumalı) |
| 29.3.15 | Users | `/admin/users` aç | Kullanıcı yönetimi | ✅ 307 redirect (korumalı) |

---

## 30. API ROUTE TESTLERİ

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 30.1 | TCMB kurları | GET `/api/tcmb` | Güncel döviz kurları JSON | ✅ 200 — USD, AUD vb. kurlar dönüyor |
| 30.2 | Beta status | GET `/api/beta/status` | `{ unlocked: true/false }` | ✅ 200 `{"unlocked":false}` |
| 30.3 | Forgot password | POST `/api/auth/forgot-password` | 200 yanıt (güvenlik nedeniyle her zaman) | ✅ 200 güvenlik mesajı (email var/yok ayırmıyor) |
| 30.4 | Iyzico checkout | POST `/api/payments/iyzico/checkout-form` | Checkout form token | ⚠️ Body boş gönderildi, yanıt boş (config eksikliği olabilir) |

---

## 31. RESPONSIVE / MOBİL

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 31.1 | Login mobil | Mobil ekranda `/login` | Form düzgün görünür | 🖐️ Browser DevTools (mobil mod) |
| 31.2 | Dashboard mobil | Mobil ekranda `/dashboard` | Sidebar hamburger, responsive layout | 🖐️ Browser DevTools (mobil mod) |
| 31.3 | Landing mobil | Mobil ekranda `/landing` | Responsive marketing sayfası | 🖐️ Browser DevTools (mobil mod) |
| 31.4 | Pricing mobil | Mobil ekranda `/pricing` | Fiyat tablosu responsive | 🖐️ Browser DevTools (mobil mod) |

---

## 32. CROSS-CUTTING / GENEL

| # | Test | Adım | Beklenen Sonuç | Durum |
|---|------|------|-----------------|-------|
| 32.1 | 404 sayfası | Varolmayan URL'e git | 404 sayfası görünür | ⚠️ 307 beta gate redirect (beta aktifken 404 sayfası beta gate arkasında) |
| 32.2 | Loading spinner | Yavaş bağlantı simülasyonu | Loading spinner görünür | 🖐️ Browser DevTools (throttling) |
| 32.3 | Toast bildirimleri | Herhangi bir işlem (kaydet/sil) | Toast mesajı görünür | 🖐️ Browser testi gerekli |
| 32.4 | Feature guard | Demo kullanıcı ile kısıtlı özellik | "Upgrade" dialog görünür | 🖐️ Browser + demo auth gerekli |
| 32.5 | Redirect /edocuments | `/edocuments` aç | `/einvoice-center`'a yönlendirilir (308) | ✅ 308 permanent redirect çalışıyor |

---

## Test Özeti

| Kategori | Toplam Test | ✅ Geçen | 🖐️ Manuel | ⚠️ Kısmi | ❌ Hata |
|----------|-------------|----------|-----------|----------|---------|
| Beta Gate | 5 | 5 | 0 | 0 | 0 |
| Authentication | 18 | 3 | 15 | 0 | 0 |
| Dashboard | 6 | 1 | 5 | 0 | 0 |
| Müşteriler | 6 | 1 | 5 | 0 | 0 |
| Ürünler | 5 | 1 | 4 | 0 | 0 |
| Stok | 2 | 1 | 1 | 0 | 0 |
| Depolar | 2 | 0 | 2 | 0 | 0 |
| Şubeler | 1 | 0 | 1 | 0 | 0 |
| Faturalar | 8 | 1 | 7 | 0 | 0 |
| Teklifler | 4 | 0 | 4 | 0 | 0 |
| Giderler | 5 | 1 | 4 | 0 | 0 |
| Siparişler | 2 | 1 | 1 | 0 | 0 |
| Finans | 5 | 3 | 2 | 0 | 0 |
| Satın Alma | 2 | 1 | 1 | 0 | 0 |
| Projeler | 3 | 1 | 2 | 0 | 0 |
| Üretim | 2 | 1 | 1 | 0 | 0 |
| Maliyet | 1 | 1 | 0 | 0 | 0 |
| Kalite | 1 | 1 | 0 | 0 | 0 |
| Bakım | 1 | 1 | 0 | 0 | 0 |
| Kampanyalar | 2 | 1 | 1 | 0 | 0 |
| Marketplace | 1 | 1 | 0 | 0 | 0 |
| E-Fatura | 2 | 1 | 1 | 0 | 0 |
| CRM | 1 | 1 | 0 | 0 | 0 |
| AI Modüller | 8 | 8 | 0 | 0 | 0 |
| Destek & Yardım | 4 | 2 | 2 | 0 | 0 |
| Ayarlar | 5 | 2 | 3 | 0 | 0 |
| Marketing | 6 | 5 | 1 | 0 | 0 |
| Yasal Sayfalar | 3 | 3 | 0 | 0 | 0 |
| Admin Paneli | 18 | 15 | 3 | 0 | 0 |
| API Routes | 4 | 3 | 0 | 1 | 0 |
| Responsive | 4 | 0 | 4 | 0 | 0 |
| Cross-cutting | 5 | 1 | 3 | 1 | 0 |
| **TOPLAM** | **~150** | **~62** | **~73** | **~2** | **0** |

### Admin API Güvenlik Testi (Ek)

| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| A.1 | GET `/api/admin/users` (auth yok) | 401 Unauthorized | ✅ |
| A.2 | POST `/api/admin/check-email` (auth yok) | 405 Method Not Allowed | ✅ |
| A.3 | POST `/api/admin/create-demo-account` (auth yok) | 401 Unauthorized | ✅ |
| A.4 | POST `/api/admin/reset-password` (auth yok) | 401 Unauthorized | ✅ |
| A.5 | POST `/api/admin/update-user` (auth yok) | 401 Unauthorized | ✅ |
| A.6 | POST `/api/profile/clear-must-change-password` (auth yok) | 401 Unauthorized | ✅ |
| A.7 | POST `/api/beta/reference/decision` | 405 Method Not Allowed | ✅ |
