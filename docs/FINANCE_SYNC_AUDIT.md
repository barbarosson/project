# Finans Senkronizasyon Kontrolü

Fatura / ödeme / gider işlemlerinde tüm hesaplamaların (cari bakiye, eldeki nakit, gelir, faturalama, gider, cari sayısı) birbirine bağlı ve tutarlı güncellenmesi için yapılan kontrol ve düzeltmeler.

## Senkronize Edilen Noktalar

| Olay | Cari bakiye | Eldeki nakit (accounts) | Fatura paid_amount | Gider paid_amount | Not |
|------|-------------|-------------------------|--------------------|-------------------|-----|
| **Fatura eklenmesi** | ✅ Artar (bulk/create + edit-invoice) | — | — | — | balance += total |
| **Fatura silinmesi (tek)** | ✅ Azalır | — | — | — | balance -= total (sadece ödemesi olmayan) |
| **Fatura toplu silme** | ✅ Azalır | — | — | — | Her cari için silinen tutarlar toplanıp balance’dan düşülür |
| **Ödeme eklenmesi** (record-payment) | ✅ Azalır | ✅ Trigger | ✅ Artar | ✅ (gider için) | balance -= amount; trigger hesap bakiyesini günceller |
| **Ödemelerin silinmesi** (işlem silme) | ✅ Artar (geri eklenir) | ✅ Trigger | ✅ Azalır | ✅ Azalır | balance += amount; fatura/gider paid_amount düşülür; trigger hesabı günceller |
| **İşlem faturaya eşlenmesi** | ✅ Azalır | — | ✅ Artar | — | Eşleme sırasında paid_amount ve cari bakiye güncellenir; transaction customer_id set edilir |
| **Gider girilmesi** | — | — | — | — | Sadece expenses kaydı |
| **Gider ödemesi** | — | ✅ Trigger | — | ✅ Artar | record-payment-dialog + trigger |
| **Gider silinmesi** | — | — | — | — | Ödemeli gider silinirse ilgili transactions durur; hesap bakiyesi trigger ile zaten doğru |

## Veri Kaynakları

- **Eldeki nakit:** `accounts.current_balance` — `transactions` üzerindeki trigger (`update_account_balance`) ile INSERT/UPDATE/DELETE’te güncellenir.
- **Cari bakiye:** `customers.balance` — Uygulama tarafında fatura ekleme/ödeme/fatura silme ve işlem silme/eşlemede güncellenir.
- **Fatura ödenen tutar:** `invoices.paid_amount` — record-payment, işlem silme, işlem–fatura eşlemesi ve migration (transactions’tan yeniden hesaplama) ile tutarlı.
- **Gider ödenen tutar:** `expenses.paid_amount` — record-payment ve işlem silmede güncellenir.
- **Dashboard / raporlar:** Yukarıdaki tablolardan ve view’lardan okur; veri doğruysa rakamlar tutarlıdır.

## Yapılan Düzeltmeler (bu tur)

1. **İşlem silindiğinde cari bakiye:** Tahsilat (invoice payment) silinince cari bakiyeye tutar geri eklendi (tek silme + toplu silme).
2. **Fatura toplu silmede cari:** Toplu fatura silmede her carinin bakiyesi, silinen faturaların toplamı kadar düşülecek şekilde güncellendi.
3. **Tek fatura silmede tutar:** Cari güncellemesinde `total ?? amount` kullanıldı, bakiye negatif olmaması için `Math.max(0, ...)` eklendi.
4. **add-transaction-dialog:** Hesap bakiyesi artık yalnızca trigger ile güncelleniyor; uygulama tarafındaki çift güncelleme kaldırıldı.
5. **İşlem–fatura eşlemesi:** Eşleme yapılınca fatura `paid_amount`, `remaining_amount`, `status` ve ilgili carinin `balance` değeri güncelleniyor; transaction’a `customer_id` atanıyor (tahsilat silindiğinde cari doğru güncellenir).

## Notlar

- Gider kaydı silindiğinde, o gidere ait ödeme işlemleri (`transactions`) silinmez; hesap bakiyesi trigger sayesinde doğru kalır. İsterseniz “ödemesi olan gider silinemesin” kuralı eklenebilir.
- Cari sayısı ve segmentler (Yeni Potansiyeller vb.) `customers` + segment hesaplamasından gelir; fatura/ödeme değişince sadece bakiye ve fatura durumu değişir, cari listesi aynı kalır.
