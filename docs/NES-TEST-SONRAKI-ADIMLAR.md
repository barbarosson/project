# NES E-Fatura – Bağlantı Sonrası Test Adımları

Bağlantı testi başarılı olduktan sonra aşağıdaki adımlarla entegrasyonu test edebilirsiniz.

---

## 1. Kurulumu tamamlayın

- **E-Fatura Merkezi → Kurulum** sekmesinde:
  - **Gönderici etiketi (SenderAlias):** Test Kurum 01 için `urn:mail:defaultgb@nes.com.tr` (veya Test Kurum 02 için kendi etiketiniz)
  - **API adresi:** `https://apitest.nes.com.tr`
  - **API anahtarı:** İlgili test kurumun API KEY’i
- **Kaydet** deyip tekrar **Bağlantıyı test et** ile kontrol edin.

---

## 2. Mükellef sorgulama (VKN/TCKN)

- Kurulum sayfasında veya **E-Belgeler** alanında VKN sorgulama varsa:
  - **Test Kurum 02 VKN:** `1234567802` (Test Kurum 01’den fatura alacak taraf)
  - Sorgulama başarılı olursa alıcı e-fatura mükellefi olarak görünür.

---

## 3. Gelen / giden fatura listesini çekin

- **E-Belgeler** sayfasına gidin (veya ana menüden E-Belgeler / E-Fatura bölümü).
- **Gelen faturaları senkronize et** veya **Giden faturaları senkronize et** butonuna tıklayın.
- Son 30 günün listesi NES’ten çekilir; kayıtlar listede görünür (test ortamında liste boş da olabilir).

---

## 4. Test fatura gönderimi (iki test kurum arasında)

- **Test Kurum 01** ile giriş yapmış gibi davranıyorsanız (API KEY ve gönderici etiket Test Kurum 01’e aitse):
  - Alıcı olarak **Test Kurum 02** VKN’yi kullanın: `1234567802`
  - **E-Fatura Merkezi** veya fatura oluşturma ekranından e-fatura gönderimini deneyin (UBL veya paneldeki “Fatura gönder” akışı varsa).
- Gönderim UBL ile yapılıyorsa **Gönderici etiketi** mutlaka kurulumda tanımlı olmalı.

---

## 5. Kontrol listesi

| Adım | Yapılacak | Beklenen |
|------|------------|----------|
| 1 | Bağlantıyı test et | “Bağlantı başarılı” |
| 2 | Gönderici etiketi + API KEY kaydet | Kayıt başarılı |
| 3 | VKN sorgula (örn. 1234567802) | Mükellef bilgisi döner |
| 4 | Gelen/giden fatura senkronize et | Liste gelir (boş da olabilir) |
| 5 | Test Kurum 01 → 02 fatura gönder | Gönderim başarılı veya NES’ten anlamlı hata |

---

## 6. Hata alırsanız

- **401 / Invalid JWT:** Çıkış yapıp tekrar giriş yapın; `verify_jwt = false` ve deploy’un uygulandığından emin olun.
- **404:** API adresinin `https://apitest.nes.com.tr` (sonunda `/` olmadan) olduğunu kontrol edin.
- **Bağlantı zaman aşımı:** NES test sunucusu veya ağ erişimi; bir süre sonra tekrar deneyin.

Test kurum bilgileri: `docs/NES-E-DONUSUM-API-TEST-BILGILERI.md`
