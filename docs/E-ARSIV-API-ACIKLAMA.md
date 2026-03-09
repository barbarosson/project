# E-Archive (E-Arşiv) API – Açıklama

Bu doküman, NES **E-Arşiv API**’sinin OpenAPI 3.0.1 spesifikasyonuna göre kısa açıklamasını ve projemizdeki kullanımını özetler.

**Test ortamı ve Swagger/Postman:** Resmi NES dokümanları ve test kurum bilgileri için bkz. [NES e-Dönüşüm API – Test Bilgileri](./NES-E-DONUSUM-API-TEST-BILGILERI.md).

---

## API Genel Bilgisi

| Özellik | Değer |
|--------|--------|
| **Başlık** | E-Archive API |
| **Sürüm** | v1 (tag’li) |
| **Base path** | `/earchive` (NES base URL’e eklenir; örn. `https://apitest.nes.com.tr/earchive`) |
| **Kimlik doğrulama** | Bearer token (JWT) |

E-Arşiv, e-faturaya tabi olmayan (B2C vb.) alıcılara kesilen elektronik arşiv faturalarını yönetmek için kullanılır.

---

## Ana Bölümler (Tag’ler)

| Tag | Açıklama |
|-----|----------|
| **E-Arşiv Fatura Yükleme** | Belge önizleme, UBL-TR XML yükleme, taslak güncelleme, taslak gönderme, pazaryeri siparişlerinden fatura oluşturma |
| **Faturalar** | e-Arşiv fatura listesi, son 10, taslaklar, detay, XML/PDF/HTML, irsaliye/vergi/ek/geçmiş, iptal edilenler, mail gönderimi |
| **Fatura İşlemleri** | İptal, iptal geri alma, etiket ekleme/çıkarma, firma olarak kaydetme, toplu durum (Printed/Unprinted) |
| **Dışa Aktar** | Tekil XML/PDF indirme, toplu aktarım (Xml, Envelope, Pdf, UnifiedPdf, Excel; max 100 UUID) |
| **Kullanıcı Notları** | Belgeye not ekleme, güncelleme, silme |
| **Eski Faturalar** | Eski belgeleri listeleme, ZIP ile yükleme, yükleme kuyruğu, sonuç indirme, XML/PDF/HTML ve toplu dışa aktarım |
| **Seri Tanımlamaları** | Seri listesi/ekleme/sorgulama/silme, varsayılan, durum (Active/Passive/Deleted), sayaç güncelleme, sayaç geçmişi |
| **Tasarım Tanımlamaları** | XSLT tasarımları listesi/ekleme/indirme/güncelleme/silme, varsayılan, önizleme |
| **Özelleştirilebilir Tasarım Ayarları** | Tasarım ayarları, logo/kaşe/imza yükleme/silme, tasarım önizleme |
| **Dosya Ad Tanımlamaları** | Dışa aktarma dosya adı başlıkları (kullanılabilir alanlar, tanım getir/güncelle) |
| **Etiket İşlemleri** | Etiket CRUD; faturalara etiket ekleme/çıkarma (toplu, max 100 belge) |
| **Dinamik Fatura Bildirimleri** | Kural listesi/oluşturma/detay/güncelleme/silme (kriterlere göre bildirim) |
| **Excel Rapor Modülü** | Rapor listesi/oluşturma/indirme, şablon listesi/CRUD, kolon listesi |
| **Mailing Tanımlamaları** | Mail ve SMS ayarları (get/put) |

---

## Önemli Uç Noktalar

