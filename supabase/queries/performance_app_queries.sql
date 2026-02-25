-- =============================================================================
-- Uygulama odaklı performans analizi (pg_stat_statements)
-- PERFORMANCE_OPTIMIZATION_GUIDE.md ile birlikte kullanın.
-- Supabase SQL Editor'da veya psql ile çalıştırın.
-- =============================================================================

-- 1) Sistem rollerini hariç tut, en yavaş ortalama süre (uygulama sorguları)
SELECT
  pss.userid::regrole AS role_name,
  pss.calls,
  ROUND(pss.total_exec_time::numeric, 2) AS total_ms,
  ROUND(pss.mean_exec_time::numeric, 2) AS mean_ms,
  ROUND(pss.max_exec_time::numeric, 2) AS max_ms,
  LEFT(pss.query, 100) AS query_short
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

-- 2) Sadece uygulama rolleri (anon, authenticated, service_role)
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

-- 3) Realtime / list_changes hariç (kendi sorgularınıza odaklanın)
SELECT
  pss.userid::regrole AS role_name,
  pss.calls,
  ROUND(pss.mean_exec_time::numeric, 2) AS mean_ms,
  ROUND(pss.total_exec_time::numeric, 2) AS total_ms,
  LEFT(pss.query, 100) AS query_short
FROM pg_stat_statements pss
JOIN pg_roles r ON r.oid = pss.userid
WHERE r.rolname NOT IN (
  'postgres', 'authenticator', 'realtime',
  'supabase_admin', 'supabase_auth_admin', 'supabase_storage_admin',
  'supabase_read_only_user', 'pg_database_owner'
)
  AND pss.query NOT ILIKE '%realtime%'
  AND pss.query NOT ILIKE '%list_changes%'
ORDER BY pss.total_exec_time DESC
LIMIT 40;

-- 4) İstatistikleri sıfırla (yeni ölçüm penceresi için, dikkatli kullanın)
-- SELECT pg_stat_statements_reset();
