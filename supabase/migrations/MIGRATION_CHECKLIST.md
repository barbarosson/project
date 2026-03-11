# Migration kontrol listesi (Mart 2026 ve sonrası)

## Yapılan düzeltme
- **Çakışan version kaldırıldı:** İki dosya aynı version `20260307120000` kullanıyordu:
  - `20260307120000_add_edocuments_submenu_under_ebelge.sql` (kaldı)
  - `20260307120000_staff_rls_profiles_tenant.sql` → **20260307125000_staff_rls_profiles_tenant.sql** olarak yeniden adlandırıldı

## Sıralı migration listesi (uygulama sırasına göre)
| Version       | Dosya |
|---------------|--------|
| 20260307120000 | add_edocuments_submenu_under_ebelge.sql |
| 20260307125000 | staff_rls_profiles_tenant.sql |
| 20260307150000 | add_local_purchase_invoice_id_to_edocuments.sql |
| 20260310100000 | remove_edocuments_menu_keep_einvoice_center.sql |
| 20260311100000 | purchase_invoice_line_items_unit_price_precision.sql |

## Uzak veritabanında kontrol
Supabase **SQL Editor**'da çalıştırın:
```sql
SELECT version, name FROM supabase_migrations.schema_migrations
WHERE version >= '20260307000000'
ORDER BY version;
```
Yukarıdaki listede görünmeyen version'lar **eksik** demektir.

## Eksik migration'ları uygulama
1. **Tercih:** `npx supabase db push --include-all` (artık tek 20260307120000 olduğu için deneyebilirsiniz)
2. **Alternatif:** Eksik migration'ların SQL içeriğini kopyalayıp SQL Editor'da sırayla çalıştırın; sonra ilgili version'ı `schema_migrations` tablosuna ekleyin.