### E-Arşiv Fatura Yükleme ve Taslak

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/v1/uploads/document/preview` | Belge önizleme (multipart: **File** UBL-TR XML, max 1MB; isteğe bağlı DocumentTemplateTitle) |
| POST | `/v1/uploads/document` | Belge yükle (multipart: **File**, **AutoSaveCompany**, **IsDirectSend**, **PreviewType**, **SourceApp**; isteğe DocumentTemplate, SourceAppRecordId, MarketPlace alanları) |
| PUT | `/v1/uploads/document/{uuid}` | Taslak belge güncelle (henüz onaylanmamış) |
| POST | `/v1/uploads/draft/send` | Taslakları gönder (body: UUID dizisi, **max 25**) |
| POST | `/v1/uploads/draft/create/{id}` | Mevcut belgeden taslak oluştur |

### Fatura Listesi ve Detay

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/v1/invoices` | Fatura listesi (sort, pageSize, page, startDate, endDate, company, uuid, documentNumber, invoiceStatus, reportDivisionStatus, includeCanceledDocuments, sendType, salesPlatform, tags, userNote, documentNote, despatchNumber, orderNumber, mailStatus, smsStatus, invoiceTypeCode, startCreateDate, endCreateDate vb.) |
| GET | `/v1/invoices/last` | Son 10 e-Arşiv fatura |
| GET | `/v1/invoices/drafts` | Taslak listesi |
| DELETE | `/v1/invoices/drafts` | Taslak sil (body: UUID dizisi) |
| GET | `/v1/invoices/{uuid}` | Belge detayı |
| GET | `/v1/invoices/canceled` | İptal edilen faturalar |
| GET | `/v1/invoices/canceled/last` | İptal edilen son 10 fatura |

### Dışa Aktar (Tekil / Toplu)

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/v1/invoices/{uuid}/xml` | XML indir |
| GET | `/v1/invoices/{uuid}/pdf` | PDF indir (header: x-default-xslt-used, x-xslt-error) |
| GET | `/v1/invoices/{uuid}/html` | HTML görüntü |
| POST | `/v1/invoices/export/{fileType}` | Toplu dışa aktar; **fileType:** Xml, Envelope, Pdf, UnifiedPdf, Excel; body: UUID dizisi, **max 100**; yanıt ZIP |

### Fatura İşlemleri

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/v1/invoices/cancel` | Belge iptal (body: DocumentCancellationDto **uuids**, **max 50**) |
| POST | `/v1/invoices/canceled/withdraw` | İptal geri al (henüz raporlanmamış; body: uuids, max 50) |
| PUT | `/v1/invoices/tags` | Etiket ekle/çıkar (body: TaggingDto; max 100 belge) |
| POST | `/v1/invoices/{uuid}/savecompanyindocument` | Gönderici/alıcıyı Firma Listesi’ne kaydet |
| PUT | `/v1/invoices/bulk/{operation}` | Toplu durum: **operation** = Printed | Unprinted; body: UUID dizisi |
| POST | `/v1/invoices/email/send` | Mail ile ilet (max 50 belge, 10 mail adresi) |

