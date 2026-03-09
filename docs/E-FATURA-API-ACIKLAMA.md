# E-Invoice API – Açıklama

Bu doküman, NES E-Fatura API’sinin OpenAPI 3.0.1 spesifikasyonuna göre **kısa açıklamasını** ve projemizdeki kullanımını özetler.

**Test ortamı ve Swagger/Postman:** Resmi NES dokümanları ve test kurum bilgileri için bkz. [NES e-Dönüşüm API – Test Bilgileri](./NES-E-DONUSUM-API-TEST-BILGILERI.md).

## API Genel Bilgisi

- **Başlık:** E-Invoice API  
- **Sürüm:** v1 (tag’li)  
- **Base path:** `/einvoice` (sunucu tarafında NES base URL’e eklenir; örn. `https://apitest.nes.com.tr/einvoice`)  
- **Kimlik doğrulama:** Bearer token (API anahtarı)

## Ana Bölümler (Tag’ler)

| Tag | Açıklama |
|-----|----------|
| **E-Fatura Yükleme** | Belge yükleme, taslak oluşturma/gönderme, önizleme |
| **Giden Faturalar** | Giden e-fatura listesi, detay, taslaklar, PDF/XML/HTML, toplu aktarım |
| **Gelen Faturalar** | Gelen e-fatura listesi, detay, cevap (KABUL/RED), iade oluşturma |
| **Gelen/Giden Fatura İşlemleri** | Etiket, firma kaydetme, toplu durum, mail gönderimi |
| **Gelen/Giden Fatura Dışa Aktar** | XML, PDF, Zarf, UnifiedPdf, Excel toplu aktarım |
| **Eski Fatura Yükleme** | Eski belgeleri ZIP ile yükleme, kuyruk, sonuç raporu |
| **Gelen/Giden Eski Faturalar** | Eski belgeleri listeleme, XML/PDF/HTML indirme |
| **Seri Tanımlamaları** | Seri CRUD, varsayılan, sayaç güncelleme |
| **Tasarım Tanımlamaları** | XSLT tasarımları, varsayılan, önizleme |
| **Özelleştirilebilir Tasarım Ayarları** | Logo, kaşe, imza, barkod, banka bilgisi vb. |
| **Dosya Ad Tanımlamaları** | XML/PDF indirme dosya adı başlıkları |
| **Etiket İşlemleri** | Etiket CRUD, fatura etiketleme |
| **Mükellef Listesi** | VKN/TCKN ile sorgulama, ZIP indirme |
| **Zarf İşlemleri** | Zarf durum sorgulama |
| **Gelen/Giden Fatura Dinamik Bild.** | Kural tabanlı bildirimler |
| **Gelen Fatura Excel Rapor** | Şablonlar, rapor oluşturma/indirme |

## Önemli Uç Noktalar (Projemizle İlişkisi)

Projede **Supabase Edge Function** (`nes-edocument`) NES API’ye vekil olarak istek atar. Aşağıdaki API uçları bu vekil üzerinden kullanılabilir / genişletilebilir:

| NES API path | Projedeki karşılık / kullanım |
|--------------|------------------------------|
| `POST /v1/uploads/document` | `sendInvoice` / `sendEArchive` – UBL-TR XML veya zip ile belge gönderimi |
| `GET /v1/outgoing/invoices` | `getOutgoingInvoices` – Giden fatura listesi (tarih aralığı) |
| `GET /v1/incoming/invoices` | `getIncomingInvoices` – Gelen fatura listesi |
| `GET /v1/outgoing/invoices/{uuid}/pdf` | `getInvoiceHtml` benzeri – PDF/HTML indirme |
| `GET /v1/outgoing/invoices/{uuid}/xml` | `getInvoiceXml` – XML indirme |
| `GET /v1/users/{identifier}/{aliasType}` | `checkTaxpayer` – VKN/TCKN ile mükellef sorgulama |
| `GET /v1/envelopes/{instanceIdentifier}/query` | Zarf durumu – ileride entegre edilebilir |

## Zorunlu / Sık Kullanılan Parametreler

- **Belge yükleme:** `SenderAlias`, `ReceiverAlias` (isteğe bağlı e-arşiv için), `File` (UBL-TR XML veya zip), `IsDirectSend`, `PreviewType`, `SourceApp`, `AutoSaveCompany`.
- **Liste istekleri:** Çoğunda `sort`, `pageSize`, `page`; tarih filtreleri için `startDate`, `endDate` veya `startCreateDate`, `endCreateDate`.

## Hata ve Güvenlik

- **400:** Geçersiz istek; `invalidFields` ile alan bazlı hatalar.
- **403:** Yetkisiz erişim; gerekli scope/rol yok.
- **422:** İşlenemeyen varlık; şematron/şema hatası, `errors` dizisi (kod, description, detail).
- Tüm ilgili uçlar **Bearer** token ile korunur; NES portal/API anahtarı kullanılır.

## Proje Tarafında Notlar

1. **Base URL:** NES’in verdiği gerçek API adresi kullanılmalı (örn. `https://apitest.nes.com.tr`); dokümantasyon adresi (`developertest.nes.com.tr`) **değil**.
2. **Vekil:** İstekler `lib/nes-api.ts` → Supabase `nes-edocument` Edge Function → **E-Fatura API** (`/einvoice` + `/v1/...`) akışıyla gider; API anahtarı, base URL ve gönderici etiketi `edocument_settings` içinden alınır.
3. **Kullanılan API:** Proje bu E-Invoice API spec'ini kullanacak şekilde yapılandırılmıştır. Bağlantı testi, mükellef sorgulama, gelen/giden liste, XML/HTML indirme, belge yükleme (UBL), taslak gönder/sil ve toplu transfer bu API üzerinden yapılır.
4. **Gönderici etiketi:** Belge yüklemede (UBL) `SenderAlias` zorunludur; Kurulum ekranındaki alandan veya istek parametresinden gönderilir.
5. **OpenAPI spec:** Tam OpenAPI 3.0.1 tanımı projede `docs/e-invoice-api-openapi.json` (veya NES’ten aldığınız güncel spec) ile saklanabilir; yeni entegrasyonlar için referans olarak kullanılır.

Bu açıklama, paylaşılan E-Invoice API OpenAPI spesifikasyonuna dayanmaktadır.
