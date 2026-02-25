# Veritabanı Güvenlik Düzeltmeleri ve Leaked Password Protection

Bu doküman, migration `20260224130000_fix_rls_always_true_and_function_search_path.sql` ile yapılan değişikliklerin önemini ve **Leaked Password Protection** özelliğinin neden açılması gerektiğini özetler.

---

## 1. Bu Değişikliklerin Veritabanı Güvenliği Üzerindeki Önemi

### RLS Policy "Always True" Düzeltmesi

- **Sorun:** UPDATE, INSERT ve DELETE politikalarında `USING (true)` veya `WITH CHECK (true)` kullanımı, **tüm giriş yapmış kullanıcılara** ilgili tablodaki **tüm satırlara** erişim verir. Bu da:
  - Çok kiracılı (multi-tenant) uygulamalarda bir tenant’ın diğerinin verisini görmesine/düzenlemesine,
  - Yetkisiz kullanıcıların veriyi silmesine veya değiştirmesine
  yol açar. Veritabanı pratikte dış dünyaya açık hale gelir.

- **Çözüm:** Politikalar, **sadece ilgili satırın sahibi (tenant)** ile eşleşecek şekilde kısıtlandı: `tenant_id = (SELECT auth.uid())`. Böylece:
  - Her kullanıcı yalnızca kendi tenant’ına ait satırları görebilir, ekleyebilir, güncelleyebilir ve silebilir.
  - Veri izolasyonu ve çok kiracılı güvenlik sağlanır.

**Öncelik:** RLS politikalarındaki `true` değerlerini kaldırmak, veritabanınızın yetkisiz erişime tamamen açık kalmasını engellemek için **en öncelikli** adımdır.

### Function Search Path (Mutable Search Path) Düzeltmesi

- **Sorun:** `search_path` parametresi verilmeyen fonksiyonlarda PostgreSQL, fonksiyon çalışırken nesneleri (tablolar, sequence’ler vb.) bulmak için oturumun veya rolün `search_path` değerini kullanır. Kötü niyetli bir rol kendi şemasında aynı isimde nesneler (ör. `support_ticket_seq`) oluşturup, fonksiyonun bu nesneleri kullanmasını sağlayabilir (**search path enjeksiyonu**).

- **Çözüm:** `generate_ticket_number()` ve `set_ticket_number()` fonksiyonları `SET search_path = public` ile yeniden tanımlandı. Böylece fonksiyonlar her zaman `public` şemasındaki nesneleri kullanır; davranış tahmin edilebilir ve saldırı yüzeyi azalır.

---

## 2. Leaked Password Protection Neden Açılmalı?

**Leaked Password Protection**, Supabase Auth tarafında **sızıntıya uğramış şifre veritabanları** ile eşleşen giriş denemelerini engelleyen bir özelliktir.

- **Ne işe yarar?**  
  Kullanıcıların daha önce veri ihlallerinde (ör. başka sitelerdeki sızıntılar) ifşa olmuş şifreleri kullanmasını tespit eder. Bu tür şifrelerle yapılan giriş denemeleri reddedilir veya kullanıcı şifre değiştirmeye yönlendirilir.

- **Neden önemli?**  
  Saldırganlar çalınan e-posta/şifre listelerini birçok serviste dener (**credential stuffing**). Leaked Password Protection bu denemeleri azaltır ve hesap ele geçirme riskini düşürür.

- **Nereden açılır?**  
  **Supabase Dashboard → Authentication → Settings** bölümünde **Leaked Password Protection** seçeneğini açın. Ayrıntılar için [Supabase Auth docs](https://supabase.com/docs/guides/auth/auth-password-security#leaked-password-protection) sayfasına bakabilirsiniz.

Bu özelliğin açık olması, veritabanı güvenliği (RLS, search_path) ile birlikte **kimlik doğrulama katmanını** da güçlendirir.

---

## 3. Özet

| Konu | Önem |
|------|------|
| RLS "Always True" → tenant kısıtlı politikalar | Veritabanının yetkisiz erişime açık kalmasını engeller; **en öncelikli** düzeltme. |
| Function `search_path` | Search path enjeksiyonuna karşı fonksiyonları sabitler. |
| Leaked Password Protection | Credential stuffing ve sızıntıya uğramış şifrelerle girişi azaltır; **açılması önerilir.** |

Migration’ı uyguladıktan sonra Supabase Dashboard’da veritabanı linter’ını tekrar çalıştırarak uyarıların giderildiğini kontrol edebilirsiniz.
