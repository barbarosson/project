# Supabase migration'ları remote'a gönderme (adım adım)

Bu rehber, projedeki `supabase/migrations/` dosyalarını Supabase Dashboard’daki (hosted) projene uygulamak için kullanılır.

---

## 1. Supabase CLI’ın yüklü olduğundan emin ol

Terminalde:

```bash
npx supabase --version
```

Versiyon görünüyorsa devam et. Hata alırsan önce proje kökünde `npm install` çalıştır (Supabase paketi projede varsa) veya global yükle:

```bash
npm install -g supabase
```

---

## 2. PROJECT_REF (Reference ID) bul

1. [Supabase Dashboard](https://supabase.com/dashboard) → giriş yap.
2. İlgili projeyi seç (production/staging).
3. Sol menüden **Project Settings** (dişli ikon).
4. **General** sekmesine gir.
5. **Reference ID** satırındaki değeri kopyala (örnek: `abcdefghijklmnop`). Bu senin `<PROJECT_REF>` değerin.

---

## 3. Proje kökünde terminal aç

Projenin kök dizininde ol (örn. `project` klasörü):

```bash
cd "c:\Cursor\project-bolt-sb1-mzpfuu72 (2)\project"
```

---

## 4. Supabase hesabına giriş yap (ilk seferde)

CLI’ın projeye erişebilmesi için önce giriş yapman gerekir:

```bash
npx supabase login
```

Tarayıcı açılır; Supabase hesabınla giriş yapıp yetki ver. “Access token not provided” hatası bu adım atlanırsa oluşur.

---

## 5. Projeyi linkle (ilk seferde veya farklı projeye geçerken)

```bash
npx supabase link --project-ref PROJECT_REF
```

**Önemli:** `PROJECT_REF` yerine 2. adımda kopyaladığın Reference ID’yi **sadece harf/rakam olarak** yaz. **`<` ve `>` karakterlerini yazma** (PowerShell/Windows’ta hata verir). Tırnak da gerekmez.

Örnek (Reference ID’n `itvrvouaxcutpetyzhvg` ise):

```bash
npx supabase link --project-ref itvrvouaxcutpetyzhvg
```

- **Database password** sorulursa: Supabase projesini oluştururken verdiğin veritabanı şifresini gir (unuttuysan Dashboard → Project Settings → Database → “Reset database password” ile sıfırlayabilirsin).
- Link başarılı olunca “Linked to project …” benzeri bir mesaj görürsün.

---

## 6. Migration’ları remote’a gönder

```bash
npx supabase db push
```

- Henüz uygulanmamış tüm migration’lar remote veritabanına uygulanır.
- Hata alırsan çıktıyı oku; genelde şifre hatası, bağlantı veya tek bir migration’daki SQL hatası olur.

---

## 7. Kontrol

- Supabase Dashboard → **Table Editor** veya **SQL Editor** ile tabloları / kolonları kontrol et (örn. `invoices.invoice_type`).
- İstersen Dashboard’da **Database** → **Migrations** bölümüne bak; uygulanan migration’lar listelenir (Supabase sürümüne göre bu ekran farklı olabilir).

---

## Özet komutlar (Reference ID’yi koyduktan sonra)

```bash
cd "c:\Cursor\project-bolt-sb1-mzpfuu72 (2)\project"
npx supabase login
npx supabase link --project-ref PROJECT_REF
npx supabase db push
```

(`PROJECT_REF` yerine kendi ID’ni yaz, **`<` `>` kullanma**.)

Daha sonra sadece yeni migration eklediğinde aynı dizinde `npx supabase db push` çalıştırman yeterli; link zaten kayıtlı kalır.

---

## Sorun giderme: "Remote migration versions not found in local"

Remote'da uygulanmış görünen migration'lar local klasörde yoksa `db push` hata verir. Bu durumda remote'daki migration geçmişini "reverted" ile düzeltip sonra tekrar push edebilirsin.

1. Hangi sürümlerin sadece remote'da olduğunu gör:
   ```bash
   npx supabase migration list
   ```
   (Sadece **Remote** sütununda dolu, **Local** boş olan satırlar sorunludur.)

2. Bu sürümleri "reverted" olarak işaretle (tek komutta, boşlukla ayrılmış):
   ```bash
   npx supabase migration repair --status reverted 20260122105247 20260122105728 20260127130434 20260127184909 20260128045949 20260129085128 20260130111526 20260130134401 20260130134600 20260206101539 20260206101654 20260206114540 20260211223741 20260211223849 20260211224024 20260211224031 20260211224038 20260211224122 20260211224201 20260211224326 20260211224332 20260211224451 20260211224457 20260211224543 20260211224746 20260211224752 20260211224759 20260211224805 20260211224834 20260211225031 20260211231934 20260211232020 20260211232027 20260211232033 20260211232040 20260217081031 20260217084523 20260217084529
   ```

3. Sonra tekrar push et:
   ```bash
   npx supabase db push
   ```
