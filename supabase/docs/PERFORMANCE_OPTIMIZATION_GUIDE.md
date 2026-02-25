# Supabase Veritabanı Performans Optimizasyon Rehberi

Bu doküman üç ana başlığı kapsar: Realtime optimizasyonu, metadata overhead azaltma ve `pg_stat_statements` ile uygulama sorgularına odaklanma.

**Projede uygulanan iyileştirmeler:**
- `lib/realtime-utils.ts`: `subscribeMultiTable` (tek channel, çok tablo) ve `withDebounce` helper'ları.
- `contexts/site-config-context.tsx`: site_config, banners, navigation_menus için 3 ayrı channel yerine tek channel (`site_cms_realtime`).
- `hooks/use-ui-styles.ts`: Realtime refetch için 300ms debounce.
- `supabase/queries/performance_app_queries.sql`: Uygulama odaklı pg_stat_statements sorguları (SQL Editor'da çalıştırılabilir).
- `.env.example`: Sunucu tarafı bağlantıda pooler kullanımı notu.

---

## 1. Realtime Performansı: `realtime.list_changes` Optimizasyonu

`realtime.list_changes` milyonlarca kez çağrılıyorsa, Realtime abonelikleri çok sık tetikleniyor veya çok geniş kapsamlı (broad) dinleme yapılıyor demektir.

### 1.1 Abonelikleri Daraltın (Filtering)

- **Sadece ihtiyacınız olan tabloları** subscribe edin. Tüm public şemasını dinlemeyin.
- **Filtre kullanın:** Supabase Realtime'da `filter` ile sadece ilgili satırları dinleyin (örn. `eq('tenant_id', myTenantId)`).
- **Örnek (JS):**  
  `channel().on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: 'tenant_id=eq.' + tenantId }, callback)`  
  Böylece sadece o tenant’ın mesajları tetikler.

### 1.2 Broadcast Yerine Postgres Changes

- **Broadcast** her mesajda tüm dinleyicilere gider. Gerçekten “chat” tarzı anlık mesaj için gerekmiyorsa **Postgres Changes** (INSERT/UPDATE/DELETE) kullanın; sadece değişen satırlar için tetiklenir.
- Postgres Changes kullanırken yine **schema + table + filter** ile daraltın.

### 1.3 Gereksiz Realtime Kapatma

- Bazı tablolar için Realtime hiç gerekmiyorsa **Publication’dan çıkarın.**  
  Supabase varsayılan olarak `supabase_realtime` publication’ında tabloları listeler. Sadece gerçekten anlık takip etmeniz gereken tabloları bırakın:

```sql
-- Hangi tabloların Realtime'da olduğunu görün
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Publication'dan tablo çıkarmak (Supabase yönetiminde dikkatli kullanın)
-- Genelde Dashboard > Database > Replication > supabase_realtime üzerinden yapılır
```

- Dashboard: **Database → Replication → supabase_realtime** içinde sadece ihtiyaç duyduğunuz tabloları bırakın.

### 1.4 Debounce / Throttle (İstemci Tarafı)

- Aynı olay için çok sık güncelleme yapıyorsanız (örn. her tuş vuruşunda INSERT), istemcide **debounce** veya **throttle** kullanın; böylece Realtime tetikleme sayısı azalır.

### 1.5 Connection Pooling ve Realtime

- Realtime bağlantıları **session pool** kullanır. Çok sayıda eşzamanlı kullanıcı varsa **Supabase connection pooler (PgBouncer)** ayarlarını ve **Realtime max connections** limitlerini inceleyin (Supabase Dashboard / destek dokümanları).
- Mümkünse aynı kullanıcı için tek bir channel ile birden fazla table/filter kullanın; gereksiz channel sayısını düşürün.

### 1.6 Özet Strateji Listesi

| Strateji | Açıklama |
|----------|----------|
| Table filter | Sadece gerekli tabloları subscribe edin |
| Row filter | `filter` ile tenant_id / user_id vb. kısıtlayın |
| Publication | Realtime’da olması gerekmeyen tabloları publication’dan çıkarın |
| Broadcast → Postgres | Mümkünse Broadcast yerine Postgres Changes kullanın |
| Debounce | Sık INSERT/UPDATE’leri istemcide birleştirin |
| Channel sayısı | Gereksiz channel açmayın; tek channel, çok filter tercih edin |

---

## 2. Metadata / Overhead Sorgularını Azaltma (authenticator, postgres)

Timezone ve tablo yapısı gibi metadata sorguları bağlantı/sorgu başına 600ms+ ekliyorsa, bunlar genelde **her yeni bağlantıda** veya **her transaction’da** çalışan sistem sorgularıdır.

### 2.1 Connection Pooling (En Etkili Adım)

- **Supabase Pooler (PgBouncer)** kullanın: **Session mode** yerine **Transaction mode** bağlantı havuzu kullanıyorsanız, connection’lar kısa ömürlü olur ve her transaction’da yeniden “metadata” maliyeti oluşabilir.
- **Session mode** ile daha az bağlantı açılıp uzun süre tutulduğu için timezone/schema gibi session seviyesi metadata daha az tekrarlanır.
- **Öneri:** Uygulama bağlantıları için Supabase’in verdiği **pooler endpoint’i** (örn. `...pooler.supabase.com`) kullanın; direct Postgres port’u sadece migration/admin için kalsın.

### 2.2 PostgREST Tarafı

- PostgREST her istekte schema cache kullanır; bazen ilk isteklerde schema bilgisi tazelenir.
- **Connection pooler** kullanmak, PostgREST’in aynı pooler üzerinden az sayıda bağlantıyla çalışmasını sağlar; böylece metadata maliyeti dağılır.
- Supabase yönetiminde PostgREST ayarlarını doğrudan değiştiremeyebilirsiniz; bu yüzden **pooler + az sayıda kalıcı bağlantı** en pratik çözümdür.

### 2.3 Prisma Tarafı

- **Connection URL:** Supabase’in **pooler** adresini kullanın (ör. `postgresql://...@db....supabase.co:6543/postgres?pgbouncer=true` veya Supabase’in önerdiği connection string).
- **Prisma connection limit:** Çok fazla eşzamanlı bağlantı açmayın; connection_limit ile sınırlayın:

```env
# Örnek: Prisma connection string (pooler)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

- **Prepared statements:** Prisma hazır ifade kullanır; pooler **transaction mode**’daysa bazen prepared statement’lar beklenmedik şekilde kapatılabilir. Sorun yaşarsanız Supabase dokümanındaki “Prisma + Supabase” önerilerine bakın (örn. `?pgbouncer=true` ve gerekirse `prepared_statements=false` denemesi).
- **Cold start:** İlk sorgular yavaşsa bu büyük ölçüde connection + metadata maliyetidir; pooler ile bağlantılar ısınmış kalır, süre düşer.

### 2.4 Veritabanı Tarafı (Sınırlı Kontrol)

- **Timezone:** Uygulama ve veritabanı timezone’unu tutarlı seçin (örn. UTC). Böylece timezone dönüşümüne dair ek sorgular azalabilir.
- **search_path:** Bağlantıda `search_path` sabitlenmişse (örn. `SET search_path = public`), schema araması biraz sadeleşir; bu genelde RLS/fonksiyon güvenliği için zaten yapılıyor.

### 2.5 Özet

| Yöntem | Açıklama |
|--------|----------|
| Pooler kullanımı | Tüm uygulama trafiğini Supabase pooler (6543) üzerinden geçirin |
| Session mode | Mümkünse session mode pooler tercih edin (daha az metadata tekrarı) |
| Prisma connection_limit | Makul bir üst sınır koyun; bağlantı sayısını düşürün |
| Timezone tutarlılığı | Uygulama ve DB’de aynı timezone (örn. UTC) kullanın |

---

## 3. pg_stat_statements ile Uygulama Sorgularına Odaklanma

Genel yavaşlama hissettiğinizde, sistem/arka plan sorgularını eleyip **kendi uygulama sorgularınızı** öne çıkarmak için aşağıdaki filtreleri kullanabilirsiniz.

### 3.1 Hangi Rolleri Hariç Tutmalı?

- `authenticator`, `postgres`, `realtime`, `supabase_*` gibi roller çoğunlukla sistem/Realtime/metadata işlerini yapar.
- Uygulama sorguları genelde **anon** veya **authenticated** (veya kendi uygulama rolünüz) ile çalışır.

### 3.2 Örnek Sorgular (pg_stat_statements)

**Not:** `pg_stat_statements` extension’ı açık olmalı. Supabase’de genelde açıktır.

#### A) Sistem rollerini hariç tutup en yavaş ortalama süreye göre (uygulama odaklı)

```sql
SELECT
  pss.userid::regrole AS role_name,
  pss.queryid,
  LEFT(pss.query, 80) AS query_short,
  pss.calls,
  ROUND(pss.total_exec_time::numeric, 2) AS total_ms,
  ROUND(pss.mean_exec_time::numeric, 2) AS mean_ms,
  ROUND(pss.max_exec_time::numeric, 2) AS max_ms
FROM pg_stat_statements pss
JOIN pg_roles r ON r.oid = pss.userid
WHERE r.rolname NOT IN (
  'postgres',
  'authenticator',
  'realtime',
  'supabase_admin',
  'supabase_auth_admin',
  'supabase_storage_admin',
  'supabase_read_only_user',
  'pg_database_owner'
)
ORDER BY pss.mean_exec_time DESC
LIMIT 50;
```

#### B) Sadece belirli uygulama rollerine odaklanma (anon + authenticated)

```sql
SELECT
  pss.userid::regrole AS role_name,
  pss.calls,
  ROUND(pss.total_exec_time::numeric, 2) AS total_ms,
  ROUND(pss.mean_exec_time::numeric, 2) AS mean_ms,
  LEFT(pss.query, 120) AS query_short
FROM pg_stat_statements pss
JOIN pg_roles r ON r.oid = pss.userid
WHERE r.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY pss.total_exec_time DESC
LIMIT 30;
```

#### C) Realtime / list_changes’i tamamen hariç tutma

```sql
SELECT
  pss.userid::regrole AS role_name,
  pss.calls,
  ROUND(pss.mean_exec_time::numeric, 2) AS mean_ms,
  LEFT(pss.query, 100) AS query_short
FROM pg_stat_statements pss
JOIN pg_roles r ON r.oid = pss.userid
WHERE r.rolname NOT IN ('postgres', 'authenticator', 'realtime', 'supabase_admin', 'supabase_auth_admin', 'supabase_storage_admin', 'supabase_read_only_user', 'pg_database_owner')
  AND pss.query NOT ILIKE '%realtime%'
  AND pss.query NOT ILIKE '%list_changes%'
ORDER BY pss.total_exec_time DESC
LIMIT 40;
```

#### D) Yalnızca public şemasındaki tablolar (kendi tablolarınız)

```sql
SELECT
  pss.userid::regrole AS role_name,
  pss.calls,
  ROUND(pss.mean_exec_time::numeric, 2) AS mean_ms,
  LEFT(pss.query, 120) AS query_short
FROM pg_stat_statements pss
JOIN pg_roles r ON r.oid = pss.userid
WHERE r.rolname IN ('anon', 'authenticated', 'service_role')
  AND (
    pss.query ILIKE '%public.%'
    OR pss.query NOT LIKE '%pg_%'
  )
  AND pss.query NOT ILIKE '%pg_stat%'
  AND pss.query NOT ILIKE '%pg_catalog%'
ORDER BY pss.mean_exec_time DESC
LIMIT 30;
```

### 3.3 pg_stat_statements’i Sıfırlama (İsteğe Bağlı)

Belirli bir penceredeki istatistikleri temizleyip yeniden ölçmek için:

```sql
SELECT pg_stat_statements_reset();
```

(Dikkat: Tüm istatistikler sıfırlanır; production’da dikkatli kullanın.)

### 3.4 Pratik Akış

1. Genel yavaşlama hissettiğinizde **3.2.A** veya **3.2.C** ile sistem/realtime’u eleyip en yavaş ortalama süreye sahip sorgulara bakın.
2. **3.2.B** ile sadece anon/authenticated/service_role’e odaklanın.
3. Yavaş gördüğünüz sorguları uygulama kodunda veya RLS/index tarafında optimize edin; gerekirse **3.2.D** ile sadece public şema kullanımını inceleyin.

---

## Kısa Özet

| Konu | Öncelikli Adımlar |
|------|-------------------|
| **Realtime** | Abonelikleri daraltın (table + filter), publication’dan gereksiz tabloları çıkarın, debounce kullanın. |
| **Metadata overhead** | Tüm uygulama bağlantılarını pooler (6543) üzerinden verin; Prisma’da connection_limit ve pooler URL kullanın. |
| **pg_stat_statements** | Sistem rollerini ve `realtime`/`list_changes` içeren sorguları filtreleyip anon/authenticated odaklı sorgularla yavaş uygulama sorgularını tespit edin. |

Bu rehberi projede `supabase/docs/PERFORMANCE_OPTIMIZATION_GUIDE.md` olarak saklayabilir; gerektikçe Supabase Dashboard ve dokümanlarıyla birlikte güncelleyebilirsiniz.
