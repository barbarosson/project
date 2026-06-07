#!/usr/bin/env node
/**
 * Grant welcome bonus (100 credits) to eligible users missing a grant row.
 *
 * Usage:
 *   cd ai-suite
 *   $env:NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   node scripts/admin-welcome-bonus-backfill.mjs
 */

import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Ortam: NEXT_PUBLIC_SUPABASE_URL (veya SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("backfill_welcome_bonus_grants");
  if (error) throw error;

  console.log(`Backfill tamamlandı. Yeni bonus verilen kullanıcı sayısı: ${data ?? 0}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