### Eski Faturalar

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/v1/exinvoices` | Eski belge listesi (company, uuid, documentNumber, sort, pageSize, page, startDate, endDate) |
| POST | `/v1/exinvoices` | Eski belge yükle (multipart: **File** ZIP; iç içe zip/klasör desteklenir) |
| GET | `/v1/exinvoices/queue` | Yükleme kuyruğu |
| GET | `/v1/exinvoices/queue/{id}` | Yükleme sonuç raporu (Excel) |
| GET | `/v1/exinvoices/{uuid}/xml` \| `/pdf` \| `/html` | Eski belge XML/PDF/HTML |
| POST | `/v1/exinvoices/export/{fileType}` | Eski belgeleri toplu dışa aktar (fileType: Xml, Pdf, UnifiedPdf, Excel; max 100) |

### Seri ve Tasarım Tanımlamaları

| Method | Path | Açıklama |
|--------|------|----------|
| GET / POST | `/v1/definitions/series` | Seri listesi / seri ekle |
| GET / DELETE | `/v1/definitions/series/{id}` | Seri getir / sil |
| GET | `/v1/definitions/series/{serie}` | Ön eke göre seri getir |
| GET | `/v1/definitions/series/{id}/set/{status}` | Seri durumu: Active \| Passive \| Deleted |
| GET | `/v1/definitions/series/{id}/setdefault` | Seriyi varsayılan yap |
| GET | `/v1/definitions/series/{id}/{year}/setnumber/{nextNumber}` | Sayaç güncelle |
| GET | `/v1/definitions/documenttemplates` | Tasarım listesi |
| GET / POST / PUT / DELETE | `/v1/definitions/documenttemplates/{id}` | Tasarım indir / güncelle / sil; setdefault, preview |

---

## Zorunlu / Sık Kullanılan Parametreler

- **Belge yükleme (POST /v1/uploads/document):**  
  **File** (UBL-TR XML veya zip), **AutoSaveCompany**, **IsDirectSend**, **PreviewType**, **SourceApp**.  
  İsteğe bağlı: DocumentTemplate, SourceAppRecordId, MarketPlaceOrderDate, MarketPlaceOrderNumber, MarketPlaceProvider, MarketPlaceSupplierId.
- **Liste istekleri:** Çoğunda **sort**, **pageSize**, **page** zorunlu; filtre için startDate, endDate, company, uuid, documentNumber, invoiceStatus, reportDivisionStatus, includeCanceledDocuments vb.
- **İptal / İptal geri alma:** Body’de **uuids** (UUID dizisi; sırayla max 50).
- **Taslak gönder:** Body’de UUID dizisi, **max 25**.
- **Toplu dışa aktarım:** Body’de UUID dizisi, **max 100**; **fileType:** Xml, Envelope, Pdf, UnifiedPdf, Excel.

---

## Hata ve Güvenlik

- **400:** Geçersiz istek; `invalidFields` (field, description, detail).
- **403:** Yetkisiz erişim; gerekli scope/rol yok (örn. earchive:upload:write, earchive:outgoing:list:read).
- **404:** Kayıt bulunamadı.
- **409:** Kayıt daha önce eklendi / numaralandırma çakışması.
- **422:** İşlenemeyen istek; `errors` dizisi (code, description, detail). Örnek kodlar: NOT_ZIP_FILE, DOCUMENT_COULD_NOT_BE_PARSED, SCHEMATRON_CHECK_RESULT_HAS_FAILED, RECORD_EXISTS, RECORD_ALREADY_CANCELED, MODULE_DOES_NOT_EXIST, MODULE_NOT_ACTIVE vb.
- Tüm uçlar **Bearer** token ile korunur.

---

## Proje Tarafında Eşleşme

Projede E-Arşiv işlemleri şu an **eski NES v2** uçları üzerinden yapılıyor; Edge Function `nes-edocument` içinde:

| Proje action / lib fonksiyonu | Mevcut (v2) path | Yeni E-Arşiv API karşılığı |
|------------------------------|------------------|-----------------------------|
| `send_earchive` / `sendEArchive()` | `/api/v2/EArchive/SendInvoice` | `POST /earchive/v1/uploads/document` (multipart: File, IsDirectSend, PreviewType, SourceApp, AutoSaveCompany) |
| `get_earchive_status` / `getEArchiveStatus()` | `/api/v2/EArchive/GetInvoiceStatus` | Liste/detay için `GET /earchive/v1/invoices` veya `GET /earchive/v1/invoices/{uuid}` |
| `cancel_earchive` / `cancelEArchive()` | `/api/v2/EArchive/CancelInvoice` | `POST /earchive/v1/invoices/cancel` (body: { uuids }) |
| `get_earchive_pdf` / `getEArchivePdf()` | `/api/v2/EArchive/GetInvoicePdf` | `GET /earchive/v1/invoices/{uuid}/pdf` |

**Notlar:**

1. **Base URL:** NES’in verdiği API adresi kullanılmalı (örn. `https://apitest.nes.com.tr`); base path **earchive** olarak eklenir.
2. **Gönderici etiketi:** Yeni API’de multipart form’da SenderAlias açıkça geçmiyor; gerekirse NES dokümantasyonu veya portal ile doğrulanmalı. E-Fatura tarafında `SenderAlias` zorunluydu; E-Arşiv’de davranış aynı olabilir.
3. **Vekil akışı:** İstekler `lib/nes-api.ts` → Supabase `nes-edocument` Edge Function → NES **E-Arşiv API** (`/earchive` + `/v1/...`) şeklinde gidebilir. Tam geçiş için Edge Function’da `baseUrl`’e `/earchive` eklenip yukarıdaki v1 path’leri kullanılabilir.
4. **E-Fatura ile fark:** E-Fatura API base path `/einvoice`, E-Arşiv API base path `/earchive`. Aynı NES hesabı ve Bearer token ile her iki base’e de istek atılır.

Bu açıklama, paylaşılan E-Archive API OpenAPI 3.0.1 spesifikasyonuna dayanmaktadır.
