# NES e-Dönüşüm API – Doküman ve Test Bilgileri

Resmi NES e-Dönüşüm API dokümanlarına ve test ortamı bilgilerine ait özet.

## Dokümantasyon

- **Genel doküman:** https://developertest.nes.com.tr/docs  
  NES e-Dönüşüm API dokümanlarına bu adresten ulaşabilirsiniz.

## Test ortamı API adresi

Tüm test API’leri aşağıdaki base URL üzerindedir:

- **Base URL:** `https://apitest.nes.com.tr`  
  (Uygulama ayarlarında “API adresi” alanına sadece bu adres yazılır; örn. `https://apitest.nes.com.tr`)

## Swagger ve Postman

E-Dönüşüm API’lerini Swagger arayüzü veya Postman Collection ile denemek için:

| Modül      | Swagger URL | Postman Collection |
|-----------|-------------|--------------------|
| **E-Fatura**  | https://apitest.nes.com.tr/einvoice/index.html | https://apitest.nes.com.tr/einvoice/v1.swagger.taged.json |
| **E-Arşiv**   | https://apitest.nes.com.tr/earchive/index.html | https://apitest.nes.com.tr/earchive/v1.swagger.taged.json |
| **E-SMM**     | https://apitest.nes.com.tr/esmm/index.html     | https://apitest.nes.com.tr/esmm/v1.swagger.taged.json |
| **E-MM**      | https://apitest.nes.com.tr/emm/index.html      | https://apitest.nes.com.tr/emm/v1.swagger.taged.json |
| **E-İrsaliye**| https://apitest.nes.com.tr/edespatch/index.html | https://apitest.nes.com.tr/edespatch/v1.swagger.taged.json |

Bu iki test kurum bilgileriyle birbirleri arasında e-Fatura ve e-İrsaliye gönderimleri yapabilirsiniz.

---

## Test Kurum – 01

| Alan | Değer |
|------|--------|
| **Vergi Kimlik No** | 1234567801 |
| **Kullanıcı Adı** | test01@nes.com.tr |
| **Parola** | U782pAd4%gGO |
| **API KEY** | C35FE137CBB6EB376E33C47A46B8BBCB17970689CB09BA55AF212BFDAF4A5F9D |
| **Gönderici Etiket** | urn:mail:defaultgb@nes.com.tr, urn:mail:merkezgb@nes.com.tr |
| **Porta Kutusu Etiket** | urn:mail:defaultpk@nes.com.tr, urn:mail:merkezpk@nes.com.tr |

---

## Test Kurum – 02

| Alan | Değer |
|------|--------|
| **Vergi Kimlik No** | 1234567802 |
| **Kullanıcı Adı** | test02@nes.com.tr |
| **Parola** | b48Za0*RFmE$ |
| **API KEY** | 2EA5ADFA0A1C2A6E0E2C03DFABCEA1DD9A183AD24596A4405D5F7C8109D0B085 |
| **Gönderici Etiket** | urn:mail:defaultgb@nes.com.tr, urn:mail:merkezgb@nes.com.tr |
| **Porta Kutusu Etiket** | urn:mail:defaultpk@nes.com.tr, urn:mail:merkezpk@nes.com.tr |

---

## Uygulama Kurulumu ile eşleştirme

1. **API adresi:** `https://apitest.nes.com.tr` (sonunda `/` olmadan)
2. **API anahtarı:** İlgili test kurumun API KEY değeri
3. **Gönderici etiketi (SenderAlias):** E-Fatura belge yüklemede kullanılacak etiket (örn. `urn:mail:defaultgb@nes.com.tr` veya `urn:mail:merkezgb@nes.com.tr`)

Test Kurum 01 ile giriş yapıp Test Kurum 02’ye fatura/irsaliye göndermek (veya tersi) için her iki tarafta da ilgili kurumun VKN ve alıcı etiket bilgileri kullanılmalıdır.

---

*Kaynak: Dijital Faturalandırma Entegratörü – NES – nes.com.tr*
