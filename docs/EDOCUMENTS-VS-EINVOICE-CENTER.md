# /edocuments ile /einvoice-center Farkı

## Menü

- **E-Belge İşlemleri** (sidebar’da üst başlık) altında iki alt menü vardır:
  - **E-Belgeler** → `/edocuments` (e-belge listesi ve NES senkronu)
  - **E-Fatura Merkezi** → `/einvoice-center` (e-fatura/e-arşiv odaklı ekran)

Daha önce sadece "E-Fatura Merkezi" alt menüde vardı; "E-Belgeler" (`/edocuments`) eklendi ve artık ikisi de menüde görünür.

---

## /edocuments (E-Belgeler)

- **Amaç:** Tüm e-belgeleri (gelen + giden) listeleme, NES’ten senkron etme.
- **Özellikler:**
  - NES API’den **gelen** ve **giden** faturaları senkron etme (Gelen/Giden Senkronize).
  - E-belge listesi (EdocumentList) – yön, tür, tarih vb. filtreler.
  - İstatistikler (EdocumentStats).
  - Kurulum, Mükellef Sorgula, Fatura Gönder sekmeleri.
- **Kullanım:** NES’ten fatura çekip yerel `edocuments` tablosuna aktarmak ve tüm e-belgeleri tek listede görmek için.

---

## /einvoice-center (E-Fatura Merkezi)

- **Amaç:** E-fatura/e-arşiv kurulumu, gönderilen faturaların listesi, mükellef sorgulama ve fatura gönderme.
- **Özellikler:**
  - **Kurulum:** NES API ayarları, firma bilgileri, modül seçimi (E-Fatura / E-Arşiv).
  - **Fatura Listesi:** Sadece **gönderilen** (outgoing) e-faturalar; tarih, ünvan, tutar, fatura no filtreleri; XML/PDF görüntüleme.
  - **Mükellef Sorgula:** VKN/TCKN ile e-fatura mükellefi sorgulama.
  - **Fatura Gönder:** Sistemdeki faturalardan e-fatura/e-arşiv gönderme.
- **Kullanım:** Günlük e-fatura/e-arşiv işleri: kurulum, fatura gönderme, gönderilenleri filtreleyip görüntüleme.

---

## Özet

| Özellik           | /edocuments        | /einvoice-center     |
|------------------|---------------------|------------------------|
| NES’ten senkron  | Var (gelen + giden) | Yok                    |
| Belge listesi     | Tüm e-belgeler      | Sadece gönderilenler   |
| Filtreler         | Yön, tür, tarih vb. | Tarih, ünvan, tutar, no |
| Kurulum / Gönder  | Var                 | Var                    |
| Odak              | E-belge havuzu      | E-fatura/e-arşiv işlemleri |
