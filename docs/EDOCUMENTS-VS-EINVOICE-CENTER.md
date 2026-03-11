# E-Belge: Sadece E-Fatura Merkezi (/einvoice-center)

## Güncel durum

**`/edocuments` kaldırıldı.** E-belge işlemleri için tek sayfa kullanılır:

- **E-Fatura Merkezi** → **http://localhost:3000/einvoice-center** (veya production’da `/einvoice-center`)

Eski `/edocuments` adresi açılırsa otomatik olarak `/einvoice-center` sayfasına yönlendirilir.

---

## /einvoice-center (E-Fatura Merkezi)

- **Amaç:** E-fatura/e-arşiv kurulumu, gelen/giden faturalar, NES senkronu, mükellef sorgulama ve fatura gönderme.
- **Özellikler:**
  - **Kurulum:** NES API ayarları, firma bilgileri, modül seçimi (E-Fatura / E-Arşiv).
  - **Gelen faturalar:** NES’ten senkron, listeleme, içe aktar (alış faturası oluşturma), XML/PDF görüntüleme.
  - **Giden faturalar:** Gönderilen e-faturalar listesi, filtreler, XML/PDF.
  - **Mükellef Sorgula:** VKN/TCKN ile e-fatura mükellefi sorgulama.
  - **Fatura Gönder:** Sistemdeki faturalardan e-fatura/e-arşiv gönderme.
- **Kullanım:** Tüm e-belge işlemleri bu sayfadan yapılır.

---

## Teknik notlar

- Menü öğeleri `navigation_menus` tablosundan gelir; `/edocuments` migration ile silinmiştir.
- Erişim kontrolü: `FEATURE_TO_ROUTE_MAP` içinde sadece `'/einvoice-center': ['einvoice']` tanımlıdır.
- Veri: E-belgeler `edocuments` tablosunda tutulur; sayfa route’u değiştiği için tablo adı aynı kalmıştır.
